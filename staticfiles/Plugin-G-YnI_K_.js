import { r as importShared } from "./_virtual___federation_fn_import-fHUJv7KH.js";
//#region src/api/mosClient.js
var API_BASE = "/api/v1";
var DEV_TOKEN = "";
async function request(path, { method = "GET", body } = {}) {
	const headers = { "Content-Type": "application/json" };
	const token = localStorage.getItem("authToken") || DEV_TOKEN;
	if (token) headers.Authorization = `Bearer ${token}`;
	const res = await fetch(`${API_BASE}${path}`, {
		method,
		headers,
		credentials: "include",
		body: body !== void 0 ? JSON.stringify(body) : void 0
	});
	const text = await res.text();
	let data = null;
	if (text) try {
		data = JSON.parse(text);
	} catch {
		throw new Error(`${method} ${path} did not return JSON (HTTP ${res.status}) - check the API path/auth`);
	}
	if (!res.ok) {
		const error = new Error(data?.error || `${method} ${path} failed (${res.status})`);
		error.status = res.status;
		error.data = data;
		throw error;
	}
	return data;
}
var PLUGIN_NAME = "ai-template-maker";
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var mosClient = {
	getSettings() {
		return request(`/mos/plugins/settings/${PLUGIN_NAME}`);
	},
	saveSettings(settings) {
		return request(`/mos/plugins/settings/${PLUGIN_NAME}`, {
			method: "POST",
			body: settings
		});
	},
	async analyzeRepo(repoUrl, { scope = "required", pollIntervalMs = 2500, maxWaitMs = 36e5, signal, onTick, onJobStarted } = {}) {
		const startRes = await request("/mos/plugins/query", {
			method: "POST",
			body: {
				command: "ai-template-maker-analyze-start",
				args: [repoUrl, scope],
				timeout: 15,
				parse_json: true
			}
		});
		if (!startRes.success) throw new Error(typeof startRes.output === "string" ? startRes.output : `Could not start analysis (exit ${startRes.exit_code})`);
		if (startRes.output?.error) throw new Error(startRes.output.error);
		const jobId = startRes.output?.job_id;
		if (!jobId) throw new Error("Could not start analysis (no job id returned)");
		onJobStarted?.(jobId);
		const deadline = Date.now() + maxWaitMs;
		for (;;) {
			if (signal?.aborted) throw new DOMException("Analysis cancelled", "AbortError");
			if (Date.now() > deadline) throw new Error(`Still running after ${Math.round(maxWaitMs / 6e4)} minutes - it's still running in the background on the MOS host; check the History tab later, or use Cancel to actually stop it.`);
			await sleep(pollIntervalMs);
			onTick?.();
			const statusRes = await request("/mos/plugins/query", {
				method: "POST",
				body: {
					command: "ai-template-maker-analyze-status",
					args: [jobId],
					timeout: 15,
					parse_json: true
				}
			});
			if (!statusRes.success) throw new Error(typeof statusRes.output === "string" ? statusRes.output : `Could not check analysis status (exit ${statusRes.exit_code})`);
			const out = statusRes.output;
			if (out?.error) throw new Error(out.error);
			if (out?.status === "running") continue;
			if (out?.status === "cancelled") throw new DOMException("Analysis cancelled", "AbortError");
			if (out?.status === "error") throw new Error(out.error || "Analysis failed");
			if (out?.status === "done") {
				const result = out.result;
				if (result && typeof result === "object" && result.error) throw new Error(result.error);
				if (!result || typeof result !== "object") throw new Error("Analysis script did not return valid JSON");
				return result;
			}
			throw new Error("Unexpected response while checking analysis status");
		}
	},
	async cancelAnalysis(jobId) {
		try {
			const res = await request("/mos/plugins/query", {
				method: "POST",
				body: {
					command: "ai-template-maker-analyze-cancel",
					args: [jobId],
					timeout: 15,
					parse_json: true
				}
			});
			return !!(res.success && res.output?.ok);
		} catch {
			return false;
		}
	},
	createContainer(template) {
		return request("/docker/mos/create", {
			method: "POST",
			body: template
		});
	},
	async getUsedPorts() {
		try {
			const ports = await request("/docker/mos/ports");
			return Array.isArray(ports) ? ports : [];
		} catch {
			return [];
		}
	},
	async _testProviderConnection(command, args) {
		const res = await request("/mos/plugins/query", {
			method: "POST",
			body: {
				command,
				args,
				timeout: 15,
				parse_json: true
			}
		});
		if (!res.success) throw new Error(typeof res.output === "string" ? res.output : `Could not test connection (exit ${res.exit_code})`);
		if (!res.output || typeof res.output !== "object") throw new Error("Test script did not return valid JSON");
		if (!res.output.ok) throw new Error(res.output.error || "Connection test failed");
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
	createStack({ name, yaml, env, icon, webui, autostart = false, no_autoupdate = false }) {
		return request("/docker/mos/compose/stacks", {
			method: "POST",
			body: {
				name,
				yaml,
				env,
				icon,
				webui,
				autostart,
				no_autoupdate
			}
		});
	},
	async getHistory() {
		const res = await request("/mos/plugins/query", {
			method: "POST",
			body: {
				command: "ai-template-maker-history",
				args: ["list"],
				timeout: 10,
				parse_json: true
			}
		});
		return res.success && Array.isArray(res.output) ? res.output : [];
	},
	async clearHistory() {
		if (!(await request("/mos/plugins/query", {
			method: "POST",
			body: {
				command: "ai-template-maker-history",
				args: ["clear"],
				timeout: 10,
				parse_json: true
			}
		})).success) throw new Error("Could not clear history");
		return true;
	}
};
//#endregion
//#region src/components/AnalyzeForm.vue
var { createElementVNode: _createElementVNode$5, toDisplayString: _toDisplayString$4, createTextVNode: _createTextVNode$5, resolveComponent: _resolveComponent$5, withCtx: _withCtx$5, openBlock: _openBlock$5, createBlock: _createBlock$4, createCommentVNode: _createCommentVNode$4, withKeys: _withKeys, createVNode: _createVNode$5 } = await importShared("vue");
var _hoisted_1$3 = { class: "mt-2" };
var _hoisted_2$3 = { class: "text-caption text-medium-emphasis mt-1" };
var { ref: ref$4, computed: computed$1 } = await importShared("vue");
var _sfc_main$5 = {
	__name: "AnalyzeForm",
	emits: ["open-result"],
	setup(__props, { emit: __emit }) {
		const emit = __emit;
		const repoUrl = ref$4("");
		const scope = ref$4("required");
		const analyzing = ref$4(false);
		const error = ref$4("");
		const elapsedSeconds = ref$4(0);
		const currentProvider = ref$4("");
		const elapsedLabel = computed$1(() => elapsedSeconds.value > 0 ? ` (${elapsedSeconds.value}s)` : "");
		const providerLabel = computed$1(() => {
			switch (currentProvider.value) {
				case "gemini": return "Google Gemini";
				case "ollama": return "Ollama (local)";
				case "anthropic": return "Anthropic (Claude)";
				default: return "";
			}
		});
		const analyzingHint = computed$1(() => currentProvider.value === "ollama" ? " — a local model can take several minutes with no GPU; this keeps waiting until it finishes." : " — this is usually quick.");
		let controller = null;
		let currentJobId = null;
		async function analyze() {
			analyzing.value = true;
			error.value = "";
			elapsedSeconds.value = 0;
			currentProvider.value = "";
			currentJobId = null;
			controller = new AbortController();
			const startedAt = Date.now();
			try {
				try {
					const settings = await mosClient.getSettings();
					currentProvider.value = settings?.provider || "anthropic";
				} catch {
					currentProvider.value = "";
				}
				const data = await mosClient.analyzeRepo(repoUrl.value.trim(), {
					scope: scope.value,
					signal: controller.signal,
					onTick: () => {
						elapsedSeconds.value = Math.round((Date.now() - startedAt) / 1e3);
					},
					onJobStarted: (jobId) => {
						currentJobId = jobId;
					}
				});
				emit("open-result", data);
			} catch (e) {
				if (e.name !== "AbortError") error.value = e.message;
			} finally {
				analyzing.value = false;
				controller = null;
			}
		}
		function cancel() {
			controller?.abort();
			if (currentJobId) mosClient.cancelAnalysis(currentJobId);
		}
		return (_ctx, _cache) => {
			const _component_v_alert = _resolveComponent$5("v-alert");
			const _component_v_text_field = _resolveComponent$5("v-text-field");
			const _component_v_btn = _resolveComponent$5("v-btn");
			const _component_v_btn_toggle = _resolveComponent$5("v-btn-toggle");
			const _component_v_card_text = _resolveComponent$5("v-card-text");
			const _component_v_spacer = _resolveComponent$5("v-spacer");
			const _component_v_card_actions = _resolveComponent$5("v-card-actions");
			const _component_v_card = _resolveComponent$5("v-card");
			return _openBlock$5(), _createBlock$4(_component_v_card, { flat: "" }, {
				default: _withCtx$5(() => [_createVNode$5(_component_v_card_text, null, {
					default: _withCtx$5(() => [
						_cache[5] || (_cache[5] = _createElementVNode$5("p", { class: "text-body-2 text-medium-emphasis mb-4" }, " Paste a GitHub repository URL. Your configured AI provider will look at its README, Dockerfile, and any Compose file to build a MOS template, resolve an icon, and let you review it before installing. ", -1)),
						error.value ? (_openBlock$5(), _createBlock$4(_component_v_alert, {
							key: 0,
							type: "error",
							variant: "tonal",
							density: "compact",
							class: "mb-4"
						}, {
							default: _withCtx$5(() => [_createTextVNode$5(_toDisplayString$4(error.value), 1)]),
							_: 1
						})) : _createCommentVNode$4("", true),
						_createVNode$5(_component_v_text_field, {
							modelValue: repoUrl.value,
							"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => repoUrl.value = $event),
							label: "GitHub repository URL",
							placeholder: "https://github.com/owner/repo",
							disabled: analyzing.value,
							onKeyup: _withKeys(analyze, ["enter"])
						}, null, 8, ["modelValue", "disabled"]),
						analyzing.value ? (_openBlock$5(), _createBlock$4(_component_v_alert, {
							key: 1,
							type: "info",
							variant: "tonal",
							density: "compact",
							class: "mt-2"
						}, {
							default: _withCtx$5(() => [_createTextVNode$5(" Analyzing with " + _toDisplayString$4(providerLabel.value || "your configured provider") + _toDisplayString$4(elapsedLabel.value) + _toDisplayString$4(analyzingHint.value), 1)]),
							_: 1
						})) : _createCommentVNode$4("", true),
						_createElementVNode$5("div", _hoisted_1$3, [
							_cache[4] || (_cache[4] = _createElementVNode$5("div", { class: "text-body-2 text-medium-emphasis mb-1" }, "Template scope", -1)),
							_createVNode$5(_component_v_btn_toggle, {
								modelValue: scope.value,
								"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => scope.value = $event),
								color: "primary",
								density: "comfortable",
								mandatory: "",
								variant: "outlined",
								disabled: analyzing.value,
								divided: ""
							}, {
								default: _withCtx$5(() => [_createVNode$5(_component_v_btn, { value: "required" }, {
									default: _withCtx$5(() => [..._cache[2] || (_cache[2] = [_createTextVNode$5("Required only", -1)])]),
									_: 1
								}), _createVNode$5(_component_v_btn, { value: "all" }, {
									default: _withCtx$5(() => [..._cache[3] || (_cache[3] = [_createTextVNode$5("All settings", -1)])]),
									_: 1
								})]),
								_: 1
							}, 8, ["modelValue", "disabled"]),
							_createElementVNode$5("div", _hoisted_2$3, _toDisplayString$4(scope.value === "required" ? "Only what's needed to run - fewer fields, but you may need to add something back later." : "Every setting found in the repo's docs - a longer list you can freely delete from."), 1)
						])
					]),
					_: 1
				}), _createVNode$5(_component_v_card_actions, null, {
					default: _withCtx$5(() => [
						_createVNode$5(_component_v_spacer),
						analyzing.value ? (_openBlock$5(), _createBlock$4(_component_v_btn, {
							key: 0,
							variant: "text",
							onClick: cancel
						}, {
							default: _withCtx$5(() => [..._cache[6] || (_cache[6] = [_createTextVNode$5("Cancel", -1)])]),
							_: 1
						})) : _createCommentVNode$4("", true),
						_createVNode$5(_component_v_btn, {
							color: "primary",
							loading: analyzing.value,
							disabled: !repoUrl.value,
							onClick: analyze
						}, {
							default: _withCtx$5(() => [..._cache[7] || (_cache[7] = [_createTextVNode$5(" Analyze ", -1)])]),
							_: 1
						}, 8, ["loading", "disabled"])
					]),
					_: 1
				})]),
				_: 1
			});
		};
	}
};
//#endregion
//#region src/components/HistoryList.vue
var { toDisplayString: _toDisplayString$3, createTextVNode: _createTextVNode$4, resolveComponent: _resolveComponent$4, withCtx: _withCtx$4, openBlock: _openBlock$4, createBlock: _createBlock$3, createCommentVNode: _createCommentVNode$3, createVNode: _createVNode$4, createElementBlock: _createElementBlock$3, renderList: _renderList$2, Fragment: _Fragment$3, createElementVNode: _createElementVNode$4 } = await importShared("vue");
var _hoisted_1$2 = {
	key: 1,
	class: "d-flex justify-center py-8"
};
var _hoisted_2$2 = {
	key: 2,
	class: "text-body-2 text-medium-emphasis text-center py-8"
};
var _hoisted_3$1 = { class: "text-caption" };
var { ref: ref$3, onMounted: onMounted$1 } = await importShared("vue");
var _sfc_main$4 = {
	__name: "HistoryList",
	emits: ["open-result"],
	setup(__props) {
		const entries = ref$3([]);
		const loading = ref$3(true);
		const clearing = ref$3(false);
		const error = ref$3("");
		const PROVIDER_NAMES = {
			anthropic: "Anthropic",
			gemini: "Gemini",
			ollama: "Ollama"
		};
		function providerModelLabel(entry) {
			const name = PROVIDER_NAMES[entry.provider] || entry.provider;
			return entry.model ? `${name} · ${entry.model}` : name;
		}
		function formatDate(iso) {
			if (!iso) return "";
			const d = new Date(iso);
			return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
		}
		async function load() {
			loading.value = true;
			error.value = "";
			try {
				entries.value = await mosClient.getHistory();
			} catch (e) {
				error.value = e.message;
			} finally {
				loading.value = false;
			}
		}
		async function clear() {
			if (!confirm("Clear analysis history? This can't be undone.")) return;
			clearing.value = true;
			error.value = "";
			try {
				await mosClient.clearHistory();
				entries.value = [];
			} catch (e) {
				error.value = e.message;
			} finally {
				clearing.value = false;
			}
		}
		onMounted$1(load);
		return (_ctx, _cache) => {
			const _component_v_alert = _resolveComponent$4("v-alert");
			const _component_v_progress_circular = _resolveComponent$4("v-progress-circular");
			const _component_v_icon = _resolveComponent$4("v-icon");
			const _component_v_list_item_title = _resolveComponent$4("v-list-item-title");
			const _component_v_chip = _resolveComponent$4("v-chip");
			const _component_v_list_item_subtitle = _resolveComponent$4("v-list-item-subtitle");
			const _component_v_btn = _resolveComponent$4("v-btn");
			const _component_v_list_item = _resolveComponent$4("v-list-item");
			const _component_v_list = _resolveComponent$4("v-list");
			const _component_v_card_text = _resolveComponent$4("v-card-text");
			const _component_v_spacer = _resolveComponent$4("v-spacer");
			const _component_v_card_actions = _resolveComponent$4("v-card-actions");
			const _component_v_card = _resolveComponent$4("v-card");
			return _openBlock$4(), _createBlock$3(_component_v_card, { flat: "" }, {
				default: _withCtx$4(() => [_createVNode$4(_component_v_card_text, null, {
					default: _withCtx$4(() => [error.value ? (_openBlock$4(), _createBlock$3(_component_v_alert, {
						key: 0,
						type: "error",
						variant: "tonal",
						density: "compact",
						class: "mb-4"
					}, {
						default: _withCtx$4(() => [_createTextVNode$4(_toDisplayString$3(error.value), 1)]),
						_: 1
					})) : _createCommentVNode$3("", true), loading.value ? (_openBlock$4(), _createElementBlock$3("div", _hoisted_1$2, [_createVNode$4(_component_v_progress_circular, {
						indeterminate: "",
						color: "primary"
					})])) : !entries.value.length ? (_openBlock$4(), _createElementBlock$3("div", _hoisted_2$2, " No repositories analyzed yet. ")) : (_openBlock$4(), _createBlock$3(_component_v_list, {
						key: 3,
						lines: "two",
						class: "bg-transparent"
					}, {
						default: _withCtx$4(() => [(_openBlock$4(true), _createElementBlock$3(_Fragment$3, null, _renderList$2(entries.value, (entry, i) => {
							return _openBlock$4(), _createBlock$3(_component_v_list_item, {
								key: i,
								class: "px-0"
							}, {
								prepend: _withCtx$4(() => [_createVNode$4(_component_v_icon, {
									icon: entry.mode === "compose" ? "mdi-layers-outline" : "mdi-package-variant",
									class: "mr-3"
								}, null, 8, ["icon"])]),
								append: _withCtx$4(() => [entry.result ? (_openBlock$4(), _createBlock$3(_component_v_btn, {
									key: 0,
									icon: "mdi-eye-outline",
									size: "small",
									variant: "text",
									title: "View result",
									"aria-label": "View this analysis result",
									onClick: ($event) => _ctx.$emit("open-result", entry.result)
								}, null, 8, ["onClick"])) : _createCommentVNode$3("", true), _createVNode$4(_component_v_btn, {
									icon: "mdi-open-in-new",
									size: "small",
									variant: "text",
									href: entry.url,
									target: "_blank",
									rel: "noopener noreferrer",
									title: "Open repository",
									"aria-label": "Open repository in a new tab"
								}, null, 8, ["href"])]),
								default: _withCtx$4(() => [_createVNode$4(_component_v_list_item_title, null, {
									default: _withCtx$4(() => [_createTextVNode$4(_toDisplayString$3(entry.repo), 1)]),
									_: 2
								}, 1024), _createVNode$4(_component_v_list_item_subtitle, null, {
									default: _withCtx$4(() => [
										_createVNode$4(_component_v_chip, {
											size: "x-small",
											variant: "tonal",
											class: "mr-1"
										}, {
											default: _withCtx$4(() => [_createTextVNode$4(_toDisplayString$3(entry.mode === "compose" ? "Compose" : "Docker"), 1)]),
											_: 2
										}, 1024),
										_createVNode$4(_component_v_chip, {
											size: "x-small",
											variant: "tonal",
											class: "mr-1"
										}, {
											default: _withCtx$4(() => [_createTextVNode$4(_toDisplayString$3(entry.scope === "all" ? "All settings" : "Required only"), 1)]),
											_: 2
										}, 1024),
										entry.provider ? (_openBlock$4(), _createBlock$3(_component_v_chip, {
											key: 0,
											size: "x-small",
											variant: "tonal",
											class: "mr-1"
										}, {
											default: _withCtx$4(() => [_createTextVNode$4(_toDisplayString$3(providerModelLabel(entry)), 1)]),
											_: 2
										}, 1024)) : _createCommentVNode$3("", true),
										_createElementVNode$4("span", _hoisted_3$1, _toDisplayString$3(formatDate(entry.analyzed_at)), 1)
									]),
									_: 2
								}, 1024)]),
								_: 2
							}, 1024);
						}), 128))]),
						_: 1
					}))]),
					_: 1
				}), entries.value.length ? (_openBlock$4(), _createBlock$3(_component_v_card_actions, { key: 0 }, {
					default: _withCtx$4(() => [_createVNode$4(_component_v_spacer), _createVNode$4(_component_v_btn, {
						variant: "text",
						color: "error",
						loading: clearing.value,
						onClick: clear
					}, {
						default: _withCtx$4(() => [..._cache[0] || (_cache[0] = [_createTextVNode$4("Clear history", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					_: 1
				})) : _createCommentVNode$3("", true)]),
				_: 1
			});
		};
	}
};
//#endregion
//#region src/components/SettingsForm.vue
var { toDisplayString: _toDisplayString$2, createTextVNode: _createTextVNode$3, resolveComponent: _resolveComponent$3, withCtx: _withCtx$3, openBlock: _openBlock$3, createBlock: _createBlock$2, createCommentVNode: _createCommentVNode$2, createVNode: _createVNode$3, createElementVNode: _createElementVNode$3 } = await importShared("vue");
var { reactive, ref: ref$2, watch: watch$1, onMounted } = await importShared("vue");
var _sfc_main$3 = {
	__name: "SettingsForm",
	setup(__props) {
		const providerItems = [
			{
				title: "Anthropic (Claude) — paid, most reliable",
				value: "anthropic"
			},
			{
				title: "Google Gemini — free tier available",
				value: "gemini"
			},
			{
				title: "Ollama — free, local, self-hosted",
				value: "ollama"
			}
		];
		const form = reactive({
			provider: "anthropic",
			anthropic: {
				api_key: "",
				model: "claude-sonnet-5"
			},
			gemini: {
				api_key: "",
				model: "gemini-2.5-flash"
			},
			ollama: {
				host: "http://localhost:11434",
				model: "qwen2.5-coder:7b"
			},
			github_token: ""
		});
		const openPanel = ref$2("anthropic");
		const saving = ref$2(false);
		const saved = ref$2(false);
		const error = ref$2("");
		const ollamaTesting = ref$2(false);
		const ollamaTestResult = ref$2(null);
		const ollamaModels = ref$2([]);
		const anthropicTesting = ref$2(false);
		const anthropicTestResult = ref$2(null);
		const anthropicModels = ref$2([]);
		const geminiTesting = ref$2(false);
		const geminiTestResult = ref$2(null);
		const geminiModels = ref$2([]);
		watch$1(() => form.provider, (p) => {
			openPanel.value = p;
		});
		watch$1(() => form.ollama.host, () => {
			ollamaModels.value = [];
			ollamaTestResult.value = null;
		});
		watch$1(() => form.ollama.model, () => {
			ollamaTestResult.value = null;
		});
		watch$1(() => form.anthropic.api_key, () => {
			anthropicModels.value = [];
			anthropicTestResult.value = null;
		});
		watch$1(() => form.anthropic.model, () => {
			anthropicTestResult.value = null;
		});
		watch$1(() => form.gemini.api_key, () => {
			geminiModels.value = [];
			geminiTestResult.value = null;
		});
		watch$1(() => form.gemini.model, () => {
			geminiTestResult.value = null;
		});
		async function runTest({ testingRef, resultRef, modelsRef, testFn, connectValue, modelValue, notFoundNoun }) {
			testingRef.value = true;
			resultRef.value = null;
			try {
				const result = await testFn(connectValue, modelValue);
				modelsRef.value = result.models;
				if (result.model_found === false) resultRef.value = {
					type: "warning",
					message: `Connected, but "${modelValue}" isn't ${notFoundNoun}. Pick one below.`
				};
				else resultRef.value = {
					type: "success",
					message: `Connected. ${result.models.length} model(s) available - pick one below.`
				};
			} catch (e) {
				resultRef.value = {
					type: "error",
					message: e.message
				};
			} finally {
				testingRef.value = false;
			}
		}
		function testOllama() {
			return runTest({
				testingRef: ollamaTesting,
				resultRef: ollamaTestResult,
				modelsRef: ollamaModels,
				testFn: (host, model) => mosClient.testOllamaConnection(host, model),
				connectValue: form.ollama.host.trim(),
				modelValue: (form.ollama.model || "").trim(),
				notFoundNoun: "pulled on that host yet"
			});
		}
		function testAnthropic() {
			return runTest({
				testingRef: anthropicTesting,
				resultRef: anthropicTestResult,
				modelsRef: anthropicModels,
				testFn: (key, model) => mosClient.testAnthropicConnection(key, model),
				connectValue: form.anthropic.api_key.trim(),
				modelValue: (form.anthropic.model || "").trim(),
				notFoundNoun: "available to this key"
			});
		}
		function testGemini() {
			return runTest({
				testingRef: geminiTesting,
				resultRef: geminiTestResult,
				modelsRef: geminiModels,
				testFn: (key, model) => mosClient.testGeminiConnection(key, model),
				connectValue: form.gemini.api_key.trim(),
				modelValue: (form.gemini.model || "").trim(),
				notFoundNoun: "available to this key"
			});
		}
		onMounted(async () => {
			try {
				const settings = await mosClient.getSettings();
				if (settings.provider) form.provider = settings.provider;
				for (const p of [
					"anthropic",
					"gemini",
					"ollama"
				]) if (settings[p] && typeof settings[p] === "object") Object.assign(form[p], settings[p]);
				if (settings.github_token) form.github_token = settings.github_token;
				openPanel.value = form.provider;
			} catch (e) {
				if (e.status !== 400) error.value = e.message;
			}
		});
		async function save() {
			saving.value = true;
			saved.value = false;
			error.value = "";
			try {
				const payload = {
					provider: form.provider,
					anthropic: {
						api_key: form.anthropic.api_key.trim(),
						model: (form.anthropic.model || "").trim()
					},
					gemini: {
						api_key: form.gemini.api_key.trim(),
						model: (form.gemini.model || "").trim()
					},
					ollama: {
						host: form.ollama.host.trim(),
						model: (form.ollama.model || "").trim()
					},
					github_token: form.github_token.trim()
				};
				await mosClient.saveSettings(payload);
				Object.assign(form, payload);
				saved.value = true;
			} catch (e) {
				error.value = e.message;
			} finally {
				saving.value = false;
			}
		}
		return (_ctx, _cache) => {
			const _component_v_alert = _resolveComponent$3("v-alert");
			const _component_v_select = _resolveComponent$3("v-select");
			const _component_v_chip = _resolveComponent$3("v-chip");
			const _component_v_expansion_panel_title = _resolveComponent$3("v-expansion-panel-title");
			const _component_v_text_field = _resolveComponent$3("v-text-field");
			const _component_v_btn = _resolveComponent$3("v-btn");
			const _component_v_combobox = _resolveComponent$3("v-combobox");
			const _component_v_expansion_panel_text = _resolveComponent$3("v-expansion-panel-text");
			const _component_v_expansion_panel = _resolveComponent$3("v-expansion-panel");
			const _component_v_expansion_panels = _resolveComponent$3("v-expansion-panels");
			const _component_v_card_text = _resolveComponent$3("v-card-text");
			const _component_v_spacer = _resolveComponent$3("v-spacer");
			const _component_v_card_actions = _resolveComponent$3("v-card-actions");
			const _component_v_card = _resolveComponent$3("v-card");
			return _openBlock$3(), _createBlock$2(_component_v_card, { flat: "" }, {
				default: _withCtx$3(() => [_createVNode$3(_component_v_card_text, null, {
					default: _withCtx$3(() => [
						error.value ? (_openBlock$3(), _createBlock$2(_component_v_alert, {
							key: 0,
							type: "error",
							variant: "tonal",
							class: "mb-4",
							density: "compact"
						}, {
							default: _withCtx$3(() => [_createTextVNode$3(_toDisplayString$2(error.value), 1)]),
							_: 1
						})) : _createCommentVNode$2("", true),
						saved.value ? (_openBlock$3(), _createBlock$2(_component_v_alert, {
							key: 1,
							type: "success",
							variant: "tonal",
							class: "mb-4",
							density: "compact"
						}, {
							default: _withCtx$3(() => [..._cache[9] || (_cache[9] = [_createTextVNode$3(" Settings saved. ", -1)])]),
							_: 1
						})) : _createCommentVNode$2("", true),
						_createVNode$3(_component_v_select, {
							modelValue: form.provider,
							"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => form.provider = $event),
							items: providerItems,
							label: "Default AI provider",
							hint: "Which provider the analyze script actually uses when you click Analyze.",
							"persistent-hint": "",
							class: "mb-4"
						}, null, 8, ["modelValue"]),
						_createVNode$3(_component_v_expansion_panels, {
							modelValue: openPanel.value,
							"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => openPanel.value = $event),
							class: "mb-4",
							variant: "accordion"
						}, {
							default: _withCtx$3(() => [
								_createVNode$3(_component_v_expansion_panel, { value: "anthropic" }, {
									default: _withCtx$3(() => [_createVNode$3(_component_v_expansion_panel_title, null, {
										default: _withCtx$3(() => [_cache[11] || (_cache[11] = _createTextVNode$3(" Anthropic (Claude) ", -1)), form.provider === "anthropic" ? (_openBlock$3(), _createBlock$2(_component_v_chip, {
											key: 0,
											size: "x-small",
											color: "primary",
											class: "ml-2"
										}, {
											default: _withCtx$3(() => [..._cache[10] || (_cache[10] = [_createTextVNode$3("Default", -1)])]),
											_: 1
										})) : _createCommentVNode$2("", true)]),
										_: 1
									}), _createVNode$3(_component_v_expansion_panel_text, null, {
										default: _withCtx$3(() => [
											_createVNode$3(_component_v_alert, {
												type: "warning",
												variant: "tonal",
												density: "compact",
												class: "mb-3"
											}, {
												default: _withCtx$3(() => [..._cache[12] || (_cache[12] = [
													_createTextVNode$3(" Requires a ", -1),
													_createElementVNode$3("strong", null, "paid", -1),
													_createTextVNode$3(" API key with billing enabled — there is no free tier for API access. In exchange it's the most reliable at following the template schema exactly and rarely needs a retry. Cost is usage-based, typically a few cents per repository analyzed. ", -1)
												])]),
												_: 1
											}),
											_cache[14] || (_cache[14] = _createElementVNode$3("div", { class: "text-caption text-medium-emphasis mb-3" }, [_createElementVNode$3("strong", null, "Setup:"), _createTextVNode$3(" sign in at console.anthropic.com → add billing/credits → API Keys → Create Key → paste it below and test it → pick a model from what the key can access. ")], -1)),
											_createVNode$3(_component_v_text_field, {
												modelValue: form.anthropic.api_key,
												"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.anthropic.api_key = $event),
												label: "Anthropic API key",
												type: "password",
												class: "mb-2"
											}, null, 8, ["modelValue"]),
											_createVNode$3(_component_v_btn, {
												variant: "tonal",
												size: "small",
												class: "mb-2",
												loading: anthropicTesting.value,
												disabled: !form.anthropic.api_key,
												onClick: testAnthropic
											}, {
												default: _withCtx$3(() => [..._cache[13] || (_cache[13] = [_createTextVNode$3(" Test connection ", -1)])]),
												_: 1
											}, 8, ["loading", "disabled"]),
											anthropicTestResult.value ? (_openBlock$3(), _createBlock$2(_component_v_alert, {
												key: 0,
												type: anthropicTestResult.value.type,
												variant: "tonal",
												density: "compact",
												class: "mb-3"
											}, {
												default: _withCtx$3(() => [_createTextVNode$3(_toDisplayString$2(anthropicTestResult.value.message), 1)]),
												_: 1
											}, 8, ["type"])) : _createCommentVNode$2("", true),
											_createVNode$3(_component_v_combobox, {
												modelValue: form.anthropic.model,
												"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.anthropic.model = $event),
												items: anthropicModels.value,
												label: "Model",
												hint: anthropicModels.value.length ? "Available to this key - pick one, or type a different name." : "Test the connection to list what this key can access, or type a name directly.",
												"persistent-hint": ""
											}, null, 8, [
												"modelValue",
												"items",
												"hint"
											])
										]),
										_: 1
									})]),
									_: 1
								}),
								_createVNode$3(_component_v_expansion_panel, { value: "gemini" }, {
									default: _withCtx$3(() => [_createVNode$3(_component_v_expansion_panel_title, null, {
										default: _withCtx$3(() => [_cache[16] || (_cache[16] = _createTextVNode$3(" Google Gemini ", -1)), form.provider === "gemini" ? (_openBlock$3(), _createBlock$2(_component_v_chip, {
											key: 0,
											size: "x-small",
											color: "primary",
											class: "ml-2"
										}, {
											default: _withCtx$3(() => [..._cache[15] || (_cache[15] = [_createTextVNode$3("Default", -1)])]),
											_: 1
										})) : _createCommentVNode$2("", true)]),
										_: 1
									}), _createVNode$3(_component_v_expansion_panel_text, null, {
										default: _withCtx$3(() => [
											_createVNode$3(_component_v_alert, {
												type: "info",
												variant: "tonal",
												density: "compact",
												class: "mb-3"
											}, {
												default: _withCtx$3(() => [..._cache[17] || (_cache[17] = [_createTextVNode$3(" Google AI Studio issues real API keys with a genuinely free tier — no billing required for typical personal use. The tradeoff: free-tier requests are rate-limited (fewer analyses per minute/day), and Gemini is somewhat less consistent than Claude at holding together this exact JSON schema on the first try. ", -1)])]),
												_: 1
											}),
											_cache[19] || (_cache[19] = _createElementVNode$3("div", { class: "text-caption text-medium-emphasis mb-3" }, [_createElementVNode$3("strong", null, "Setup:"), _createTextVNode$3(" go to aistudio.google.com → sign in with a Google account → \"Get API key\" → \"Create API key\" → paste it below and test it → pick a model from what's available. ")], -1)),
											_createVNode$3(_component_v_text_field, {
												modelValue: form.gemini.api_key,
												"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.gemini.api_key = $event),
												label: "Gemini API key",
												type: "password",
												class: "mb-2"
											}, null, 8, ["modelValue"]),
											_createVNode$3(_component_v_btn, {
												variant: "tonal",
												size: "small",
												class: "mb-2",
												loading: geminiTesting.value,
												disabled: !form.gemini.api_key,
												onClick: testGemini
											}, {
												default: _withCtx$3(() => [..._cache[18] || (_cache[18] = [_createTextVNode$3(" Test connection ", -1)])]),
												_: 1
											}, 8, ["loading", "disabled"]),
											geminiTestResult.value ? (_openBlock$3(), _createBlock$2(_component_v_alert, {
												key: 0,
												type: geminiTestResult.value.type,
												variant: "tonal",
												density: "compact",
												class: "mb-3"
											}, {
												default: _withCtx$3(() => [_createTextVNode$3(_toDisplayString$2(geminiTestResult.value.message), 1)]),
												_: 1
											}, 8, ["type"])) : _createCommentVNode$2("", true),
											_createVNode$3(_component_v_combobox, {
												modelValue: form.gemini.model,
												"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.gemini.model = $event),
												items: geminiModels.value,
												label: "Model",
												hint: geminiModels.value.length ? "Available to this key - pick one, or type a different name." : "Test the connection to list what this key can access, or type a name directly.",
												"persistent-hint": ""
											}, null, 8, [
												"modelValue",
												"items",
												"hint"
											])
										]),
										_: 1
									})]),
									_: 1
								}),
								_createVNode$3(_component_v_expansion_panel, { value: "ollama" }, {
									default: _withCtx$3(() => [_createVNode$3(_component_v_expansion_panel_title, null, {
										default: _withCtx$3(() => [_cache[21] || (_cache[21] = _createTextVNode$3(" Ollama (local, self-hosted) ", -1)), form.provider === "ollama" ? (_openBlock$3(), _createBlock$2(_component_v_chip, {
											key: 0,
											size: "x-small",
											color: "primary",
											class: "ml-2"
										}, {
											default: _withCtx$3(() => [..._cache[20] || (_cache[20] = [_createTextVNode$3("Default", -1)])]),
											_: 1
										})) : _createCommentVNode$2("", true)]),
										_: 1
									}), _createVNode$3(_component_v_expansion_panel_text, null, {
										default: _withCtx$3(() => [
											_createVNode$3(_component_v_alert, {
												type: "info",
												variant: "tonal",
												density: "compact",
												class: "mb-3"
											}, {
												default: _withCtx$3(() => [..._cache[22] || (_cache[22] = [_createTextVNode$3(" Completely free and private — no API key, nothing leaves your network. The tradeoff: it's noticeably slower than a cloud API (especially without a GPU) — analysis runs as a background job and keeps waiting rather than timing out, but that can still mean many minutes on modest hardware. Small local models are also less reliable at producing this whole schema correctly in one shot; models tuned for structured/code output (e.g. Qwen2.5-Coder) tend to do noticeably better here than general-purpose ones of similar size (e.g. Llama 3.1). ", -1)])]),
												_: 1
											}),
											_cache[24] || (_cache[24] = _createElementVNode$3("div", { class: "text-caption text-medium-emphasis mb-3" }, [
												_createElementVNode$3("strong", null, "Setup:"),
												_createTextVNode$3(" install Ollama (ollama.com) on a machine reachable from this MOS host → run "),
												_createElementVNode$3("code", null, "ollama pull qwen2.5-coder:7b"),
												_createTextVNode$3(" (or another model) → make sure its API port (default 11434) is reachable from this host → enter the host below and test it → pick the model from what's actually pulled there. ")
											], -1)),
											_createVNode$3(_component_v_text_field, {
												modelValue: form.ollama.host,
												"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.ollama.host = $event),
												label: "Ollama host",
												hint: "e.g. http://192.168.1.10:11434",
												"persistent-hint": "",
												class: "mb-2"
											}, null, 8, ["modelValue"]),
											_createVNode$3(_component_v_btn, {
												variant: "tonal",
												size: "small",
												class: "mb-2",
												loading: ollamaTesting.value,
												disabled: !form.ollama.host,
												onClick: testOllama
											}, {
												default: _withCtx$3(() => [..._cache[23] || (_cache[23] = [_createTextVNode$3(" Test connection ", -1)])]),
												_: 1
											}, 8, ["loading", "disabled"]),
											ollamaTestResult.value ? (_openBlock$3(), _createBlock$2(_component_v_alert, {
												key: 0,
												type: ollamaTestResult.value.type,
												variant: "tonal",
												density: "compact",
												class: "mb-3"
											}, {
												default: _withCtx$3(() => [_createTextVNode$3(_toDisplayString$2(ollamaTestResult.value.message), 1)]),
												_: 1
											}, 8, ["type"])) : _createCommentVNode$2("", true),
											_createVNode$3(_component_v_combobox, {
												modelValue: form.ollama.model,
												"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => form.ollama.model = $event),
												items: ollamaModels.value,
												label: "Model",
												hint: ollamaModels.value.length ? "Pulled on that host - pick one, or type a different name." : "Test the connection to list what's pulled there, or type a name directly.",
												"persistent-hint": ""
											}, null, 8, [
												"modelValue",
												"items",
												"hint"
											])
										]),
										_: 1
									})]),
									_: 1
								})
							]),
							_: 1
						}, 8, ["modelValue"]),
						_createVNode$3(_component_v_text_field, {
							modelValue: form.github_token,
							"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => form.github_token = $event),
							label: "GitHub token (optional)",
							type: "password",
							hint: "Raises GitHub API rate limits when analyzing repos. Not required for public repos at low volume.",
							"persistent-hint": ""
						}, null, 8, ["modelValue"])
					]),
					_: 1
				}), _createVNode$3(_component_v_card_actions, null, {
					default: _withCtx$3(() => [_createVNode$3(_component_v_spacer), _createVNode$3(_component_v_btn, {
						color: "primary",
						loading: saving.value,
						onClick: save
					}, {
						default: _withCtx$3(() => [..._cache[25] || (_cache[25] = [_createTextVNode$3("Save", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					_: 1
				})]),
				_: 1
			});
		};
	}
};
//#endregion
//#region src/components/EditableList.vue
var { toDisplayString: _toDisplayString$1, createElementVNode: _createElementVNode$2, createTextVNode: _createTextVNode$2, resolveComponent: _resolveComponent$2, withCtx: _withCtx$2, createVNode: _createVNode$2, renderList: _renderList$1, Fragment: _Fragment$2, openBlock: _openBlock$2, createElementBlock: _createElementBlock$2, createBlock: _createBlock$1, createCommentVNode: _createCommentVNode$1, renderSlot: _renderSlot } = await importShared("vue");
var _hoisted_1$1 = { class: "text-subtitle-1 font-weight-medium" };
var _hoisted_2$1 = { class: "d-flex flex-column align-center" };
var _sfc_main$2 = {
	__name: "EditableList",
	props: {
		modelValue: {
			type: Array,
			required: true
		},
		title: {
			type: String,
			required: true
		},
		blank: {
			type: Function,
			required: true
		}
	},
	emits: ["update:modelValue"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		function add() {
			emit("update:modelValue", [...props.modelValue, props.blank()]);
		}
		function insertAfter(i) {
			const next = props.modelValue.slice();
			next.splice(i + 1, 0, props.blank());
			emit("update:modelValue", next);
		}
		function remove(i) {
			const next = props.modelValue.slice();
			next.splice(i, 1);
			emit("update:modelValue", next);
		}
		return (_ctx, _cache) => {
			const _component_v_icon = _resolveComponent$2("v-icon");
			const _component_v_btn = _resolveComponent$2("v-btn");
			const _component_v_col = _resolveComponent$2("v-col");
			const _component_v_row = _resolveComponent$2("v-row");
			const _component_v_divider = _resolveComponent$2("v-divider");
			return _openBlock$2(), _createElementBlock$2(_Fragment$2, null, [_createVNode$2(_component_v_row, null, {
				default: _withCtx$2(() => [_createVNode$2(_component_v_col, {
					cols: "12",
					class: "d-flex align-center justify-space-between"
				}, {
					default: _withCtx$2(() => [_createElementVNode$2("span", _hoisted_1$1, _toDisplayString$1(__props.title), 1), _createVNode$2(_component_v_btn, {
						variant: "text",
						size: "small",
						class: "ma-1 pa-0",
						style: {
							"min-width": "0",
							"color": "green"
						},
						onClick: add,
						title: `Add ${__props.title}`
					}, {
						default: _withCtx$2(() => [_createVNode$2(_component_v_icon, {
							size: "18",
							class: "mr-1"
						}, {
							default: _withCtx$2(() => [..._cache[0] || (_cache[0] = [_createTextVNode$2("mdi-plus", -1)])]),
							_: 1
						}), _cache[1] || (_cache[1] = _createTextVNode$2(" Add ", -1))]),
						_: 1
					}, 8, ["title"])]),
					_: 1
				})]),
				_: 1
			}), (_openBlock$2(true), _createElementBlock$2(_Fragment$2, null, _renderList$1(__props.modelValue, (row, i) => {
				return _openBlock$2(), _createElementBlock$2("div", { key: i }, [i > 0 ? (_openBlock$2(), _createBlock$1(_component_v_divider, {
					key: 0,
					class: "my-2"
				})) : _createCommentVNode$1("", true), _createVNode$2(_component_v_row, null, {
					default: _withCtx$2(() => [_createVNode$2(_component_v_col, {
						cols: "1",
						class: "d-flex flex-column justify-center align-center"
					}, {
						default: _withCtx$2(() => [_createElementVNode$2("div", _hoisted_2$1, [_createVNode$2(_component_v_btn, {
							icon: "",
							size: "x-small",
							color: "green",
							class: "pa-0",
							style: {
								"width": "24px",
								"height": "24px",
								"min-width": "24px",
								"margin-bottom": "6px"
							},
							onClick: ($event) => insertAfter(i),
							title: `Add ${__props.title}`
						}, {
							default: _withCtx$2(() => [_createVNode$2(_component_v_icon, { size: "18" }, {
								default: _withCtx$2(() => [..._cache[2] || (_cache[2] = [_createTextVNode$2("mdi-plus", -1)])]),
								_: 1
							})]),
							_: 1
						}, 8, ["onClick", "title"]), _createVNode$2(_component_v_btn, {
							icon: "",
							size: "x-small",
							color: "error",
							class: "pa-0",
							style: {
								"width": "24px",
								"height": "24px",
								"min-width": "24px"
							},
							onClick: ($event) => remove(i),
							title: "Remove"
						}, {
							default: _withCtx$2(() => [_createVNode$2(_component_v_icon, { size: "18" }, {
								default: _withCtx$2(() => [..._cache[3] || (_cache[3] = [_createTextVNode$2("mdi-delete", -1)])]),
								_: 1
							})]),
							_: 1
						}, 8, ["onClick"])])]),
						_: 2
					}, 1024), _createVNode$2(_component_v_col, { cols: "11" }, {
						default: _withCtx$2(() => [_renderSlot(_ctx.$slots, "default", {
							row,
							index: i
						})]),
						_: 2
					}, 1024)]),
					_: 2
				}, 1024)]);
			}), 128))], 64);
		};
	}
};
//#endregion
//#region \0plugin-vue:export-helper
var _plugin_vue_export_helper_default = (sfc, props) => {
	const target = sfc.__vccOpts || sfc;
	for (const [key, val] of props) target[key] = val;
	return target;
};
//#endregion
//#region src/components/InstallDialog.vue
var { resolveComponent: _resolveComponent$1, openBlock: _openBlock$1, createBlock: _createBlock, createCommentVNode: _createCommentVNode, withCtx: _withCtx$1, createVNode: _createVNode$1, toDisplayString: _toDisplayString, createElementVNode: _createElementVNode$1, createTextVNode: _createTextVNode$1, createElementBlock: _createElementBlock$1, Fragment: _Fragment$1, renderList: _renderList } = await importShared("vue");
var _hoisted_1 = { class: "text-h6" };
var _hoisted_2 = { class: "text-caption text-medium-emphasis" };
var _hoisted_3 = {
	key: 0,
	class: "text-caption text-warning mt-1"
};
var _hoisted_4 = { class: "mb-4" };
var _hoisted_5 = { class: "mb-4" };
var { computed, ref: ref$1, watch } = await importShared("vue");
var InstallDialog_default = /*#__PURE__*/ _plugin_vue_export_helper_default({
	__name: "InstallDialog",
	props: {
		modelValue: {
			type: Boolean,
			default: false
		},
		result: {
			type: Object,
			default: null
		}
	},
	emits: ["update:modelValue", "installed"],
	setup(__props, { emit: __emit }) {
		const props = __props;
		const emit = __emit;
		const open = computed({
			get: () => props.modelValue,
			set: (v) => emit("update:modelValue", v)
		});
		const local = ref$1(null);
		const mode = ref$1("docker");
		const installing = ref$1(false);
		const installError = ref$1("");
		const installedOk = ref$1(false);
		const usedPorts = ref$1([]);
		watch(() => props.result, (result) => {
			installError.value = "";
			installedOk.value = false;
			if (!result) {
				local.value = null;
				return;
			}
			mode.value = result.mode === "compose" ? "compose" : "docker";
			local.value = JSON.parse(JSON.stringify(mode.value === "compose" ? result : result.docker));
			if (mode.value === "docker") {
				local.value.ports ??= [];
				local.value.paths ??= [];
				local.value.variables ??= [];
				local.value.devices ??= [];
				local.value.labels ??= [];
				local.value.custom_ip ??= "";
				local.value.default_shell ??= "";
				local.value.post_parameters ??= "";
				local.value.privileged ??= false;
				local.value.no_autoupdate ??= false;
			} else {
				local.value.template ??= {};
				local.value.env ??= "";
				local.value.no_autoupdate ??= false;
			}
			mosClient.getUsedPorts().then((ports) => {
				usedPorts.value = ports;
			});
		}, { immediate: true });
		function portConflict(row) {
			if (!row.host) return null;
			const proto = (row.protocol || "tcp").toLowerCase();
			return usedPorts.value.find((p) => String(p.port) === String(row.host) && (p.proto || "tcp").toLowerCase() === proto) || null;
		}
		const composePortConflicts = computed(() => {
			if (mode.value !== "compose" || !local.value?.yaml) return [];
			const hostPorts = [...local.value.yaml.matchAll(/^\s*-\s*["']?(\d{1,5}):\d{1,5}(?:\/\w+)?["']?\s*$/gm)].map((m) => m[1]);
			const seen = /* @__PURE__ */ new Set();
			const conflicts = [];
			for (const port of hostPorts) {
				if (seen.has(port)) continue;
				seen.add(port);
				const hit = usedPorts.value.find((p) => String(p.port) === port);
				if (hit) conflicts.push({
					port,
					name: hit.name,
					status: hit.status
				});
			}
			return conflicts;
		});
		const displayName = computed(() => (mode.value === "compose" ? local.value?.name : local.value?.name) || "");
		const icon = computed({
			get: () => (mode.value === "compose" ? local.value?.template?.icon : local.value?.icon) || "",
			set: (v) => {
				if (mode.value === "compose") local.value.template.icon = v;
				else local.value.icon = v;
			}
		});
		const category = computed(() => mode.value === "compose" ? local.value?.template?.category?.[0] : null);
		const description = computed({
			get: () => (mode.value === "compose" ? local.value?.template?.description : local.value?.description) || "",
			set: (v) => {
				if (mode.value === "compose") local.value.template.description = v;
				else local.value.description = v;
			}
		});
		function close() {
			open.value = false;
		}
		async function install() {
			installing.value = true;
			installError.value = "";
			installedOk.value = false;
			try {
				if (mode.value === "docker") await mosClient.createContainer(local.value);
				else await mosClient.createStack({
					name: local.value.name,
					yaml: local.value.yaml,
					env: local.value.env,
					icon: local.value.template?.icon,
					webui: local.value.template?.webui,
					no_autoupdate: local.value.no_autoupdate
				});
				installedOk.value = true;
				emit("installed", { mode: mode.value });
			} catch (e) {
				installError.value = e.data?.templateSaved ? `${e.message} Fix the fields above and try Install again.` : e.message;
			} finally {
				installing.value = false;
			}
		}
		return (_ctx, _cache) => {
			const _component_v_img = _resolveComponent$1("v-img");
			const _component_v_icon = _resolveComponent$1("v-icon");
			const _component_v_avatar = _resolveComponent$1("v-avatar");
			const _component_v_spacer = _resolveComponent$1("v-spacer");
			const _component_v_chip = _resolveComponent$1("v-chip");
			const _component_v_card_title = _resolveComponent$1("v-card-title");
			const _component_v_divider = _resolveComponent$1("v-divider");
			const _component_v_alert = _resolveComponent$1("v-alert");
			const _component_v_textarea = _resolveComponent$1("v-textarea");
			const _component_v_text_field = _resolveComponent$1("v-text-field");
			const _component_v_switch = _resolveComponent$1("v-switch");
			const _component_v_col = _resolveComponent$1("v-col");
			const _component_v_row = _resolveComponent$1("v-row");
			const _component_v_label = _resolveComponent$1("v-label");
			const _component_v_card_text = _resolveComponent$1("v-card-text");
			const _component_v_btn = _resolveComponent$1("v-btn");
			const _component_v_card_actions = _resolveComponent$1("v-card-actions");
			const _component_v_card = _resolveComponent$1("v-card");
			const _component_v_dialog = _resolveComponent$1("v-dialog");
			return _openBlock$1(), _createBlock(_component_v_dialog, {
				modelValue: open.value,
				"onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => open.value = $event),
				"max-width": "760",
				scrollable: "",
				persistent: ""
			}, {
				default: _withCtx$1(() => [local.value ? (_openBlock$1(), _createBlock(_component_v_card, { key: 0 }, {
					default: _withCtx$1(() => [
						_createVNode$1(_component_v_card_title, { class: "d-flex align-center ga-3" }, {
							default: _withCtx$1(() => [
								_createVNode$1(_component_v_avatar, {
									size: "40",
									rounded: "lg"
								}, {
									default: _withCtx$1(() => [icon.value ? (_openBlock$1(), _createBlock(_component_v_img, {
										key: 0,
										src: icon.value
									}, null, 8, ["src"])) : (_openBlock$1(), _createBlock(_component_v_icon, {
										key: 1,
										icon: "mdi-package-variant"
									}))]),
									_: 1
								}),
								_createElementVNode$1("div", null, [_createElementVNode$1("div", _hoisted_1, _toDisplayString(displayName.value), 1), _createElementVNode$1("div", _hoisted_2, _toDisplayString(mode.value === "compose" ? "Docker Compose stack" : "Single container"), 1)]),
								_createVNode$1(_component_v_spacer),
								category.value ? (_openBlock$1(), _createBlock(_component_v_chip, {
									key: 0,
									size: "small",
									variant: "tonal"
								}, {
									default: _withCtx$1(() => [_createTextVNode$1(_toDisplayString(category.value), 1)]),
									_: 1
								})) : _createCommentVNode("", true)
							]),
							_: 1
						}),
						_createVNode$1(_component_v_divider),
						_createVNode$1(_component_v_card_text, { style: { "max-height": "60vh" } }, {
							default: _withCtx$1(() => [
								installError.value ? (_openBlock$1(), _createBlock(_component_v_alert, {
									key: 0,
									type: "error",
									variant: "tonal",
									density: "compact",
									class: "mb-4"
								}, {
									default: _withCtx$1(() => [_createTextVNode$1(_toDisplayString(installError.value), 1)]),
									_: 1
								})) : _createCommentVNode("", true),
								installedOk.value ? (_openBlock$1(), _createBlock(_component_v_alert, {
									key: 1,
									type: "success",
									variant: "tonal",
									density: "compact",
									class: "mb-4"
								}, {
									default: _withCtx$1(() => [..._cache[24] || (_cache[24] = [_createTextVNode$1(" Installed successfully. ", -1)])]),
									_: 1
								})) : _createCommentVNode("", true),
								_createVNode$1(_component_v_textarea, {
									modelValue: description.value,
									"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => description.value = $event),
									label: "Description",
									rows: "2",
									"auto-grow": "",
									class: "mb-2",
									"hide-details": ""
								}, null, 8, ["modelValue"]),
								_createVNode$1(_component_v_divider, { class: "my-4" }),
								mode.value === "docker" ? (_openBlock$1(), _createElementBlock$1(_Fragment$1, { key: 2 }, [
									_createVNode$1(_component_v_text_field, {
										label: "Name",
										modelValue: local.value.name,
										"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => local.value.name = $event),
										"hide-details": "auto",
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$1(_component_v_text_field, {
										label: "Repository",
										modelValue: local.value.repo,
										"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => local.value.repo = $event),
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$1(_component_v_text_field, {
										label: "Network",
										modelValue: local.value.network,
										"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => local.value.network = $event),
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$1(_component_v_text_field, {
										label: "Custom IP",
										modelValue: local.value.custom_ip,
										"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => local.value.custom_ip = $event),
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$1(_component_v_text_field, {
										label: "Default shell",
										modelValue: local.value.default_shell,
										"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => local.value.default_shell = $event),
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$1(_component_v_switch, {
										label: "Privileged",
										modelValue: local.value.privileged,
										"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => local.value.privileged = $event),
										inset: "",
										color: "green",
										density: "compact",
										"hide-details": "auto"
									}, null, 8, ["modelValue"]),
									local.value.privileged ? (_openBlock$1(), _createBlock(_component_v_alert, {
										key: 0,
										type: "error",
										variant: "tonal",
										density: "compact",
										class: "mb-2"
									}, {
										default: _withCtx$1(() => [_createVNode$1(_component_v_icon, {
											size: "14",
											class: "mr-1"
										}, {
											default: _withCtx$1(() => [..._cache[25] || (_cache[25] = [_createTextVNode$1("mdi-shield-alert", -1)])]),
											_: 1
										}), _cache[26] || (_cache[26] = _createTextVNode$1(" Privileged mode gives this container full access to the host - effectively no isolation. Only leave this on if the app genuinely needs it (check the project's docs); turn it off if you're not sure. ", -1))]),
										_: 1
									})) : _createCommentVNode("", true),
									_createVNode$1(_component_v_switch, {
										label: "No autoupdate",
										modelValue: local.value.no_autoupdate,
										"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => local.value.no_autoupdate = $event),
										inset: "",
										color: "green",
										density: "compact",
										"hide-details": "auto",
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$1(_component_v_text_field, {
										label: "Extra parameters",
										modelValue: local.value.extra_parameters,
										"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => local.value.extra_parameters = $event),
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$1(_component_v_text_field, {
										label: "Post parameters",
										modelValue: local.value.post_parameters,
										"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => local.value.post_parameters = $event),
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$1(_component_v_text_field, {
										label: "Web UI URL",
										modelValue: local.value.web_ui_url,
										"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => local.value.web_ui_url = $event),
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$1(_component_v_text_field, {
										label: "Icon URL",
										modelValue: icon.value,
										"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => icon.value = $event),
										"hide-details": "auto"
									}, null, 8, ["modelValue"]),
									_createVNode$1(_component_v_divider, { class: "my-2" }),
									_createVNode$1(_sfc_main$2, {
										modelValue: local.value.paths,
										"onUpdate:modelValue": _cache[12] || (_cache[12] = ($event) => local.value.paths = $event),
										title: "Paths",
										blank: () => ({
											name: "",
											mode: "",
											host: "",
											container: "",
											description: ""
										})
									}, {
										default: _withCtx$1(({ row }) => [
											_createVNode$1(_component_v_row, null, {
												default: _withCtx$1(() => [_createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Name",
														modelValue: row.name,
														"onUpdate:modelValue": ($event) => row.name = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024), _createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Mode",
														modelValue: row.mode,
														"onUpdate:modelValue": ($event) => row.mode = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024),
											_createVNode$1(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$1(() => [_createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Host path",
														modelValue: row.host,
														"onUpdate:modelValue": ($event) => row.host = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024), _createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Container path",
														modelValue: row.container,
														"onUpdate:modelValue": ($event) => row.container = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024),
											_createVNode$1(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$1(() => [_createVNode$1(_component_v_col, { cols: "12" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Description",
														modelValue: row.description,
														"onUpdate:modelValue": ($event) => row.description = $event,
														density: "compact",
														"hide-details": ""
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024)
										]),
										_: 1
									}, 8, ["modelValue"]),
									_createVNode$1(_component_v_divider, { class: "my-2" }),
									_createVNode$1(_sfc_main$2, {
										modelValue: local.value.ports,
										"onUpdate:modelValue": _cache[13] || (_cache[13] = ($event) => local.value.ports = $event),
										title: "Ports",
										blank: () => ({
											name: "",
											protocol: "tcp",
											host: "",
											container: "",
											description: ""
										})
									}, {
										default: _withCtx$1(({ row }) => [
											_createVNode$1(_component_v_row, null, {
												default: _withCtx$1(() => [_createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Name",
														modelValue: row.name,
														"onUpdate:modelValue": ($event) => row.name = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024), _createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Protocol",
														modelValue: row.protocol,
														"onUpdate:modelValue": ($event) => row.protocol = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024),
											_createVNode$1(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$1(() => [_createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Host",
														modelValue: row.host,
														"onUpdate:modelValue": ($event) => row.host = $event,
														density: "compact",
														"hide-details": "",
														error: !!row.host && !/^[0-9.-]+$/.test(row.host)
													}, null, 8, [
														"modelValue",
														"onUpdate:modelValue",
														"error"
													]), portConflict(row) ? (_openBlock$1(), _createElementBlock$1("div", _hoisted_3, [_createVNode$1(_component_v_icon, {
														size: "14",
														class: "mr-1"
													}, {
														default: _withCtx$1(() => [..._cache[27] || (_cache[27] = [_createTextVNode$1("mdi-alert", -1)])]),
														_: 1
													}), _createTextVNode$1(" Already used by \"" + _toDisplayString(portConflict(row).name || "another container") + "\" (" + _toDisplayString(portConflict(row).status) + ") ", 1)])) : _createCommentVNode("", true)]),
													_: 2
												}, 1024), _createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Container",
														modelValue: row.container,
														"onUpdate:modelValue": ($event) => row.container = $event,
														density: "compact",
														error: !!row.container && !/^[0-9.-]+$/.test(row.container)
													}, null, 8, [
														"modelValue",
														"onUpdate:modelValue",
														"error"
													])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024),
											_createVNode$1(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$1(() => [_createVNode$1(_component_v_col, { cols: "12" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Description",
														modelValue: row.description,
														"onUpdate:modelValue": ($event) => row.description = $event,
														density: "compact",
														"hide-details": ""
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024)
										]),
										_: 1
									}, 8, ["modelValue"]),
									_createVNode$1(_component_v_divider, { class: "my-2" }),
									_createVNode$1(_sfc_main$2, {
										modelValue: local.value.devices,
										"onUpdate:modelValue": _cache[14] || (_cache[14] = ($event) => local.value.devices = $event),
										title: "Devices",
										blank: () => ({
											name: "",
											host: "",
											container: "",
											description: ""
										})
									}, {
										default: _withCtx$1(({ row }) => [
											_createVNode$1(_component_v_row, null, {
												default: _withCtx$1(() => [_createVNode$1(_component_v_col, { cols: "12" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Name",
														modelValue: row.name,
														"onUpdate:modelValue": ($event) => row.name = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024),
											_createVNode$1(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$1(() => [_createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Container",
														modelValue: row.container,
														"onUpdate:modelValue": ($event) => row.container = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024), _createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Host",
														modelValue: row.host,
														"onUpdate:modelValue": ($event) => row.host = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024),
											_createVNode$1(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$1(() => [_createVNode$1(_component_v_col, { cols: "12" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Description",
														modelValue: row.description,
														"onUpdate:modelValue": ($event) => row.description = $event,
														density: "compact",
														"hide-details": ""
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024)
										]),
										_: 1
									}, 8, ["modelValue"]),
									_createVNode$1(_component_v_divider, { class: "my-2" }),
									_createVNode$1(_sfc_main$2, {
										modelValue: local.value.variables,
										"onUpdate:modelValue": _cache[15] || (_cache[15] = ($event) => local.value.variables = $event),
										title: "Variables",
										blank: () => ({
											name: "",
											key: "",
											value: "",
											mask: false,
											description: ""
										})
									}, {
										default: _withCtx$1(({ row }) => [
											_createVNode$1(_component_v_row, null, {
												default: _withCtx$1(() => [_createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Name",
														modelValue: row.name,
														"onUpdate:modelValue": ($event) => row.name = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024), _createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_switch, {
														label: "Masked",
														modelValue: row.mask,
														"onUpdate:modelValue": ($event) => row.mask = $event,
														inset: "",
														color: "green",
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024),
											_createVNode$1(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$1(() => [_createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Key",
														modelValue: row.key,
														"onUpdate:modelValue": ($event) => row.key = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024), _createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Value",
														modelValue: row.value,
														"onUpdate:modelValue": ($event) => row.value = $event,
														density: "compact",
														type: row.mask ? "password" : "text"
													}, null, 8, [
														"modelValue",
														"onUpdate:modelValue",
														"type"
													])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024),
											_createVNode$1(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$1(() => [_createVNode$1(_component_v_col, { cols: "12" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Description",
														modelValue: row.description,
														"onUpdate:modelValue": ($event) => row.description = $event,
														density: "compact",
														"hide-details": ""
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024)
										]),
										_: 1
									}, 8, ["modelValue"]),
									_createVNode$1(_component_v_divider, { class: "my-2" }),
									_createVNode$1(_sfc_main$2, {
										modelValue: local.value.labels,
										"onUpdate:modelValue": _cache[16] || (_cache[16] = ($event) => local.value.labels = $event),
										title: "Labels",
										blank: () => ({
											name: "",
											key: "",
											value: "",
											mask: false,
											description: ""
										})
									}, {
										default: _withCtx$1(({ row }) => [
											_createVNode$1(_component_v_row, null, {
												default: _withCtx$1(() => [_createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Name",
														modelValue: row.name,
														"onUpdate:modelValue": ($event) => row.name = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024), _createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_switch, {
														label: "Masked",
														modelValue: row.mask,
														"onUpdate:modelValue": ($event) => row.mask = $event,
														inset: "",
														color: "green",
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024),
											_createVNode$1(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$1(() => [_createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Key",
														modelValue: row.key,
														"onUpdate:modelValue": ($event) => row.key = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024), _createVNode$1(_component_v_col, { cols: "6" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Value",
														modelValue: row.value,
														"onUpdate:modelValue": ($event) => row.value = $event,
														density: "compact",
														type: row.mask ? "password" : "text"
													}, null, 8, [
														"modelValue",
														"onUpdate:modelValue",
														"type"
													])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024),
											_createVNode$1(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$1(() => [_createVNode$1(_component_v_col, { cols: "12" }, {
													default: _withCtx$1(() => [_createVNode$1(_component_v_text_field, {
														label: "Description",
														modelValue: row.description,
														"onUpdate:modelValue": ($event) => row.description = $event,
														density: "compact",
														"hide-details": ""
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024)
										]),
										_: 1
									}, 8, ["modelValue"])
								], 64)) : (_openBlock$1(), _createElementBlock$1(_Fragment$1, { key: 3 }, [
									_createVNode$1(_component_v_text_field, {
										modelValue: local.value.name,
										"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => local.value.name = $event),
										label: "Stack name",
										class: "mb-4"
									}, null, 8, ["modelValue"]),
									composePortConflicts.value.length ? (_openBlock$1(), _createBlock(_component_v_alert, {
										key: 0,
										type: "warning",
										variant: "tonal",
										density: "compact",
										class: "mb-2"
									}, {
										default: _withCtx$1(() => [(_openBlock$1(true), _createElementBlock$1(_Fragment$1, null, _renderList(composePortConflicts.value, (c) => {
											return _openBlock$1(), _createElementBlock$1("div", { key: c.port }, [_createVNode$1(_component_v_icon, {
												size: "14",
												class: "mr-1"
											}, {
												default: _withCtx$1(() => [..._cache[28] || (_cache[28] = [_createTextVNode$1("mdi-alert", -1)])]),
												_: 1
											}), _createTextVNode$1(" Port " + _toDisplayString(c.port) + " is already used by \"" + _toDisplayString(c.name || "another container") + "\" (" + _toDisplayString(c.status) + ") ", 1)]);
										}), 128))]),
										_: 1
									})) : _createCommentVNode("", true),
									_createElementVNode$1("div", _hoisted_4, [_createVNode$1(_component_v_label, {
										class: "text-body-2",
										style: { "display": "block" }
									}, {
										default: _withCtx$1(() => [..._cache[29] || (_cache[29] = [_createTextVNode$1("Compose yaml", -1)])]),
										_: 1
									}), _createVNode$1(_component_v_textarea, {
										modelValue: local.value.yaml,
										"onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => local.value.yaml = $event),
										rows: "12",
										class: "font-mono",
										variant: "outlined",
										"hide-details": ""
									}, null, 8, ["modelValue"])]),
									_createElementVNode$1("div", _hoisted_5, [_createVNode$1(_component_v_label, {
										class: "text-body-2",
										style: { "display": "block" }
									}, {
										default: _withCtx$1(() => [..._cache[30] || (_cache[30] = [_createTextVNode$1("Environment variables", -1)])]),
										_: 1
									}), _createVNode$1(_component_v_textarea, {
										modelValue: local.value.env,
										"onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => local.value.env = $event),
										rows: "6",
										class: "font-mono",
										variant: "outlined",
										"hide-details": ""
									}, null, 8, ["modelValue"])]),
									_createVNode$1(_component_v_text_field, {
										modelValue: icon.value,
										"onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => icon.value = $event),
										label: "Icon URL",
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$1(_component_v_text_field, {
										modelValue: local.value.template.webui,
										"onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => local.value.template.webui = $event),
										label: "Web UI URL",
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$1(_component_v_switch, {
										label: "No autoupdate",
										modelValue: local.value.no_autoupdate,
										"onUpdate:modelValue": _cache[22] || (_cache[22] = ($event) => local.value.no_autoupdate = $event),
										inset: "",
										color: "green",
										density: "compact",
										"hide-details": "auto"
									}, null, 8, ["modelValue"])
								], 64))
							]),
							_: 1
						}),
						_createVNode$1(_component_v_divider),
						_createVNode$1(_component_v_card_actions, null, {
							default: _withCtx$1(() => [
								_createVNode$1(_component_v_btn, {
									variant: "text",
									onClick: close
								}, {
									default: _withCtx$1(() => [..._cache[31] || (_cache[31] = [_createTextVNode$1("Cancel", -1)])]),
									_: 1
								}),
								_createVNode$1(_component_v_spacer),
								_createVNode$1(_component_v_btn, {
									color: "primary",
									loading: installing.value,
									onClick: install
								}, {
									default: _withCtx$1(() => [..._cache[32] || (_cache[32] = [_createTextVNode$1("Install", -1)])]),
									_: 1
								}, 8, ["loading"])
							]),
							_: 1
						})
					]),
					_: 1
				})) : _createCommentVNode("", true)]),
				_: 1
			}, 8, ["modelValue"]);
		};
	}
}, [["__scopeId", "data-v-ec8c3412"]]);
//#endregion
//#region src/Plugin.vue
var { createElementVNode: _createElementVNode, createTextVNode: _createTextVNode, resolveComponent: _resolveComponent, withCtx: _withCtx, createVNode: _createVNode, Fragment: _Fragment, openBlock: _openBlock, createElementBlock: _createElementBlock } = await importShared("vue");
var { ref } = await importShared("vue");
var _sfc_main = {
	__name: "Plugin",
	setup(__props) {
		const tab = ref("analyze");
		const dialogOpen = ref(false);
		const dialogResult = ref(null);
		const showInstalledSnackbar = ref(false);
		function openResult(result) {
			dialogResult.value = result;
			dialogOpen.value = true;
		}
		function onInstalled() {
			dialogOpen.value = false;
			showInstalledSnackbar.value = true;
		}
		return (_ctx, _cache) => {
			const _component_v_alert = _resolveComponent("v-alert");
			const _component_v_tab = _resolveComponent("v-tab");
			const _component_v_tabs = _resolveComponent("v-tabs");
			const _component_v_window_item = _resolveComponent("v-window-item");
			const _component_v_window = _resolveComponent("v-window");
			const _component_v_sheet = _resolveComponent("v-sheet");
			const _component_v_snackbar = _resolveComponent("v-snackbar");
			return _openBlock(), _createElementBlock(_Fragment, null, [
				_createVNode(_component_v_sheet, {
					class: "pa-4",
					color: "transparent"
				}, {
					default: _withCtx(() => [
						_createVNode(_component_v_alert, {
							type: "warning",
							variant: "tonal",
							density: "compact",
							icon: "mdi-alert-outline",
							class: "mb-4"
						}, {
							default: _withCtx(() => [..._cache[4] || (_cache[4] = [_createElementVNode("strong", null, "Use at your own risk.", -1), _createTextVNode(" AI-generated templates can be wrong — a misread port, an invented path, a variable that isn't actually optional. Review every field and check the project's own documentation before clicking Install. ", -1)])]),
							_: 1
						}),
						_createVNode(_component_v_tabs, {
							modelValue: tab.value,
							"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => tab.value = $event),
							class: "mb-4"
						}, {
							default: _withCtx(() => [
								_createVNode(_component_v_tab, { value: "analyze" }, {
									default: _withCtx(() => [..._cache[5] || (_cache[5] = [_createTextVNode("Analyze", -1)])]),
									_: 1
								}),
								_createVNode(_component_v_tab, { value: "history" }, {
									default: _withCtx(() => [..._cache[6] || (_cache[6] = [_createTextVNode("History", -1)])]),
									_: 1
								}),
								_createVNode(_component_v_tab, { value: "settings" }, {
									default: _withCtx(() => [..._cache[7] || (_cache[7] = [_createTextVNode("Settings", -1)])]),
									_: 1
								})
							]),
							_: 1
						}, 8, ["modelValue"]),
						_createVNode(_component_v_window, {
							modelValue: tab.value,
							"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => tab.value = $event)
						}, {
							default: _withCtx(() => [
								_createVNode(_component_v_window_item, { value: "analyze" }, {
									default: _withCtx(() => [_createVNode(_sfc_main$5, { onOpenResult: openResult })]),
									_: 1
								}),
								_createVNode(_component_v_window_item, { value: "history" }, {
									default: _withCtx(() => [_createVNode(_sfc_main$4, { onOpenResult: openResult })]),
									_: 1
								}),
								_createVNode(_component_v_window_item, { value: "settings" }, {
									default: _withCtx(() => [_createVNode(_sfc_main$3)]),
									_: 1
								})
							]),
							_: 1
						}, 8, ["modelValue"])
					]),
					_: 1
				}),
				_createVNode(InstallDialog_default, {
					modelValue: dialogOpen.value,
					"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => dialogOpen.value = $event),
					result: dialogResult.value,
					onInstalled
				}, null, 8, ["modelValue", "result"]),
				_createVNode(_component_v_snackbar, {
					modelValue: showInstalledSnackbar.value,
					"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => showInstalledSnackbar.value = $event),
					color: "success",
					timeout: "4000"
				}, {
					default: _withCtx(() => [..._cache[8] || (_cache[8] = [_createTextVNode(" Installed — check the Docker overview. ", -1)])]),
					_: 1
				}, 8, ["modelValue"])
			], 64);
		};
	}
};
//#endregion
export { _sfc_main as t };
