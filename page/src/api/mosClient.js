// Thin wrapper around the MOS REST API.
//
// Confirmed against mos-api's src/index.js router mounts (not guessed):
//   app.use('/api/v1/docker/mos/compose', authenticateToken, dockerComposeRoutes);
//   app.use('/api/v1/docker', authenticateToken, dockerRoutes);
//   app.use('/api/v1/mos/plugins', authenticateToken, pluginsRoutes);
// All of them require Bearer auth (authenticateToken middleware). Since a
// plugin page is loaded same-origin into the MOS host app, it shares
// localStorage with it - mos-frontend itself reads the token from
// localStorage.getItem('authToken') (see usePlugins.ts / plugins.vue), so
// this does the same rather than expecting something plugin-specific.
const API_BASE = import.meta.env.VITE_MOS_API_BASE || "/api/v1";
const DEV_TOKEN = import.meta.env.VITE_MOS_API_TOKEN || "";

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("authToken") || DEV_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Not JSON - almost certainly the SPA's index.html catch-all, which
      // means `path` doesn't match a real backend route (wrong prefix) or
      // auth redirected. Surface something actionable instead of a raw
      // "Unexpected token '<'" parse error.
      throw new Error(`${method} ${path} did not return JSON (HTTP ${res.status}) - check the API path/auth`);
    }
  }

  if (!res.ok) {
    const error = new Error(data?.error || `${method} ${path} failed (${res.status})`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

const PLUGIN_NAME = "ai-template-maker";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const mosClient = {
  getSettings() {
    return request(`/mos/plugins/settings/${PLUGIN_NAME}`);
  },
  saveSettings(settings) {
    return request(`/mos/plugins/settings/${PLUGIN_NAME}`, { method: "POST", body: settings });
  },
  async analyzeRepo(repoUrl, { scope = "required", pollIntervalMs = 2500, maxWaitMs = 60 * 60 * 1000, signal, onTick, onJobStarted } = {}) {
    // Analysis can comfortably exceed MOS's 60s synchronous query ceiling
    // (seen in practice on Ollama with a modest model/no GPU), and that
    // ceiling isn't adjustable - so this doesn't call the analyze script
    // directly. Instead: ai-template-maker-analyze-start kicks the real
    // work off as a detached background job and returns a job id almost
    // instantly, then this polls ai-template-maker-analyze-status until
    // the job is done or errored. Both calls use the same
    // {success, output, exit_code, duration_ms, timed_out} query envelope
    // as before; `output` is each script's own parsed JSON.
    const startRes = await request("/mos/plugins/query", {
      method: "POST",
      body: { command: "ai-template-maker-analyze-start", args: [repoUrl, scope], timeout: 15, parse_json: true }
    });
    if (!startRes.success) {
      throw new Error(typeof startRes.output === "string" ? startRes.output : `Could not start analysis (exit ${startRes.exit_code})`);
    }
    if (startRes.output?.error) {
      throw new Error(startRes.output.error);
    }
    const jobId = startRes.output?.job_id;
    if (!jobId) {
      throw new Error("Could not start analysis (no job id returned)");
    }
    onJobStarted?.(jobId);

    const deadline = Date.now() + maxWaitMs;
    for (;;) {
      if (signal?.aborted) {
        throw new DOMException("Analysis cancelled", "AbortError");
      }
      if (Date.now() > deadline) {
        throw new Error(
          `Still running after ${Math.round(maxWaitMs / 60000)} minutes - it's still running in the ` +
            "background on the MOS host; check the History tab later, or use Cancel to actually stop it."
        );
      }
      await sleep(pollIntervalMs);
      onTick?.();

      const statusRes = await request("/mos/plugins/query", {
        method: "POST",
        body: { command: "ai-template-maker-analyze-status", args: [jobId], timeout: 15, parse_json: true }
      });
      if (!statusRes.success) {
        throw new Error(typeof statusRes.output === "string" ? statusRes.output : `Could not check analysis status (exit ${statusRes.exit_code})`);
      }
      const out = statusRes.output;
      if (out?.error) {
        throw new Error(out.error);
      }
      if (out?.status === "running") {
        continue;
      }
      if (out?.status === "cancelled") {
        throw new DOMException("Analysis cancelled", "AbortError");
      }
      if (out?.status === "error") {
        throw new Error(out.error || "Analysis failed");
      }
      if (out?.status === "done") {
        const result = out.result;
        if (result && typeof result === "object" && result.error) {
          throw new Error(result.error);
        }
        if (!result || typeof result !== "object") {
          throw new Error("Analysis script did not return valid JSON");
        }
        return result;
      }
      throw new Error("Unexpected response while checking analysis status");
    }
  },
  async cancelAnalysis(jobId) {
    // Best-effort: if this fails, the frontend has already stopped
    // watching the job either way (see analyzeRepo's AbortError path) - a
    // failure here just means the background process keeps running until
    // it finishes on its own, not that the user's Cancel click did nothing
    // visible.
    try {
      const res = await request("/mos/plugins/query", {
        method: "POST",
        body: { command: "ai-template-maker-analyze-cancel", args: [jobId], timeout: 15, parse_json: true }
      });
      return !!(res.success && res.output?.ok);
    } catch {
      return false;
    }
  },
  createContainer(template) {
    return request("/docker/mos/create", { method: "POST", body: template });
  },
  async getUsedPorts() {
    // GET /api/v1/docker/mos/ports (confirmed against mos-api's
    // docker.service.js getDockerPorts, the same endpoint the native
    // create/compose dialogs' "Inspect"/"show used ports" panel uses) -
    // returns a bare array of {port, proto, name, status} for every host
    // port currently bound by an existing container. Best-effort: a
    // failure here (e.g. no docker.sock access) shouldn't block install,
    // it just means no conflict warning gets shown.
    try {
      const ports = await request("/docker/mos/ports");
      return Array.isArray(ports) ? ports : [];
    } catch {
      return [];
    }
  },
  // Shared by all three test*Connection methods below - each just picks the
  // command and positional args for its own ai-template-maker-test-<provider>
  // script, all of which share the same {ok, models, model_found} /
  // {ok:false, error} response shape. Tests whatever's currently typed in
  // the Settings form, not what's saved - so a bad key/host/model can be
  // caught while configuring, before ever running a real (potentially
  // multi-minute) analysis against it.
  async _testProviderConnection(command, args) {
    const res = await request("/mos/plugins/query", {
      method: "POST",
      body: { command, args, timeout: 15, parse_json: true }
    });
    if (!res.success) {
      throw new Error(typeof res.output === "string" ? res.output : `Could not test connection (exit ${res.exit_code})`);
    }
    if (!res.output || typeof res.output !== "object") {
      throw new Error("Test script did not return valid JSON");
    }
    if (!res.output.ok) {
      throw new Error(res.output.error || "Connection test failed");
    }
    return res.output;
  },
  testOllamaConnection(host, model) {
    return this._testProviderConnection("ai-template-maker-test-ollama", model ? [host, model] : [host]);
  },
  testAnthropicConnection(apiKey, model) {
    return this._testProviderConnection("ai-template-maker-test-anthropic", model ? [apiKey, model] : [apiKey]);
  },
  testGeminiConnection(apiKey, model) {
    return this._testProviderConnection("ai-template-maker-test-gemini", model ? [apiKey, model] : [apiKey]);
  },
  testOpenaiConnection(baseUrl, apiKey, model) {
    // apiKey/model are positional and optional (most local OpenAI-
    // compatible servers ignore the key), so empty strings are passed
    // explicitly rather than omitted - omitting a middle argument would
    // shift what the later one means.
    return this._testProviderConnection("ai-template-maker-test-openai", [baseUrl, apiKey || "", model || ""]);
  },
  createStack({ name, yaml, env, icon, webui, autostart = false, no_autoupdate = false }) {
    return request("/docker/mos/compose/stacks", {
      method: "POST",
      body: { name, yaml, env, icon, webui, autostart, no_autoupdate }
    });
  },
  async getHistory() {
    // Same query envelope as analyzeRepo. Read-only and best-effort - an
    // empty history tab isn't worth surfacing an error banner over.
    const res = await request("/mos/plugins/query", {
      method: "POST",
      body: { command: "ai-template-maker-history", args: ["list"], timeout: 10, parse_json: true }
    });
    return res.success && Array.isArray(res.output) ? res.output : [];
  },
  async clearHistory() {
    const res = await request("/mos/plugins/query", {
      method: "POST",
      body: { command: "ai-template-maker-history", args: ["clear"], timeout: 10, parse_json: true }
    });
    if (!res.success) throw new Error("Could not clear history");
    return true;
  },
  async deleteHistoryEntry(id) {
    const res = await request("/mos/plugins/query", {
      method: "POST",
      body: { command: "ai-template-maker-history", args: ["delete", id], timeout: 10, parse_json: true }
    });
    if (!res.success) throw new Error("Could not delete this history entry");
    if (res.output?.error) throw new Error(res.output.error);
    return Array.isArray(res.output) ? res.output : [];
  }
};
