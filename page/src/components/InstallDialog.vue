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

        <v-textarea v-model="description" label="Description" rows="2" auto-grow class="mb-2" />

        <!-- ===== Docker (single container) mode ===== -->
        <template v-if="mode === 'docker'">
          <v-row dense>
            <v-col cols="12" sm="6"><v-text-field v-model="local.name" label="Name" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="local.repo" label="Image / repository" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="local.network" label="Network" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="local.web_ui_url" label="Web UI URL" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="icon" label="Icon URL" /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="local.extra_parameters" label="Extra parameters" /></v-col>
          </v-row>

          <EditableList
            v-model="local.ports"
            title="Ports"
            :fields="[
              { key: 'name', label: 'Name' },
              { key: 'protocol', label: 'Protocol', width: 90 },
              { key: 'host', label: 'Host', width: 90 },
              { key: 'container', label: 'Container', width: 100 }
            ]"
            :blank="() => ({ name: '', protocol: 'tcp', host: '', container: '', description: '' })"
          />
          <EditableList
            v-model="local.paths"
            title="Paths"
            :fields="[
              { key: 'name', label: 'Name' },
              { key: 'host', label: 'Host path' },
              { key: 'container', label: 'Container path' },
              { key: 'mode', label: 'Mode', width: 80 }
            ]"
            :blank="() => ({ name: '', host: '', container: '', mode: '', description: '' })"
          />
          <EditableList
            v-model="local.variables"
            title="Variables"
            :fields="[
              { key: 'key', label: 'Key' },
              { key: 'value', label: 'Value' }
            ]"
            :blank="() => ({ name: '', key: '', value: '', mask: false, description: '' })"
          />
          <EditableList
            v-model="local.devices"
            title="Devices"
            :fields="[
              { key: 'host', label: 'Host device' },
              { key: 'container', label: 'Container device' }
            ]"
            :blank="() => ({ name: '', host: '', container: '', description: '' })"
          />
        </template>

        <!-- ===== Compose mode ===== -->
        <template v-else>
          <v-text-field v-model="local.name" label="Stack name" class="mb-2" />
          <v-text-field v-model="local.template.webui" label="Web UI URL" class="mb-2" />
          <v-textarea v-model="local.env" label="Environment (.env)" rows="4" class="mb-2" />
          <v-textarea v-model="local.yaml" label="compose.yaml" rows="12" class="font-mono" readonly />
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
    } else {
      local.value.template ??= {};
      local.value.env ??= "";
    }
  },
  { immediate: true }
);

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
        webui: local.value.template?.webui
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
