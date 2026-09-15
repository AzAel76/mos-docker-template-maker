<template>
  <v-card flat>
    <v-card-text>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
        {{ error }}
      </v-alert>
      <v-alert v-if="saved" type="success" variant="tonal" class="mb-4" density="compact">
        Settings saved.
      </v-alert>

      <v-text-field
        v-model="form.api_key"
        label="Anthropic API key"
        type="password"
        hint="Used server-side by the analyze script. Stored in the plugin's settings.json on this MOS host."
        persistent-hint
        class="mb-4"
      />
      <v-text-field
        v-model="form.model"
        label="Claude model"
        hint="e.g. claude-sonnet-5"
        persistent-hint
        class="mb-4"
      />
      <v-text-field
        v-model="form.github_token"
        label="GitHub token (optional)"
        type="password"
        hint="Raises GitHub API rate limits when analyzing repos. Not required for public repos at low volume."
        persistent-hint
        class="mb-4"
      />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn color="primary" :loading="saving" @click="save">Save</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { mosClient } from "../api/mosClient.js";

const form = reactive({ api_key: "", model: "claude-sonnet-5", github_token: "" });
const saving = ref(false);
const saved = ref(false);
const error = ref("");

onMounted(async () => {
  try {
    const settings = await mosClient.getSettings();
    Object.assign(form, settings);
  } catch (e) {
    // Settings not created yet on first run — defaults above are fine.
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
</script>
