<template>
  <v-sheet class="pa-4" color="transparent">
    <v-tabs v-model="tab" class="mb-4">
      <v-tab value="analyze">Analyze</v-tab>
      <v-tab value="settings">Settings</v-tab>
    </v-tabs>
    <v-window v-model="tab">
      <v-window-item value="analyze">
        <AnalyzeForm />
      </v-window-item>
      <v-window-item value="settings">
        <SettingsForm />
      </v-window-item>
    </v-window>
  </v-sheet>
</template>

<script setup>
import { ref } from "vue";
import AnalyzeForm from "./components/AnalyzeForm.vue";
import SettingsForm from "./components/SettingsForm.vue";

const tab = ref("analyze");
</script>
