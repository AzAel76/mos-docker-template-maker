// Thin wrapper around the MOS REST API.
//
// NOTE (verify against a real MOS instance, see plan step 6): the exact way
// a federated plugin page authenticates against the host's API is not
// documented. This assumes the plugin page is served same-origin with the
// MOS frontend and rides along on its session/cookie, which is the common
// pattern for module-federation "micro frontends" embedded in a host app.
// If MOS instead expects an explicit Bearer token, the host is expected to
// expose it (e.g. `window.__MOS_API_TOKEN__` or a provide/inject value) —
// wire that in here once confirmed.
const API_BASE = import.meta.env.VITE_MOS_API_BASE || "";
const DEV_TOKEN = import.meta.env.VITE_MOS_API_TOKEN || "";

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = window.__MOS_API_TOKEN__ || DEV_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

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
    return request("/mos/create", { method: "POST", body: template });
  },
  createStack({ name, yaml, env, icon, webui, autostart = false, no_autoupdate = false }) {
    return request("/stacks", {
      method: "POST",
      body: { name, yaml, env, icon, webui, autostart, no_autoupdate }
    });
  }
};
