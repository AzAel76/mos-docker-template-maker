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

export const mosClient = {
  getSettings() {
    return request(`/mos/plugins/settings/${PLUGIN_NAME}`);
  },
  saveSettings(settings) {
    return request(`/mos/plugins/settings/${PLUGIN_NAME}`, { method: "POST", body: settings });
  },
  analyzeRepo(repoUrl, { timeout = 60 } = {}) {
    return request("/mos/plugins/query", {
      method: "POST",
      body: {
        command: "ai-template-maker-analyze",
        args: [repoUrl],
        timeout,
        parse_json: true
      }
    });
  },
  createContainer(template) {
    return request("/docker/mos/create", { method: "POST", body: template });
  },
  createStack({ name, yaml, env, icon, webui, autostart = false, no_autoupdate = false }) {
    return request("/docker/mos/compose/stacks", {
      method: "POST",
      body: { name, yaml, env, icon, webui, autostart, no_autoupdate }
    });
  }
};
