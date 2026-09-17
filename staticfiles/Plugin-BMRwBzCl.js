import { r as importShared } from "./_virtual___federation_fn_import-fHUJv7KH.js";
//#region src/components/EditableList.vue
var { toDisplayString: _toDisplayString$4, createElementVNode: _createElementVNode$5, createTextVNode: _createTextVNode$5, resolveComponent: _resolveComponent$5, withCtx: _withCtx$5, createVNode: _createVNode$5, renderList: _renderList$1, Fragment: _Fragment$3, openBlock: _openBlock$5, createElementBlock: _createElementBlock$3, createBlock: _createBlock$5, createCommentVNode: _createCommentVNode$4, renderSlot: _renderSlot } = await importShared("vue");
var _hoisted_1$3 = { class: "text-subtitle-1 font-weight-medium" };
var _hoisted_2$3 = { class: "d-flex flex-column align-center" };
var _sfc_main$5 = {
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
			const _component_v_icon = _resolveComponent$5("v-icon");
			const _component_v_btn = _resolveComponent$5("v-btn");
			const _component_v_col = _resolveComponent$5("v-col");
			const _component_v_row = _resolveComponent$5("v-row");
			const _component_v_divider = _resolveComponent$5("v-divider");
			return _openBlock$5(), _createElementBlock$3(_Fragment$3, null, [_createVNode$5(_component_v_row, null, {
				default: _withCtx$5(() => [_createVNode$5(_component_v_col, {
					cols: "12",
					class: "d-flex align-center justify-space-between"
				}, {
					default: _withCtx$5(() => [_createElementVNode$5("span", _hoisted_1$3, _toDisplayString$4(__props.title), 1), _createVNode$5(_component_v_btn, {
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
						default: _withCtx$5(() => [_createVNode$5(_component_v_icon, {
							size: "18",
							class: "mr-1"
						}, {
							default: _withCtx$5(() => [..._cache[0] || (_cache[0] = [_createTextVNode$5("mdi-plus", -1)])]),
							_: 1
						}), _cache[1] || (_cache[1] = _createTextVNode$5(" Add ", -1))]),
						_: 1
					}, 8, ["title"])]),
					_: 1
				})]),
				_: 1
			}), (_openBlock$5(true), _createElementBlock$3(_Fragment$3, null, _renderList$1(__props.modelValue, (row, i) => {
				return _openBlock$5(), _createElementBlock$3("div", { key: i }, [i > 0 ? (_openBlock$5(), _createBlock$5(_component_v_divider, {
					key: 0,
					class: "my-2"
				})) : _createCommentVNode$4("", true), _createVNode$5(_component_v_row, null, {
					default: _withCtx$5(() => [_createVNode$5(_component_v_col, {
						cols: "1",
						class: "d-flex flex-column justify-center align-center"
					}, {
						default: _withCtx$5(() => [_createElementVNode$5("div", _hoisted_2$3, [_createVNode$5(_component_v_btn, {
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
							default: _withCtx$5(() => [_createVNode$5(_component_v_icon, { size: "18" }, {
								default: _withCtx$5(() => [..._cache[2] || (_cache[2] = [_createTextVNode$5("mdi-plus", -1)])]),
								_: 1
							})]),
							_: 1
						}, 8, ["onClick", "title"]), _createVNode$5(_component_v_btn, {
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
							default: _withCtx$5(() => [_createVNode$5(_component_v_icon, { size: "18" }, {
								default: _withCtx$5(() => [..._cache[3] || (_cache[3] = [_createTextVNode$5("mdi-delete", -1)])]),
								_: 1
							})]),
							_: 1
						}, 8, ["onClick"])])]),
						_: 2
					}, 1024), _createVNode$5(_component_v_col, { cols: "11" }, {
						default: _withCtx$5(() => [_renderSlot(_ctx.$slots, "default", {
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
	async analyzeRepo(repoUrl, { timeout = 60, scope = "required" } = {}) {
		const res = await request("/mos/plugins/query", {
			method: "POST",
			body: {
				command: "ai-template-maker-analyze",
				args: [repoUrl, scope],
				timeout: Math.min(timeout, 60),
				parse_json: true
			}
		});
		if (res.timed_out) throw new Error(`Analysis timed out after ${res.duration_ms}ms (60s max)`);
		if (!res.success) throw new Error(typeof res.output === "string" ? res.output : `Analysis failed (exit ${res.exit_code})`);
		if (res.output && typeof res.output === "object" && res.output.error) throw new Error(res.output.error);
		if (typeof res.output !== "object") throw new Error("Analysis script did not return valid JSON");
		return res.output;
	},
	createContainer(template) {
		return request("/docker/mos/create", {
			method: "POST",
			body: template
		});
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
//#region \0plugin-vue:export-helper
var _plugin_vue_export_helper_default = (sfc, props) => {
	const target = sfc.__vccOpts || sfc;
	for (const [key, val] of props) target[key] = val;
	return target;
};
//#endregion
//#region src/components/InstallDialog.vue
var { resolveComponent: _resolveComponent$4, openBlock: _openBlock$4, createBlock: _createBlock$4, createCommentVNode: _createCommentVNode$3, withCtx: _withCtx$4, createVNode: _createVNode$4, toDisplayString: _toDisplayString$3, createElementVNode: _createElementVNode$4, createTextVNode: _createTextVNode$4, Fragment: _Fragment$2, createElementBlock: _createElementBlock$2 } = await importShared("vue");
var _hoisted_1$2 = { class: "text-h6" };
var _hoisted_2$2 = { class: "text-caption text-medium-emphasis" };
var _hoisted_3$1 = { class: "mb-4" };
var _hoisted_4 = { class: "mb-4" };
var { computed, ref: ref$4, watch: watch$1 } = await importShared("vue");
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
		const local = ref$4(null);
		const mode = ref$4("docker");
		const installing = ref$4(false);
		const installError = ref$4("");
		const installedOk = ref$4(false);
		watch$1(() => props.result, (result) => {
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
		}, { immediate: true });
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
			const _component_v_img = _resolveComponent$4("v-img");
			const _component_v_icon = _resolveComponent$4("v-icon");
			const _component_v_avatar = _resolveComponent$4("v-avatar");
			const _component_v_spacer = _resolveComponent$4("v-spacer");
			const _component_v_chip = _resolveComponent$4("v-chip");
			const _component_v_card_title = _resolveComponent$4("v-card-title");
			const _component_v_divider = _resolveComponent$4("v-divider");
			const _component_v_alert = _resolveComponent$4("v-alert");
			const _component_v_textarea = _resolveComponent$4("v-textarea");
			const _component_v_text_field = _resolveComponent$4("v-text-field");
			const _component_v_switch = _resolveComponent$4("v-switch");
			const _component_v_col = _resolveComponent$4("v-col");
			const _component_v_row = _resolveComponent$4("v-row");
			const _component_v_label = _resolveComponent$4("v-label");
			const _component_v_card_text = _resolveComponent$4("v-card-text");
			const _component_v_btn = _resolveComponent$4("v-btn");
			const _component_v_card_actions = _resolveComponent$4("v-card-actions");
			const _component_v_card = _resolveComponent$4("v-card");
			const _component_v_dialog = _resolveComponent$4("v-dialog");
			return _openBlock$4(), _createBlock$4(_component_v_dialog, {
				modelValue: open.value,
				"onUpdate:modelValue": _cache[23] || (_cache[23] = ($event) => open.value = $event),
				"max-width": "760",
				scrollable: "",
				persistent: ""
			}, {
				default: _withCtx$4(() => [local.value ? (_openBlock$4(), _createBlock$4(_component_v_card, { key: 0 }, {
					default: _withCtx$4(() => [
						_createVNode$4(_component_v_card_title, { class: "d-flex align-center ga-3" }, {
							default: _withCtx$4(() => [
								_createVNode$4(_component_v_avatar, {
									size: "40",
									rounded: "lg"
								}, {
									default: _withCtx$4(() => [icon.value ? (_openBlock$4(), _createBlock$4(_component_v_img, {
										key: 0,
										src: icon.value
									}, null, 8, ["src"])) : (_openBlock$4(), _createBlock$4(_component_v_icon, {
										key: 1,
										icon: "mdi-package-variant"
									}))]),
									_: 1
								}),
								_createElementVNode$4("div", null, [_createElementVNode$4("div", _hoisted_1$2, _toDisplayString$3(displayName.value), 1), _createElementVNode$4("div", _hoisted_2$2, _toDisplayString$3(mode.value === "compose" ? "Docker Compose stack" : "Single container"), 1)]),
								_createVNode$4(_component_v_spacer),
								category.value ? (_openBlock$4(), _createBlock$4(_component_v_chip, {
									key: 0,
									size: "small",
									variant: "tonal"
								}, {
									default: _withCtx$4(() => [_createTextVNode$4(_toDisplayString$3(category.value), 1)]),
									_: 1
								})) : _createCommentVNode$3("", true)
							]),
							_: 1
						}),
						_createVNode$4(_component_v_divider),
						_createVNode$4(_component_v_card_text, { style: { "max-height": "60vh" } }, {
							default: _withCtx$4(() => [
								installError.value ? (_openBlock$4(), _createBlock$4(_component_v_alert, {
									key: 0,
									type: "error",
									variant: "tonal",
									density: "compact",
									class: "mb-4"
								}, {
									default: _withCtx$4(() => [_createTextVNode$4(_toDisplayString$3(installError.value), 1)]),
									_: 1
								})) : _createCommentVNode$3("", true),
								installedOk.value ? (_openBlock$4(), _createBlock$4(_component_v_alert, {
									key: 1,
									type: "success",
									variant: "tonal",
									density: "compact",
									class: "mb-4"
								}, {
									default: _withCtx$4(() => [..._cache[24] || (_cache[24] = [_createTextVNode$4(" Installed successfully. ", -1)])]),
									_: 1
								})) : _createCommentVNode$3("", true),
								_createVNode$4(_component_v_textarea, {
									modelValue: description.value,
									"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => description.value = $event),
									label: "Description",
									rows: "2",
									"auto-grow": "",
									class: "mb-2",
									"hide-details": ""
								}, null, 8, ["modelValue"]),
								_createVNode$4(_component_v_divider, { class: "my-4" }),
								mode.value === "docker" ? (_openBlock$4(), _createElementBlock$2(_Fragment$2, { key: 2 }, [
									_createVNode$4(_component_v_text_field, {
										label: "Name",
										modelValue: local.value.name,
										"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => local.value.name = $event),
										"hide-details": "auto",
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$4(_component_v_text_field, {
										label: "Repository",
										modelValue: local.value.repo,
										"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => local.value.repo = $event),
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$4(_component_v_text_field, {
										label: "Network",
										modelValue: local.value.network,
										"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => local.value.network = $event),
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$4(_component_v_text_field, {
										label: "Custom IP",
										modelValue: local.value.custom_ip,
										"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => local.value.custom_ip = $event),
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$4(_component_v_text_field, {
										label: "Default shell",
										modelValue: local.value.default_shell,
										"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => local.value.default_shell = $event),
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$4(_component_v_switch, {
										label: "Privileged",
										modelValue: local.value.privileged,
										"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => local.value.privileged = $event),
										inset: "",
										color: "green",
										density: "compact",
										"hide-details": "auto"
									}, null, 8, ["modelValue"]),
									_createVNode$4(_component_v_switch, {
										label: "No autoupdate",
										modelValue: local.value.no_autoupdate,
										"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => local.value.no_autoupdate = $event),
										inset: "",
										color: "green",
										density: "compact",
										"hide-details": "auto",
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$4(_component_v_text_field, {
										label: "Extra parameters",
										modelValue: local.value.extra_parameters,
										"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => local.value.extra_parameters = $event),
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$4(_component_v_text_field, {
										label: "Post parameters",
										modelValue: local.value.post_parameters,
										"onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => local.value.post_parameters = $event),
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$4(_component_v_text_field, {
										label: "Web UI URL",
										modelValue: local.value.web_ui_url,
										"onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => local.value.web_ui_url = $event),
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$4(_component_v_text_field, {
										label: "Icon URL",
										modelValue: icon.value,
										"onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => icon.value = $event),
										"hide-details": "auto"
									}, null, 8, ["modelValue"]),
									_createVNode$4(_component_v_divider, { class: "my-2" }),
									_createVNode$4(_sfc_main$5, {
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
										default: _withCtx$4(({ row }) => [
											_createVNode$4(_component_v_row, null, {
												default: _withCtx$4(() => [_createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
														label: "Name",
														modelValue: row.name,
														"onUpdate:modelValue": ($event) => row.name = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024), _createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
														label: "Mode",
														modelValue: row.mode,
														"onUpdate:modelValue": ($event) => row.mode = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024),
											_createVNode$4(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$4(() => [_createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
														label: "Host path",
														modelValue: row.host,
														"onUpdate:modelValue": ($event) => row.host = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024), _createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
														label: "Container path",
														modelValue: row.container,
														"onUpdate:modelValue": ($event) => row.container = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024),
											_createVNode$4(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$4(() => [_createVNode$4(_component_v_col, { cols: "12" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
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
									_createVNode$4(_component_v_divider, { class: "my-2" }),
									_createVNode$4(_sfc_main$5, {
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
										default: _withCtx$4(({ row }) => [
											_createVNode$4(_component_v_row, null, {
												default: _withCtx$4(() => [_createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
														label: "Name",
														modelValue: row.name,
														"onUpdate:modelValue": ($event) => row.name = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024), _createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
														label: "Protocol",
														modelValue: row.protocol,
														"onUpdate:modelValue": ($event) => row.protocol = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024),
											_createVNode$4(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$4(() => [_createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
														label: "Host",
														modelValue: row.host,
														"onUpdate:modelValue": ($event) => row.host = $event,
														density: "compact",
														error: !!row.host && !/^[0-9.-]+$/.test(row.host)
													}, null, 8, [
														"modelValue",
														"onUpdate:modelValue",
														"error"
													])]),
													_: 2
												}, 1024), _createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
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
											_createVNode$4(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$4(() => [_createVNode$4(_component_v_col, { cols: "12" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
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
									_createVNode$4(_component_v_divider, { class: "my-2" }),
									_createVNode$4(_sfc_main$5, {
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
										default: _withCtx$4(({ row }) => [
											_createVNode$4(_component_v_row, null, {
												default: _withCtx$4(() => [_createVNode$4(_component_v_col, { cols: "12" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
														label: "Name",
														modelValue: row.name,
														"onUpdate:modelValue": ($event) => row.name = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024),
											_createVNode$4(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$4(() => [_createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
														label: "Container",
														modelValue: row.container,
														"onUpdate:modelValue": ($event) => row.container = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024), _createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
														label: "Host",
														modelValue: row.host,
														"onUpdate:modelValue": ($event) => row.host = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024)]),
												_: 2
											}, 1024),
											_createVNode$4(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$4(() => [_createVNode$4(_component_v_col, { cols: "12" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
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
									_createVNode$4(_component_v_divider, { class: "my-2" }),
									_createVNode$4(_sfc_main$5, {
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
										default: _withCtx$4(({ row }) => [
											_createVNode$4(_component_v_row, null, {
												default: _withCtx$4(() => [_createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
														label: "Name",
														modelValue: row.name,
														"onUpdate:modelValue": ($event) => row.name = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024), _createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_switch, {
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
											_createVNode$4(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$4(() => [_createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
														label: "Key",
														modelValue: row.key,
														"onUpdate:modelValue": ($event) => row.key = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024), _createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
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
											_createVNode$4(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$4(() => [_createVNode$4(_component_v_col, { cols: "12" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
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
									_createVNode$4(_component_v_divider, { class: "my-2" }),
									_createVNode$4(_sfc_main$5, {
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
										default: _withCtx$4(({ row }) => [
											_createVNode$4(_component_v_row, null, {
												default: _withCtx$4(() => [_createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
														label: "Name",
														modelValue: row.name,
														"onUpdate:modelValue": ($event) => row.name = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024), _createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_switch, {
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
											_createVNode$4(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$4(() => [_createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
														label: "Key",
														modelValue: row.key,
														"onUpdate:modelValue": ($event) => row.key = $event,
														density: "compact"
													}, null, 8, ["modelValue", "onUpdate:modelValue"])]),
													_: 2
												}, 1024), _createVNode$4(_component_v_col, { cols: "6" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
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
											_createVNode$4(_component_v_row, { class: "mt-n2" }, {
												default: _withCtx$4(() => [_createVNode$4(_component_v_col, { cols: "12" }, {
													default: _withCtx$4(() => [_createVNode$4(_component_v_text_field, {
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
								], 64)) : (_openBlock$4(), _createElementBlock$2(_Fragment$2, { key: 3 }, [
									_createVNode$4(_component_v_text_field, {
										modelValue: local.value.name,
										"onUpdate:modelValue": _cache[17] || (_cache[17] = ($event) => local.value.name = $event),
										label: "Stack name",
										class: "mb-4"
									}, null, 8, ["modelValue"]),
									_createElementVNode$4("div", _hoisted_3$1, [_createVNode$4(_component_v_label, {
										class: "text-body-2",
										style: { "display": "block" }
									}, {
										default: _withCtx$4(() => [..._cache[25] || (_cache[25] = [_createTextVNode$4("Compose yaml", -1)])]),
										_: 1
									}), _createVNode$4(_component_v_textarea, {
										modelValue: local.value.yaml,
										"onUpdate:modelValue": _cache[18] || (_cache[18] = ($event) => local.value.yaml = $event),
										rows: "12",
										class: "font-mono",
										variant: "outlined",
										"hide-details": ""
									}, null, 8, ["modelValue"])]),
									_createElementVNode$4("div", _hoisted_4, [_createVNode$4(_component_v_label, {
										class: "text-body-2",
										style: { "display": "block" }
									}, {
										default: _withCtx$4(() => [..._cache[26] || (_cache[26] = [_createTextVNode$4("Environment variables", -1)])]),
										_: 1
									}), _createVNode$4(_component_v_textarea, {
										modelValue: local.value.env,
										"onUpdate:modelValue": _cache[19] || (_cache[19] = ($event) => local.value.env = $event),
										rows: "6",
										class: "font-mono",
										variant: "outlined",
										"hide-details": ""
									}, null, 8, ["modelValue"])]),
									_createVNode$4(_component_v_text_field, {
										modelValue: icon.value,
										"onUpdate:modelValue": _cache[20] || (_cache[20] = ($event) => icon.value = $event),
										label: "Icon URL",
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$4(_component_v_text_field, {
										modelValue: local.value.template.webui,
										"onUpdate:modelValue": _cache[21] || (_cache[21] = ($event) => local.value.template.webui = $event),
										label: "Web UI URL",
										class: "mb-2"
									}, null, 8, ["modelValue"]),
									_createVNode$4(_component_v_switch, {
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
						_createVNode$4(_component_v_divider),
						_createVNode$4(_component_v_card_actions, null, {
							default: _withCtx$4(() => [
								_createVNode$4(_component_v_btn, {
									variant: "text",
									onClick: close
								}, {
									default: _withCtx$4(() => [..._cache[27] || (_cache[27] = [_createTextVNode$4("Cancel", -1)])]),
									_: 1
								}),
								_createVNode$4(_component_v_spacer),
								_createVNode$4(_component_v_btn, {
									color: "primary",
									loading: installing.value,
									onClick: install
								}, {
									default: _withCtx$4(() => [..._cache[28] || (_cache[28] = [_createTextVNode$4("Install", -1)])]),
									_: 1
								}, 8, ["loading"])
							]),
							_: 1
						})
					]),
					_: 1
				})) : _createCommentVNode$3("", true)]),
				_: 1
			}, 8, ["modelValue"]);
		};
	}
}, [["__scopeId", "data-v-1bbd6d4b"]]);
//#endregion
//#region src/components/AnalyzeForm.vue
var { createElementVNode: _createElementVNode$3, toDisplayString: _toDisplayString$2, createTextVNode: _createTextVNode$3, resolveComponent: _resolveComponent$3, withCtx: _withCtx$3, openBlock: _openBlock$3, createBlock: _createBlock$3, createCommentVNode: _createCommentVNode$2, withKeys: _withKeys, createVNode: _createVNode$3, Fragment: _Fragment$1, createElementBlock: _createElementBlock$1 } = await importShared("vue");
var _hoisted_1$1 = { class: "mt-2" };
var _hoisted_2$1 = { class: "text-caption text-medium-emphasis mt-1" };
var { ref: ref$3 } = await importShared("vue");
var _sfc_main$3 = {
	__name: "AnalyzeForm",
	setup(__props) {
		const repoUrl = ref$3("");
		const scope = ref$3("required");
		const analyzing = ref$3(false);
		const error = ref$3("");
		const result = ref$3(null);
		const dialogOpen = ref$3(false);
		const showInstalledSnackbar = ref$3(false);
		async function analyze() {
			analyzing.value = true;
			error.value = "";
			try {
				const data = await mosClient.analyzeRepo(repoUrl.value.trim(), { scope: scope.value });
				result.value = data;
				dialogOpen.value = true;
			} catch (e) {
				error.value = e.message;
			} finally {
				analyzing.value = false;
			}
		}
		function onInstalled() {
			dialogOpen.value = false;
			showInstalledSnackbar.value = true;
		}
		return (_ctx, _cache) => {
			const _component_v_alert = _resolveComponent$3("v-alert");
			const _component_v_text_field = _resolveComponent$3("v-text-field");
			const _component_v_btn = _resolveComponent$3("v-btn");
			const _component_v_btn_toggle = _resolveComponent$3("v-btn-toggle");
			const _component_v_card_text = _resolveComponent$3("v-card-text");
			const _component_v_spacer = _resolveComponent$3("v-spacer");
			const _component_v_card_actions = _resolveComponent$3("v-card-actions");
			const _component_v_card = _resolveComponent$3("v-card");
			const _component_v_snackbar = _resolveComponent$3("v-snackbar");
			return _openBlock$3(), _createElementBlock$1(_Fragment$1, null, [
				_createVNode$3(_component_v_card, { flat: "" }, {
					default: _withCtx$3(() => [_createVNode$3(_component_v_card_text, null, {
						default: _withCtx$3(() => [
							_cache[7] || (_cache[7] = _createElementVNode$3("p", { class: "text-body-2 text-medium-emphasis mb-4" }, " Paste a GitHub repository URL. Your configured AI provider will look at its README, Dockerfile, and any Compose file to build a MOS template, resolve an icon, and let you review it before installing. ", -1)),
							error.value ? (_openBlock$3(), _createBlock$3(_component_v_alert, {
								key: 0,
								type: "error",
								variant: "tonal",
								density: "compact",
								class: "mb-4"
							}, {
								default: _withCtx$3(() => [_createTextVNode$3(_toDisplayString$2(error.value), 1)]),
								_: 1
							})) : _createCommentVNode$2("", true),
							_createVNode$3(_component_v_text_field, {
								modelValue: repoUrl.value,
								"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => repoUrl.value = $event),
								label: "GitHub repository URL",
								placeholder: "https://github.com/owner/repo",
								disabled: analyzing.value,
								onKeyup: _withKeys(analyze, ["enter"])
							}, null, 8, ["modelValue", "disabled"]),
							_createElementVNode$3("div", _hoisted_1$1, [
								_cache[6] || (_cache[6] = _createElementVNode$3("div", { class: "text-body-2 text-medium-emphasis mb-1" }, "Template scope", -1)),
								_createVNode$3(_component_v_btn_toggle, {
									modelValue: scope.value,
									"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => scope.value = $event),
									color: "primary",
									density: "comfortable",
									mandatory: "",
									variant: "outlined",
									disabled: analyzing.value,
									divided: ""
								}, {
									default: _withCtx$3(() => [_createVNode$3(_component_v_btn, { value: "required" }, {
										default: _withCtx$3(() => [..._cache[4] || (_cache[4] = [_createTextVNode$3("Required only", -1)])]),
										_: 1
									}), _createVNode$3(_component_v_btn, { value: "all" }, {
										default: _withCtx$3(() => [..._cache[5] || (_cache[5] = [_createTextVNode$3("All settings", -1)])]),
										_: 1
									})]),
									_: 1
								}, 8, ["modelValue", "disabled"]),
								_createElementVNode$3("div", _hoisted_2$1, _toDisplayString$2(scope.value === "required" ? "Only what's needed to run - fewer fields, but you may need to add something back later." : "Every setting found in the repo's docs - a longer list you can freely delete from."), 1)
							])
						]),
						_: 1
					}), _createVNode$3(_component_v_card_actions, null, {
						default: _withCtx$3(() => [_createVNode$3(_component_v_spacer), _createVNode$3(_component_v_btn, {
							color: "primary",
							loading: analyzing.value,
							disabled: !repoUrl.value,
							onClick: analyze
						}, {
							default: _withCtx$3(() => [..._cache[8] || (_cache[8] = [_createTextVNode$3(" Analyze ", -1)])]),
							_: 1
						}, 8, ["loading", "disabled"])]),
						_: 1
					})]),
					_: 1
				}),
				_createVNode$3(InstallDialog_default, {
					modelValue: dialogOpen.value,
					"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => dialogOpen.value = $event),
					result: result.value,
					onInstalled
				}, null, 8, ["modelValue", "result"]),
				_createVNode$3(_component_v_snackbar, {
					modelValue: showInstalledSnackbar.value,
					"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => showInstalledSnackbar.value = $event),
					color: "success",
					timeout: "4000"
				}, {
					default: _withCtx$3(() => [..._cache[9] || (_cache[9] = [_createTextVNode$3(" Installed — check the Docker overview. ", -1)])]),
					_: 1
				}, 8, ["modelValue"])
			], 64);
		};
	}
};
//#endregion
//#region src/components/HistoryList.vue
var { toDisplayString: _toDisplayString$1, createTextVNode: _createTextVNode$2, resolveComponent: _resolveComponent$2, withCtx: _withCtx$2, openBlock: _openBlock$2, createBlock: _createBlock$2, createCommentVNode: _createCommentVNode$1, createVNode: _createVNode$2, createElementBlock: _createElementBlock, renderList: _renderList, Fragment: _Fragment, createElementVNode: _createElementVNode$2 } = await importShared("vue");
var _hoisted_1 = {
	key: 1,
	class: "d-flex justify-center py-8"
};
var _hoisted_2 = {
	key: 2,
	class: "text-body-2 text-medium-emphasis text-center py-8"
};
var _hoisted_3 = { class: "text-caption" };
var { ref: ref$2, onMounted: onMounted$1 } = await importShared("vue");
var _sfc_main$2 = {
	__name: "HistoryList",
	setup(__props) {
		const entries = ref$2([]);
		const loading = ref$2(true);
		const clearing = ref$2(false);
		const error = ref$2("");
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
			const _component_v_alert = _resolveComponent$2("v-alert");
			const _component_v_progress_circular = _resolveComponent$2("v-progress-circular");
			const _component_v_icon = _resolveComponent$2("v-icon");
			const _component_v_list_item_title = _resolveComponent$2("v-list-item-title");
			const _component_v_chip = _resolveComponent$2("v-chip");
			const _component_v_list_item_subtitle = _resolveComponent$2("v-list-item-subtitle");
			const _component_v_btn = _resolveComponent$2("v-btn");
			const _component_v_list_item = _resolveComponent$2("v-list-item");
			const _component_v_list = _resolveComponent$2("v-list");
			const _component_v_card_text = _resolveComponent$2("v-card-text");
			const _component_v_spacer = _resolveComponent$2("v-spacer");
			const _component_v_card_actions = _resolveComponent$2("v-card-actions");
			const _component_v_card = _resolveComponent$2("v-card");
			return _openBlock$2(), _createBlock$2(_component_v_card, { flat: "" }, {
				default: _withCtx$2(() => [_createVNode$2(_component_v_card_text, null, {
					default: _withCtx$2(() => [error.value ? (_openBlock$2(), _createBlock$2(_component_v_alert, {
						key: 0,
						type: "error",
						variant: "tonal",
						density: "compact",
						class: "mb-4"
					}, {
						default: _withCtx$2(() => [_createTextVNode$2(_toDisplayString$1(error.value), 1)]),
						_: 1
					})) : _createCommentVNode$1("", true), loading.value ? (_openBlock$2(), _createElementBlock("div", _hoisted_1, [_createVNode$2(_component_v_progress_circular, {
						indeterminate: "",
						color: "primary"
					})])) : !entries.value.length ? (_openBlock$2(), _createElementBlock("div", _hoisted_2, " No repositories analyzed yet. ")) : (_openBlock$2(), _createBlock$2(_component_v_list, {
						key: 3,
						lines: "two",
						class: "bg-transparent"
					}, {
						default: _withCtx$2(() => [(_openBlock$2(true), _createElementBlock(_Fragment, null, _renderList(entries.value, (entry, i) => {
							return _openBlock$2(), _createBlock$2(_component_v_list_item, {
								key: i,
								class: "px-0"
							}, {
								prepend: _withCtx$2(() => [_createVNode$2(_component_v_icon, {
									icon: entry.mode === "compose" ? "mdi-layers-outline" : "mdi-package-variant",
									class: "mr-3"
								}, null, 8, ["icon"])]),
								append: _withCtx$2(() => [_createVNode$2(_component_v_btn, {
									icon: "mdi-open-in-new",
									size: "small",
									variant: "text",
									href: entry.url,
									target: "_blank",
									rel: "noopener noreferrer",
									title: "Open repository",
									"aria-label": "Open repository in a new tab"
								}, null, 8, ["href"])]),
								default: _withCtx$2(() => [_createVNode$2(_component_v_list_item_title, null, {
									default: _withCtx$2(() => [_createTextVNode$2(_toDisplayString$1(entry.repo), 1)]),
									_: 2
								}, 1024), _createVNode$2(_component_v_list_item_subtitle, null, {
									default: _withCtx$2(() => [
										_createVNode$2(_component_v_chip, {
											size: "x-small",
											variant: "tonal",
											class: "mr-1"
										}, {
											default: _withCtx$2(() => [_createTextVNode$2(_toDisplayString$1(entry.mode === "compose" ? "Compose" : "Docker"), 1)]),
											_: 2
										}, 1024),
										_createVNode$2(_component_v_chip, {
											size: "x-small",
											variant: "tonal",
											class: "mr-1"
										}, {
											default: _withCtx$2(() => [_createTextVNode$2(_toDisplayString$1(entry.scope === "all" ? "All settings" : "Required only"), 1)]),
											_: 2
										}, 1024),
										_createElementVNode$2("span", _hoisted_3, _toDisplayString$1(formatDate(entry.analyzed_at)), 1)
									]),
									_: 2
								}, 1024)]),
								_: 2
							}, 1024);
						}), 128))]),
						_: 1
					}))]),
					_: 1
				}), entries.value.length ? (_openBlock$2(), _createBlock$2(_component_v_card_actions, { key: 0 }, {
					default: _withCtx$2(() => [_createVNode$2(_component_v_spacer), _createVNode$2(_component_v_btn, {
						variant: "text",
						color: "error",
						loading: clearing.value,
						onClick: clear
					}, {
						default: _withCtx$2(() => [..._cache[0] || (_cache[0] = [_createTextVNode$2("Clear history", -1)])]),
						_: 1
					}, 8, ["loading"])]),
					_: 1
				})) : _createCommentVNode$1("", true)]),
				_: 1
			});
		};
	}
};
//#endregion
//#region src/components/SettingsForm.vue
var { toDisplayString: _toDisplayString, createTextVNode: _createTextVNode$1, resolveComponent: _resolveComponent$1, withCtx: _withCtx$1, openBlock: _openBlock$1, createBlock: _createBlock$1, createCommentVNode: _createCommentVNode, createVNode: _createVNode$1, createElementVNode: _createElementVNode$1 } = await importShared("vue");
var { reactive, ref: ref$1, watch, onMounted } = await importShared("vue");
var _sfc_main$1 = {
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
				model: "llama3.1"
			},
			github_token: ""
		});
		const openPanel = ref$1("anthropic");
		const saving = ref$1(false);
		const saved = ref$1(false);
		const error = ref$1("");
		watch(() => form.provider, (p) => {
			openPanel.value = p;
		});
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
				await mosClient.saveSettings({ ...form });
				saved.value = true;
			} catch (e) {
				error.value = e.message;
			} finally {
				saving.value = false;
			}
		}
		return (_ctx, _cache) => {
			const _component_v_alert = _resolveComponent$1("v-alert");
			const _component_v_select = _resolveComponent$1("v-select");
			const _component_v_chip = _resolveComponent$1("v-chip");
			const _component_v_expansion_panel_title = _resolveComponent$1("v-expansion-panel-title");
			const _component_v_text_field = _resolveComponent$1("v-text-field");
			const _component_v_expansion_panel_text = _resolveComponent$1("v-expansion-panel-text");
			const _component_v_expansion_panel = _resolveComponent$1("v-expansion-panel");
			const _component_v_expansion_panels = _resolveComponent$1("v-expansion-panels");
			const _component_v_card_text = _resolveComponent$1("v-card-text");
			const _component_v_spacer = _resolveComponent$1("v-spacer");
			const _component_v_btn = _resolveComponent$1("v-btn");
			const _component_v_card_actions = _resolveComponent$1("v-card-actions");
			const _component_v_card = _resolveComponent$1("v-card");
			return _openBlock$1(), _createBlock$1(_component_v_card, { flat: "" }, {
				default: _withCtx$1(() => [_createVNode$1(_component_v_card_text, null, {
					default: _withCtx$1(() => [
						error.value ? (_openBlock$1(), _createBlock$1(_component_v_alert, {
							key: 0,
							type: "error",
							variant: "tonal",
							class: "mb-4",
							density: "compact"
						}, {
							default: _withCtx$1(() => [_createTextVNode$1(_toDisplayString(error.value), 1)]),
							_: 1
						})) : _createCommentVNode("", true),
						saved.value ? (_openBlock$1(), _createBlock$1(_component_v_alert, {
							key: 1,
							type: "success",
							variant: "tonal",
							class: "mb-4",
							density: "compact"
						}, {
							default: _withCtx$1(() => [..._cache[9] || (_cache[9] = [_createTextVNode$1(" Settings saved. ", -1)])]),
							_: 1
						})) : _createCommentVNode("", true),
						_createVNode$1(_component_v_select, {
							modelValue: form.provider,
							"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => form.provider = $event),
							items: providerItems,
							label: "Default AI provider",
							hint: "Which provider the analyze script actually uses when you click Analyze.",
							"persistent-hint": "",
							class: "mb-4"
						}, null, 8, ["modelValue"]),
						_createVNode$1(_component_v_expansion_panels, {
							modelValue: openPanel.value,
							"onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => openPanel.value = $event),
							class: "mb-4",
							variant: "accordion"
						}, {
							default: _withCtx$1(() => [
								_createVNode$1(_component_v_expansion_panel, { value: "anthropic" }, {
									default: _withCtx$1(() => [_createVNode$1(_component_v_expansion_panel_title, null, {
										default: _withCtx$1(() => [_cache[11] || (_cache[11] = _createTextVNode$1(" Anthropic (Claude) ", -1)), form.provider === "anthropic" ? (_openBlock$1(), _createBlock$1(_component_v_chip, {
											key: 0,
											size: "x-small",
											color: "primary",
											class: "ml-2"
										}, {
											default: _withCtx$1(() => [..._cache[10] || (_cache[10] = [_createTextVNode$1("Default", -1)])]),
											_: 1
										})) : _createCommentVNode("", true)]),
										_: 1
									}), _createVNode$1(_component_v_expansion_panel_text, null, {
										default: _withCtx$1(() => [
											_createVNode$1(_component_v_alert, {
												type: "warning",
												variant: "tonal",
												density: "compact",
												class: "mb-3"
											}, {
												default: _withCtx$1(() => [..._cache[12] || (_cache[12] = [
													_createTextVNode$1(" Requires a ", -1),
													_createElementVNode$1("strong", null, "paid", -1),
													_createTextVNode$1(" API key with billing enabled — there is no free tier for API access. In exchange it's the most reliable at following the template schema exactly and rarely needs a retry. Cost is usage-based, typically a few cents per repository analyzed. ", -1)
												])]),
												_: 1
											}),
											_cache[13] || (_cache[13] = _createElementVNode$1("div", { class: "text-caption text-medium-emphasis mb-3" }, [_createElementVNode$1("strong", null, "Setup:"), _createTextVNode$1(" sign in at console.anthropic.com → add billing/credits → API Keys → Create Key → paste it below. ")], -1)),
											_createVNode$1(_component_v_text_field, {
												modelValue: form.anthropic.api_key,
												"onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => form.anthropic.api_key = $event),
												label: "Anthropic API key",
												type: "password",
												class: "mb-2"
											}, null, 8, ["modelValue"]),
											_createVNode$1(_component_v_text_field, {
												modelValue: form.anthropic.model,
												"onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => form.anthropic.model = $event),
												label: "Model",
												hint: "e.g. claude-sonnet-5",
												"persistent-hint": ""
											}, null, 8, ["modelValue"])
										]),
										_: 1
									})]),
									_: 1
								}),
								_createVNode$1(_component_v_expansion_panel, { value: "gemini" }, {
									default: _withCtx$1(() => [_createVNode$1(_component_v_expansion_panel_title, null, {
										default: _withCtx$1(() => [_cache[15] || (_cache[15] = _createTextVNode$1(" Google Gemini ", -1)), form.provider === "gemini" ? (_openBlock$1(), _createBlock$1(_component_v_chip, {
											key: 0,
											size: "x-small",
											color: "primary",
											class: "ml-2"
										}, {
											default: _withCtx$1(() => [..._cache[14] || (_cache[14] = [_createTextVNode$1("Default", -1)])]),
											_: 1
										})) : _createCommentVNode("", true)]),
										_: 1
									}), _createVNode$1(_component_v_expansion_panel_text, null, {
										default: _withCtx$1(() => [
											_createVNode$1(_component_v_alert, {
												type: "info",
												variant: "tonal",
												density: "compact",
												class: "mb-3"
											}, {
												default: _withCtx$1(() => [..._cache[16] || (_cache[16] = [_createTextVNode$1(" Google AI Studio issues real API keys with a genuinely free tier — no billing required for typical personal use. The tradeoff: free-tier requests are rate-limited (fewer analyses per minute/day), and Gemini is somewhat less consistent than Claude at holding together this exact JSON schema on the first try. ", -1)])]),
												_: 1
											}),
											_cache[17] || (_cache[17] = _createElementVNode$1("div", { class: "text-caption text-medium-emphasis mb-3" }, [_createElementVNode$1("strong", null, "Setup:"), _createTextVNode$1(" go to aistudio.google.com → sign in with a Google account → \"Get API key\" → \"Create API key\" → paste it below. ")], -1)),
											_createVNode$1(_component_v_text_field, {
												modelValue: form.gemini.api_key,
												"onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => form.gemini.api_key = $event),
												label: "Gemini API key",
												type: "password",
												class: "mb-2"
											}, null, 8, ["modelValue"]),
											_createVNode$1(_component_v_text_field, {
												modelValue: form.gemini.model,
												"onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => form.gemini.model = $event),
												label: "Model",
												hint: "e.g. gemini-2.5-flash",
												"persistent-hint": ""
											}, null, 8, ["modelValue"])
										]),
										_: 1
									})]),
									_: 1
								}),
								_createVNode$1(_component_v_expansion_panel, { value: "ollama" }, {
									default: _withCtx$1(() => [_createVNode$1(_component_v_expansion_panel_title, null, {
										default: _withCtx$1(() => [_cache[19] || (_cache[19] = _createTextVNode$1(" Ollama (local, self-hosted) ", -1)), form.provider === "ollama" ? (_openBlock$1(), _createBlock$1(_component_v_chip, {
											key: 0,
											size: "x-small",
											color: "primary",
											class: "ml-2"
										}, {
											default: _withCtx$1(() => [..._cache[18] || (_cache[18] = [_createTextVNode$1("Default", -1)])]),
											_: 1
										})) : _createCommentVNode("", true)]),
										_: 1
									}), _createVNode$1(_component_v_expansion_panel_text, null, {
										default: _withCtx$1(() => [
											_createVNode$1(_component_v_alert, {
												type: "info",
												variant: "tonal",
												density: "compact",
												class: "mb-3"
											}, {
												default: _withCtx$1(() => [..._cache[20] || (_cache[20] = [_createTextVNode$1(" Completely free and private — no API key, nothing leaves your network. The tradeoff: it's noticeably slower than a cloud API (especially without a GPU), and small local models are less reliable at producing this whole schema correctly in one shot. A slow model can also exceed MOS's 60-second query timeout, in which case the analysis just fails. ", -1)])]),
												_: 1
											}),
											_cache[21] || (_cache[21] = _createElementVNode$1("div", { class: "text-caption text-medium-emphasis mb-3" }, [
												_createElementVNode$1("strong", null, "Setup:"),
												_createTextVNode$1(" install Ollama (ollama.com) on a machine reachable from this MOS host → run "),
												_createElementVNode$1("code", null, "ollama pull llama3.1"),
												_createTextVNode$1(" (or another model) → make sure its API port (default 11434) is reachable from this host → set the host/model below. ")
											], -1)),
											_createVNode$1(_component_v_text_field, {
												modelValue: form.ollama.host,
												"onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => form.ollama.host = $event),
												label: "Ollama host",
												hint: "e.g. http://192.168.1.10:11434",
												"persistent-hint": "",
												class: "mb-2"
											}, null, 8, ["modelValue"]),
											_createVNode$1(_component_v_text_field, {
												modelValue: form.ollama.model,
												"onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => form.ollama.model = $event),
												label: "Model",
												hint: "must already be pulled on that host",
												"persistent-hint": ""
											}, null, 8, ["modelValue"])
										]),
										_: 1
									})]),
									_: 1
								})
							]),
							_: 1
						}, 8, ["modelValue"]),
						_createVNode$1(_component_v_text_field, {
							modelValue: form.github_token,
							"onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => form.github_token = $event),
							label: "GitHub token (optional)",
							type: "password",
							hint: "Raises GitHub API rate limits when analyzing repos. Not required for public repos at low volume.",
							"persistent-hint": ""
						}, null, 8, ["modelValue"])
					]),
					_: 1
				}), _createVNode$1(_component_v_card_actions, null, {
					default: _withCtx$1(() => [_createVNode$1(_component_v_spacer), _createVNode$1(_component_v_btn, {
						color: "primary",
						loading: saving.value,
						onClick: save
					}, {
						default: _withCtx$1(() => [..._cache[22] || (_cache[22] = [_createTextVNode$1("Save", -1)])]),
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
//#region src/Plugin.vue
var { createElementVNode: _createElementVNode, createTextVNode: _createTextVNode, resolveComponent: _resolveComponent, withCtx: _withCtx, createVNode: _createVNode, openBlock: _openBlock, createBlock: _createBlock } = await importShared("vue");
var { ref } = await importShared("vue");
var _sfc_main = {
	__name: "Plugin",
	setup(__props) {
		const tab = ref("analyze");
		return (_ctx, _cache) => {
			const _component_v_alert = _resolveComponent("v-alert");
			const _component_v_tab = _resolveComponent("v-tab");
			const _component_v_tabs = _resolveComponent("v-tabs");
			const _component_v_window_item = _resolveComponent("v-window-item");
			const _component_v_window = _resolveComponent("v-window");
			const _component_v_sheet = _resolveComponent("v-sheet");
			return _openBlock(), _createBlock(_component_v_sheet, {
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
						default: _withCtx(() => [..._cache[2] || (_cache[2] = [_createElementVNode("strong", null, "Use at your own risk.", -1), _createTextVNode(" AI-generated templates can be wrong — a misread port, an invented path, a variable that isn't actually optional. Review every field and check the project's own documentation before clicking Install. ", -1)])]),
						_: 1
					}),
					_createVNode(_component_v_tabs, {
						modelValue: tab.value,
						"onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => tab.value = $event),
						class: "mb-4"
					}, {
						default: _withCtx(() => [
							_createVNode(_component_v_tab, { value: "analyze" }, {
								default: _withCtx(() => [..._cache[3] || (_cache[3] = [_createTextVNode("Analyze", -1)])]),
								_: 1
							}),
							_createVNode(_component_v_tab, { value: "history" }, {
								default: _withCtx(() => [..._cache[4] || (_cache[4] = [_createTextVNode("History", -1)])]),
								_: 1
							}),
							_createVNode(_component_v_tab, { value: "settings" }, {
								default: _withCtx(() => [..._cache[5] || (_cache[5] = [_createTextVNode("Settings", -1)])]),
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
								default: _withCtx(() => [_createVNode(_sfc_main$3)]),
								_: 1
							}),
							_createVNode(_component_v_window_item, { value: "history" }, {
								default: _withCtx(() => [_createVNode(_sfc_main$2)]),
								_: 1
							}),
							_createVNode(_component_v_window_item, { value: "settings" }, {
								default: _withCtx(() => [_createVNode(_sfc_main$1)]),
								_: 1
							})
						]),
						_: 1
					}, 8, ["modelValue"])
				]),
				_: 1
			});
		};
	}
};
//#endregion
export { _sfc_main as t };
