<template>
  <v-card flat>
    <v-card-text>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Paste a GitHub repository URL. Claude will look at its README, Dockerfile, and any Compose
        file to build a MOS template, resolve an icon, and let you review it before installing.
      </p>

      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
        {{ error }}
      </v-alert>

      <v-text-field
        v-model="repoUrl"
        label="GitHub repository URL"
        placeholder="https://github.com/owner/repo"
        :disabled="analyzing"
        @keyup.enter="analyze"
      />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn color="primary" :loading="analyzing" :disabled="!repoUrl" @click="analyze">
        Analyze
      </v-btn>
    </v-card-actions>
  </v-card>

  <InstallDialog v-model="dialogOpen" :result="result" @installed="onInstalled" />

  <v-snackbar v-model="showInstalledSnackbar" color="success" timeout="4000">
    Installed — check the Docker overview.
  </v-snackbar>
</template>

<script setup>
import { ref } from "vue";
import InstallDialog from "./InstallDialog.vue";
import { mosClient } from "../api/mosClient.js";

const repoUrl = ref("");
const analyzing = ref(false);
const error = ref("");
const result = ref(null);
const dialogOpen = ref(false);
const showInstalledSnackbar = ref(false);

async function analyze() {
  analyzing.value = true;
  error.value = "";
  try {
    const data = await mosClient.analyzeRepo(repoUrl.value.trim());
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
</script>
