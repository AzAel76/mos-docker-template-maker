<template>
  <v-card flat>
    <v-card-text>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Paste a GitHub repository URL. Your configured AI provider will look at its README,
        Dockerfile, and any Compose file to build a MOS template, resolve an icon, and let you
        review it before installing.
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

      <v-alert v-if="analyzing" type="info" variant="tonal" density="compact" class="mt-2">
        Analyzing with {{ providerLabel || "your configured provider" }}{{ elapsedLabel }}{{ analyzingHint }}
      </v-alert>

      <div class="mt-2">
        <div class="text-body-2 text-medium-emphasis mb-1">Template scope</div>
        <v-btn-toggle v-model="scope" color="primary" density="comfortable" mandatory variant="outlined" :disabled="analyzing" divided>
          <v-btn value="required">Required only</v-btn>
          <v-btn value="all">All settings</v-btn>
        </v-btn-toggle>
        <div class="text-caption text-medium-emphasis mt-1">
          {{
            scope === "required"
              ? "Only what's needed to run - fewer fields, but you may need to add something back later."
              : "Every setting found in the repo's docs - a longer list you can freely delete from."
          }}
        </div>
      </div>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn v-if="analyzing" variant="text" @click="cancel">Cancel</v-btn>
      <v-btn color="primary" :loading="analyzing" :disabled="!repoUrl" @click="analyze">
        Analyze
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed } from "vue";
import { mosClient } from "../api/mosClient.js";

const emit = defineEmits(["open-result"]);

const repoUrl = ref("");
const scope = ref("required");
const analyzing = ref(false);
const error = ref("");
const elapsedSeconds = ref(0);
const currentProvider = ref("");

const elapsedLabel = computed(() => (elapsedSeconds.value > 0 ? ` (${elapsedSeconds.value}s)` : ""));
const providerLabel = computed(() => {
  switch (currentProvider.value) {
    case "gemini":
      return "Google Gemini";
    case "ollama":
      return "Ollama (local)";
    case "anthropic":
      return "Anthropic (Claude)";
    default:
      return "";
  }
});
const analyzingHint = computed(() =>
  currentProvider.value === "ollama"
    ? " — a local model can take several minutes with no GPU; this keeps waiting until it finishes."
    : " — this is usually quick."
);

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
    // Re-fetched fresh on every run, not cached from mount: the Analyze
    // and Settings tabs share one always-mounted component tree (v-window
    // keeps tab contents alive), so a provider switch made in Settings
    // after this component first loaded wouldn't otherwise be reflected
    // here even though the backend script itself always reads the current
    // settings.json regardless.
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
        elapsedSeconds.value = Math.round((Date.now() - startedAt) / 1000);
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
  // Stop the frontend from watching immediately (AbortError short-
  // circuits analyzeRepo's poll loop on the next check), and separately
  // ask the backend to actually kill the job - the two are independent:
  // stopping without killing would leave it running on the MOS host until
  // it finishes on its own, which defeats the point of a Cancel button
  // for a many-minutes Ollama run someone wants to actually stop.
  controller?.abort();
  if (currentJobId) mosClient.cancelAnalysis(currentJobId);
}
</script>
