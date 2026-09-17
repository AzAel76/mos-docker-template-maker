<template>
  <v-dialog v-model="open" max-width="760" scrollable persistent>
    <v-card v-if="local">
      <v-card-title class="d-flex align-center ga-3">
        <v-avatar size="40" rounded="lg">
          <v-img v-if="icon" :src="icon" />
          <v-icon v-else icon="mdi-package-variant" />
        </v-avatar>
        <div>
          <div class="text-h6">{{ displayName }}</div>
          <div class="text-caption text-medium-emphasis">{{ mode === 'compose' ? 'Docker Compose stack' : 'Single container' }}</div>
        </div>
        <v-spacer />
        <v-chip v-if="category" size="small" variant="tonal">{{ category }}</v-chip>
      </v-card-title>

      <v-divider />

      <v-card-text style="max-height: 60vh">
        <v-alert v-if="installError" type="error" variant="tonal" density="compact" class="mb-4">
          {{ installError }}
        </v-alert>
        <v-alert v-if="installedOk" type="success" variant="tonal" density="compact" class="mb-4">
          Installed successfully.
        </v-alert>

        <v-textarea v-model="description" label="Description" rows="2" auto-grow class="mb-2" hide-details />
        <v-divider class="my-4"></v-divider>

        <!-- ===== Docker (single container) mode - mirrors mos-frontend's
             dockerCreate.vue field set/order, since that's the dialog this
             replaces (there is no plugin hook into the real one - see
             InstallDialog design notes). ===== -->
        <template v-if="mode === 'docker'">
          <v-text-field :label="'Name'" v-model="local.name" hide-details="auto" class="mb-2" />
          <v-text-field label="Repository" v-model="local.repo" class="mb-2" />
          <v-text-field label="Network" v-model="local.network" class="mb-2" />
          <v-text-field label="Custom IP" v-model="local.custom_ip" class="mb-2" />
          <v-text-field label="Default shell" v-model="local.default_shell" class="mb-2" />
          <v-switch label="Privileged" v-model="local.privileged" inset color="green" density="compact" hide-details="auto" />
          <v-switch label="No autoupdate" v-model="local.no_autoupdate" inset color="green" density="compact" hide-details="auto" class="mb-2" />
          <v-text-field label="Extra parameters" v-model="local.extra_parameters" class="mb-2" />
          <v-text-field label="Post parameters" v-model="local.post_parameters" class="mb-2" />
          <v-text-field label="Web UI URL" v-model="local.web_ui_url" class="mb-2" />
          <v-text-field label="Icon URL" v-model="icon" hide-details="auto" />

          <v-divider class="my-2" />
          <EditableList v-model="local.paths" title="Paths" :blank="() => ({ name: '', mode: '', host: '', container: '', description: '' })">
            <template #default="{ row }">
              <v-row>
                <v-col cols="6"><v-text-field label="Name" v-model="row.name" density="compact" /></v-col>
                <v-col cols="6"><v-text-field label="Mode" v-model="row.mode" density="compact" /></v-col>
              </v-row>
              <v-row class="mt-n2">
                <v-col cols="6"><v-text-field label="Host path" v-model="row.host" density="compact" /></v-col>
                <v-col cols="6"><v-text-field label="Container path" v-model="row.container" density="compact" /></v-col>
              </v-row>
              <v-row class="mt-n2">
                <v-col cols="12"><v-text-field label="Description" v-model="row.description" density="compact" hide-details /></v-col>
              </v-row>
            </template>
          </EditableList>

          <v-divider class="my-2" />
          <EditableList v-model="local.ports" title="Ports" :blank="() => ({ name: '', protocol: 'tcp', host: '', container: '', description: '' })">
            <template #default="{ row }">
              <v-row>
                <v-col cols="6"><v-text-field label="Name" v-model="row.name" density="compact" /></v-col>
                <v-col cols="6"><v-text-field label="Protocol" v-model="row.protocol" density="compact" /></v-col>
              </v-row>
              <v-row class="mt-n2">
                <v-col cols="6">
                  <v-text-field
                    label="Host"
                    v-model="row.host"
                    density="compact"
                    hide-details
                    :error="!!row.host && !/^[0-9.-]+$/.test(row.host)"
                  />
                  <div v-if="portConflict(row)" class="text-caption text-warning mt-1">
                    <v-icon size="14" class="mr-1">mdi-alert</v-icon>
                    Already used by "{{ portConflict(row).name || 'another container' }}" ({{ portConflict(row).status }})
                  </div>
                </v-col>
                <v-col cols="6">
                  <v-text-field label="Container" v-model="row.container" density="compact" :error="!!row.container && !/^[0-9.-]+$/.test(row.container)" />
                </v-col>
              </v-row>
              <v-row class="mt-n2">
                <v-col cols="12"><v-text-field label="Description" v-model="row.description" density="compact" hide-details /></v-col>
              </v-row>
            </template>
          </EditableList>

          <v-divider class="my-2" />
          <EditableList v-model="local.devices" title="Devices" :blank="() => ({ name: '', host: '', container: '', description: '' })">
            <template #default="{ row }">
              <v-row>
                <v-col cols="12"><v-text-field label="Name" v-model="row.name" density="compact" /></v-col>
              </v-row>
              <v-row class="mt-n2">
                <v-col cols="6"><v-text-field label="Container" v-model="row.container" density="compact" /></v-col>
                <v-col cols="6"><v-text-field label="Host" v-model="row.host" density="compact" /></v-col>
              </v-row>
              <v-row class="mt-n2">
                <v-col cols="12"><v-text-field label="Description" v-model="row.description" density="compact" hide-details /></v-col>
              </v-row>
            </template>
          </EditableList>

          <v-divider class="my-2" />
          <EditableList v-model="local.variables" title="Variables" :blank="() => ({ name: '', key: '', value: '', mask: false, description: '' })">
            <template #default="{ row }">
              <v-row>
                <v-col cols="6"><v-text-field label="Name" v-model="row.name" density="compact" /></v-col>
                <v-col cols="6"><v-switch label="Masked" v-model="row.mask" inset color="green" density="compact" /></v-col>
              </v-row>
              <v-row class="mt-n2">
                <v-col cols="6"><v-text-field label="Key" v-model="row.key" density="compact" /></v-col>
                <v-col cols="6"><v-text-field label="Value" v-model="row.value" density="compact" :type="row.mask ? 'password' : 'text'" /></v-col>
              </v-row>
              <v-row class="mt-n2">
                <v-col cols="12"><v-text-field label="Description" v-model="row.description" density="compact" hide-details /></v-col>
              </v-row>
            </template>
          </EditableList>

          <v-divider class="my-2" />
          <EditableList v-model="local.labels" title="Labels" :blank="() => ({ name: '', key: '', value: '', mask: false, description: '' })">
            <template #default="{ row }">
              <v-row>
                <v-col cols="6"><v-text-field label="Name" v-model="row.name" density="compact" /></v-col>
                <v-col cols="6"><v-switch label="Masked" v-model="row.mask" inset color="green" density="compact" /></v-col>
              </v-row>
              <v-row class="mt-n2">
                <v-col cols="6"><v-text-field label="Key" v-model="row.key" density="compact" /></v-col>
                <v-col cols="6"><v-text-field label="Value" v-model="row.value" density="compact" :type="row.mask ? 'password' : 'text'" /></v-col>
              </v-row>
              <v-row class="mt-n2">
                <v-col cols="12"><v-text-field label="Description" v-model="row.description" density="compact" hide-details /></v-col>
              </v-row>
            </template>
          </EditableList>
        </template>

        <!-- ===== Compose mode - mirrors dockerCompose.vue's field order.
             Native edits yaml/env in a CodeMirror box before creating the
             stack; a plain monospace textarea gets the same behavior
             (editable, not just a preview) without pulling in CodeMirror
             as a new dependency just for syntax highlighting. ===== -->
        <template v-else>
          <v-text-field v-model="local.name" label="Stack name" class="mb-4" />
          <div class="mb-4">
            <v-label class="text-body-2" style="display: block">Compose yaml</v-label>
            <v-textarea v-model="local.yaml" rows="12" class="font-mono" variant="outlined" hide-details />
          </div>
          <div class="mb-4">
            <v-label class="text-body-2" style="display: block">Environment variables</v-label>
            <v-textarea v-model="local.env" rows="6" class="font-mono" variant="outlined" hide-details />
          </div>
          <v-text-field v-model="icon" label="Icon URL" class="mb-2" />
          <v-text-field v-model="local.template.webui" label="Web UI URL" class="mb-2" />
          <v-switch label="No autoupdate" v-model="local.no_autoupdate" inset color="green" density="compact" hide-details="auto" />
        </template>
      </v-card-text>

      <v-divider />
      <v-card-actions>
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-spacer />
        <v-btn color="primary" :loading="installing" @click="install">Install</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import EditableList from "./EditableList.vue";
