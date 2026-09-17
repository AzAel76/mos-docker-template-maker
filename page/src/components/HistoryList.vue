<template>
  <v-card flat>
    <v-card-text>
      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
        {{ error }}
      </v-alert>

      <div v-if="loading" class="d-flex justify-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else-if="!entries.length" class="text-body-2 text-medium-emphasis text-center py-8">
        No repositories analyzed yet.
      </div>

      <v-list v-else lines="two" class="bg-transparent">
        <v-list-item v-for="(entry, i) in entries" :key="i" class="px-0">
          <template #prepend>
            <v-icon :icon="entry.mode === 'compose' ? 'mdi-layers-outline' : 'mdi-package-variant'" class="mr-3" />
          </template>

          <v-list-item-title>{{ entry.repo }}</v-list-item-title>
          <v-list-item-subtitle>
            <v-chip size="x-small" variant="tonal" class="mr-1">{{ entry.mode === "compose" ? "Compose" : "Docker" }}</v-chip>
            <v-chip size="x-small" variant="tonal" class="mr-1">{{ entry.scope === "all" ? "All settings" : "Required only" }}</v-chip>
            <v-chip v-if="entry.provider" size="x-small" variant="tonal" class="mr-1">{{ providerModelLabel(entry) }}</v-chip>
            <span class="text-caption">{{ formatDate(entry.analyzed_at) }}</span>
          </v-list-item-subtitle>

          <template #append>
            <v-btn
              v-if="entry.result"
              icon="mdi-eye-outline"
              size="small"
              variant="text"
              title="View result"
              aria-label="View this analysis result"
              @click="$emit('open-result', entry.result)"
            />
            <v-btn
              icon="mdi-open-in-new"
              size="small"
              variant="text"
              :href="entry.url"
              target="_blank"
              rel="noopener noreferrer"
              title="Open repository"
              aria-label="Open repository in a new tab"
            />
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
    <v-card-actions v-if="entries.length">
      <v-spacer />
      <v-btn variant="text" color="error" :loading="clearing" @click="clear">Clear history</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { mosClient } from "../api/mosClient.js";

defineEmits(["open-result"]);

const entries = ref([]);
const loading = ref(true);
const clearing = ref(false);
const error = ref("");

const PROVIDER_NAMES = { anthropic: "Anthropic", gemini: "Gemini", ollama: "Ollama", openai: "OpenAI" };

function providerModelLabel(entry) {
  const name = PROVIDER_NAMES[entry.provider] || entry.provider;
  return entry.model ? `${name} · ${entry.model}` : name;
}

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

onMounted(load);
</script>
