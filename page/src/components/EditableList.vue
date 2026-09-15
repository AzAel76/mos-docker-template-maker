<template>
  <div class="mb-4">
    <div class="d-flex align-center mb-1">
      <span class="text-subtitle-2">{{ title }}</span>
      <v-spacer />
      <v-btn size="small" variant="text" prepend-icon="mdi-plus" @click="add">Add</v-btn>
    </div>
    <v-row v-for="(row, i) in modelValue" :key="i" dense align="center">
      <v-col v-for="f in fields" :key="f.key" :cols="f.width ? undefined : true" :style="f.width ? `max-width:${f.width}px` : undefined">
        <v-text-field v-model="row[f.key]" :label="f.label" density="compact" hide-details />
      </v-col>
      <v-col cols="auto">
        <v-btn icon="mdi-delete-outline" size="small" variant="text" @click="remove(i)" />
      </v-col>
    </v-row>
    <div v-if="!modelValue.length" class="text-caption text-medium-emphasis">None</div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Array, required: true },
  title: { type: String, required: true },
  fields: { type: Array, required: true },
  blank: { type: Function, required: true }
});
const emit = defineEmits(["update:modelValue"]);

function add() {
  emit("update:modelValue", [...props.modelValue, props.blank()]);
}
function remove(i) {
  const next = props.modelValue.slice();
  next.splice(i, 1);
  emit("update:modelValue", next);
}
</script>