import { mosClient } from "../api/mosClient.js";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  result: { type: Object, default: null }
});
const emit = defineEmits(["update:modelValue", "installed"]);

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v)
});

const local = ref(null);
const mode = ref("docker");
const installing = ref(false);
const installError = ref("");
const installedOk = ref(false);
const usedPorts = ref([]);

watch(
  () => props.result,
  (result) => {
    installError.value = "";
    installedOk.value = false;
    if (!result) {
      local.value = null;
      return;
    }
    mode.value = result.mode === "compose" ? "compose" : "docker";
    // Deep-clone so edits don't mutate the raw analysis result.
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
      // Best-effort - same panel data as the native dialog's "Inspect"
      // link, just used here to flag a collision instead of just listing.
      mosClient.getUsedPorts().then((ports) => {
        usedPorts.value = ports;
      });
    } else {
      local.value.template ??= {};
      local.value.env ??= "";
      local.value.no_autoupdate ??= false;
    }
  },
  { immediate: true }
);

function portConflict(row) {
  if (!row.host) return null;
  const proto = (row.protocol || "tcp").toLowerCase();
  return usedPorts.value.find((p) => String(p.port) === String(row.host) && (p.proto || "tcp").toLowerCase() === proto) || null;
}

const displayName = computed(() => (mode.value === "compose" ? local.value?.name : local.value?.name) || "");
const icon = computed({
  get: () => (mode.value === "compose" ? local.value?.template?.icon : local.value?.icon) || "",
  set: (v) => {
    if (mode.value === "compose") local.value.template.icon = v;
    else local.value.icon = v;
  }
});
const category = computed(() => (mode.value === "compose" ? local.value?.template?.category?.[0] : null));
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
    if (mode.value === "docker") {
      await mosClient.createContainer(local.value);
    } else {
      await mosClient.createStack({
        name: local.value.name,
        yaml: local.value.yaml,
        env: local.value.env,
        icon: local.value.template?.icon,
        webui: local.value.template?.webui,
        no_autoupdate: local.value.no_autoupdate
      });
    }
    installedOk.value = true;
    emit("installed", { mode: mode.value });
  } catch (e) {
    // MOS keeps the template on disk for editing/retry on deploy failure
    // (docker.service.js sets templateSaved/templatePath) — surface that.
    installError.value = e.data?.templateSaved
      ? `${e.message} Fix the fields above and try Install again.`
      : e.message;
  } finally {
    installing.value = false;
  }
}
</script>

<style scoped>
.font-mono {
  font-family: ui-monospace, "SF Mono", "Fira Code", monospace;
}
</style>
