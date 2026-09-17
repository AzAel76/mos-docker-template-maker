<template>
  <v-sheet class="pa-4" color="transparent">
    <v-alert type="warning" variant="tonal" density="compact" icon="mdi-alert-outline" class="mb-4">
      <strong>Use at your own risk.</strong> AI-generated templates can be wrong — a misread
      port, an invented path, a variable that isn't actually optional. Review every field and
      check the project's own documentation before clicking Install.
    </v-alert>
    <v-tabs v-model="tab" class="mb-4">
      <v-tab value="analyze">Analyze</v-tab>
      <v-tab value="history">History</v-tab>
      <v-tab value="settings">Settings</v-tab>
    </v-tabs>
    <v-window v-model="tab">
      <v-window-item value="analyze">
        <AnalyzeForm @open-result="openResult" />
      </v-window-item>
      <v-window-item value="history">
        <HistoryList @open-result="openResult" />
      </v-window-item>
      <v-window-item value="settings">
        <SettingsForm />
      </v-window-item>
    </v-window>
  </v-sheet>

  <!-- Owned here, not by Analyze/History individually, so either tab can
       open the same dialog: History reopens a past result in it too. -->
  <InstallDialog v-model="dialogOpen" :result="dialogResult" @installed="onInstalled" />

  <v-snackbar v-model="showInstalledSnackbar" color="success" timeout="4000">
    Installed — check the Docker overview.
  </v-snackbar>
</template>

<script setup>
import { ref } from "vue";
import AnalyzeForm from "./components/AnalyzeForm.vue";
import HistoryList from "./components/HistoryList.vue";
import SettingsForm from "./components/SettingsForm.vue";
import InstallDialog from "./components/InstallDialog.vue";

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
</script>
