<template>
  <v-card flat>
    <v-card-text>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
        {{ error }}
      </v-alert>
      <v-alert v-if="saved" type="success" variant="tonal" class="mb-4" density="compact">
        Settings saved.
      </v-alert>

      <v-select
        v-model="form.provider"
        :items="providerItems"
        label="Default AI provider"
        hint="Which provider the analyze script actually uses when you click Analyze."
        persistent-hint
        class="mb-4"
      />

      <v-expansion-panels v-model="openPanel" class="mb-4" variant="accordion">
        <v-expansion-panel value="anthropic">
          <v-expansion-panel-title>
            Anthropic (Claude)
            <v-chip v-if="form.provider === 'anthropic'" size="x-small" color="primary" class="ml-2">Default</v-chip>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-alert type="warning" variant="tonal" density="compact" class="mb-3">
              Requires a <strong>paid</strong> API key with billing enabled — there is no free tier for
              API access. In exchange it's the most reliable at following the template schema exactly
              and rarely needs a retry. Cost is usage-based, typically a few cents per repository analyzed.
            </v-alert>
            <div class="text-caption text-medium-emphasis mb-3">
              <strong>Setup:</strong> sign in at console.anthropic.com → add billing/credits → API Keys →
              Create Key → paste it below.
            </div>
            <v-text-field v-model="form.anthropic.api_key" label="Anthropic API key" type="password" class="mb-2" />
            <v-text-field v-model="form.anthropic.model" label="Model" hint="e.g. claude-sonnet-5" persistent-hint />
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel value="gemini">
          <v-expansion-panel-title>
            Google Gemini
            <v-chip v-if="form.provider === 'gemini'" size="x-small" color="primary" class="ml-2">Default</v-chip>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-alert type="info" variant="tonal" density="compact" class="mb-3">
              Google AI Studio issues real API keys with a genuinely free tier — no billing required for
              typical personal use. The tradeoff: free-tier requests are rate-limited (fewer analyses per
              minute/day), and Gemini is somewhat less consistent than Claude at holding together this
              exact JSON schema on the first try.
            </v-alert>
            <div class="text-caption text-medium-emphasis mb-3">
              <strong>Setup:</strong> go to aistudio.google.com → sign in with a Google account → "Get API
              key" → "Create API key" → paste it below.
            </div>
            <v-text-field v-model="form.gemini.api_key" label="Gemini API key" type="password" class="mb-2" />
            <v-text-field v-model="form.gemini.model" label="Model" hint="e.g. gemini-2.5-flash" persistent-hint />
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel value="ollama">
          <v-expansion-panel-title>
            Ollama (local, self-hosted)
            <v-chip v-if="form.provider === 'ollama'" size="x-small" color="primary" class="ml-2">Default</v-chip>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-alert type="info" variant="tonal" density="compact" class="mb-3">
              Completely free and private — no API key, nothing leaves your network. The tradeoff: it's
              noticeably slower than a cloud API (especially without a GPU), and small local models are
              less reliable at producing this whole schema correctly in one shot. A slow model can also
              exceed MOS's 60-second query timeout, in which case the analysis just fails.
            </v-alert>
            <div class="text-caption text-medium-emphasis mb-3">
              <strong>Setup:</strong> install Ollama (ollama.com) on a machine reachable from this MOS
              host → run <code>ollama pull llama3.1</code> (or another model) → make sure its API port
              (default 11434) is reachable from this host → set the host/model below.
            </div>
            <v-text-field v-model="form.ollama.host" label="Ollama host" hint="e.g. http://192.168.1.10:11434" persistent-hint class="mb-2" />
            <v-text-field v-model="form.ollama.model" label="Model" hint="must already be pulled on that host" persistent-hint class="mb-2" />

            <v-alert v-if="ollamaTestResult" :type="ollamaTestResult.type" variant="tonal" density="compact" class="mb-2">
              {{ ollamaTestResult.message }}
            </v-alert>
            <v-btn variant="tonal" size="small" :loading="testingOllama" :disabled="!form.ollama.host" @click="testOllama">
              Test connection
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-text-field
        v-model="form.github_token"
        label="GitHub token (optional)"
        type="password"
        hint="Raises GitHub API rate limits when analyzing repos. Not required for public repos at low volume."
        persistent-hint
      />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn color="primary" :loading="saving" @click="save">Save</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from "vue";
import { mosClient } from "../api/mosClient.js";

const providerItems = [
  { title: "Anthropic (Claude) — paid, most reliable", value: "anthropic" },
  { title: "Google Gemini — free tier available", value: "gemini" },
  { title: "Ollama — free, local, self-hosted", value: "ollama" }
];

const form = reactive({
  provider: "anthropic",
  anthropic: { api_key: "", model: "claude-sonnet-5" },
  gemini: { api_key: "", model: "gemini-2.5-flash" },
  ollama: { host: "http://localhost:11434", model: "llama3.1" },
  github_token: ""
});
const openPanel = ref("anthropic");
const saving = ref(false);
const saved = ref(false);
const error = ref("");
const testingOllama = ref(false);
const ollamaTestResult = ref(null);

watch(
  () => form.provider,
  (p) => {
    openPanel.value = p;
  }
);

watch(
  () => [form.ollama.host, form.ollama.model],
  () => {
    ollamaTestResult.value = null;
  }
);

async function testOllama() {
  testingOllama.value = true;
  ollamaTestResult.value = null;
  try {
    const result = await mosClient.testOllamaConnection(form.ollama.host, form.ollama.model);
    if (result.model_found === false) {
      const available = result.models.length ? result.models.join(", ") : "none";
      ollamaTestResult.value = {
        type: "warning",
        message: `Connected, but "${form.ollama.model}" isn't pulled on that host yet. Available: ${available}.`
      };
    } else {
      ollamaTestResult.value = { type: "success", message: `Connected. ${result.models.length} model(s) available.` };
    }
  } catch (e) {
    ollamaTestResult.value = { type: "error", message: e.message };
  } finally {
    testingOllama.value = false;
  }
}

onMounted(async () => {
  try {
    const settings = await mosClient.getSettings();
    if (settings.provider) form.provider = settings.provider;
    for (const p of ["anthropic", "gemini", "ollama"]) {
      if (settings[p] && typeof settings[p] === "object") Object.assign(form[p], settings[p]);
    }
    if (settings.github_token) form.github_token = settings.github_token;
    openPanel.value = form.provider;
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
