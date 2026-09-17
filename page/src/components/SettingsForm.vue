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
              Create Key → paste it below and test it → pick a model from what the key can access.
            </div>
            <v-text-field v-model="form.anthropic.api_key" label="Anthropic API key" type="password" class="mb-2" />

            <v-btn variant="tonal" size="small" class="mb-2" :loading="anthropicTesting" :disabled="!form.anthropic.api_key" @click="testAnthropic">
              Test connection
            </v-btn>
            <v-alert v-if="anthropicTestResult" :type="anthropicTestResult.type" variant="tonal" density="compact" class="mb-3">
              {{ anthropicTestResult.message }}
            </v-alert>

            <v-combobox
              v-model="form.anthropic.model"
              :items="anthropicModels"
              label="Model"
              :hint="anthropicModels.length ? 'Available to this key - pick one, or type a different name.' : 'Test the connection to list what this key can access, or type a name directly.'"
              persistent-hint
            />
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
              key" → "Create API key" → paste it below and test it → pick a model from what's available.
            </div>
            <v-text-field v-model="form.gemini.api_key" label="Gemini API key" type="password" class="mb-2" />

            <v-btn variant="tonal" size="small" class="mb-2" :loading="geminiTesting" :disabled="!form.gemini.api_key" @click="testGemini">
              Test connection
            </v-btn>
            <v-alert v-if="geminiTestResult" :type="geminiTestResult.type" variant="tonal" density="compact" class="mb-3">
              {{ geminiTestResult.message }}
            </v-alert>

            <v-combobox
              v-model="form.gemini.model"
              :items="geminiModels"
              label="Model"
              :hint="geminiModels.length ? 'Available to this key - pick one, or type a different name.' : 'Test the connection to list what this key can access, or type a name directly.'"
              persistent-hint
            />
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
              noticeably slower than a cloud API (especially without a GPU) — analysis runs as a
              background job and keeps waiting rather than timing out, but that can still mean many
              minutes on modest hardware. Small local models are also less reliable at producing this
              whole schema correctly in one shot; models tuned for structured/code output (e.g.
              Qwen2.5-Coder) tend to do noticeably better here than general-purpose ones of similar size
              (e.g. Llama 3.1).
            </v-alert>
            <div class="text-caption text-medium-emphasis mb-3">
              <strong>Setup:</strong> install Ollama (ollama.com) on a machine reachable from this MOS
              host → run <code>ollama pull qwen2.5-coder:7b</code> (or another model) → make sure its API
              port (default 11434) is reachable from this host → enter the host below and test it → pick
              the model from what's actually pulled there.
            </div>
            <v-text-field v-model="form.ollama.host" label="Ollama host" hint="e.g. http://192.168.1.10:11434" persistent-hint class="mb-2" />

            <v-btn variant="tonal" size="small" class="mb-2" :loading="ollamaTesting" :disabled="!form.ollama.host" @click="testOllama">
              Test connection
            </v-btn>
            <v-alert v-if="ollamaTestResult" :type="ollamaTestResult.type" variant="tonal" density="compact" class="mb-3">
              {{ ollamaTestResult.message }}
            </v-alert>

            <v-combobox
              v-model="form.ollama.model"
              :items="ollamaModels"
              label="Model"
              :hint="ollamaModels.length ? 'Pulled on that host - pick one, or type a different name.' : 'Test the connection to list what\'s pulled there, or type a name directly.'"
              persistent-hint
            />
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
  ollama: { host: "http://localhost:11434", model: "qwen2.5-coder:7b" },
  github_token: ""
});
const openPanel = ref("anthropic");
const saving = ref(false);
const saved = ref(false);
const error = ref("");

const ollamaTesting = ref(false);
const ollamaTestResult = ref(null);
const ollamaModels = ref([]);

const anthropicTesting = ref(false);
const anthropicTestResult = ref(null);
const anthropicModels = ref([]);

const geminiTesting = ref(false);
const geminiTestResult = ref(null);
const geminiModels = ref([]);

watch(
  () => form.provider,
  (p) => {
    openPanel.value = p;
  }
);

// A stale model list from a previous host/key would let you "pick" a
// model that was never actually pulled/available on the one you're now
// pointed at - clear it whenever the connection details change underneath
// the list, same reasoning for all three providers.
watch(() => form.ollama.host, () => { ollamaModels.value = []; ollamaTestResult.value = null; });
watch(() => form.ollama.model, () => { ollamaTestResult.value = null; });
watch(() => form.anthropic.api_key, () => { anthropicModels.value = []; anthropicTestResult.value = null; });
watch(() => form.anthropic.model, () => { anthropicTestResult.value = null; });
watch(() => form.gemini.api_key, () => { geminiModels.value = []; geminiTestResult.value = null; });
watch(() => form.gemini.model, () => { geminiTestResult.value = null; });

// Trim before testing, not just before saving - otherwise a stray
// leading/trailing space (easy via copy-paste) makes an exact-match check
// silently fail even when the model/key is genuinely right. v-combobox
// can also leave the model as null (cleared/no selection), unlike a plain
// text field, hence the `|| ""` guards throughout.
async function runTest({ testingRef, resultRef, modelsRef, testFn, connectValue, modelValue, notFoundNoun }) {
  testingRef.value = true;
  resultRef.value = null;
  try {
    const result = await testFn(connectValue, modelValue);
    modelsRef.value = result.models;
    if (result.model_found === false) {
      resultRef.value = { type: "warning", message: `Connected, but "${modelValue}" isn't ${notFoundNoun}. Pick one below.` };
    } else {
      resultRef.value = { type: "success", message: `Connected. ${result.models.length} model(s) available - pick one below.` };
    }
  } catch (e) {
    resultRef.value = { type: "error", message: e.message };
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
    // Trim every text field before persisting - the same stray-whitespace
    // problem that broke the Ollama model match (see testOllama) applies
    // just as easily to a pasted API key or host.
    const payload = {
      provider: form.provider,
      anthropic: { api_key: form.anthropic.api_key.trim(), model: (form.anthropic.model || "").trim() },
      gemini: { api_key: form.gemini.api_key.trim(), model: (form.gemini.model || "").trim() },
      ollama: { host: form.ollama.host.trim(), model: (form.ollama.model || "").trim() },
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
</script>
