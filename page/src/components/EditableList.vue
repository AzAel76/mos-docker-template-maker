<template>
  <v-row>
    <v-col cols="12" class="d-flex align-center justify-space-between">
      <span class="text-subtitle-1 font-weight-medium">{{ title }}</span>
      <v-btn variant="text" size="small" class="ma-1 pa-0" style="min-width: 0; color: green" @click="add" :title="`Add ${title}`">
        <v-icon size="18" class="mr-1">mdi-plus</v-icon>
        Add
      </v-btn>
    </v-col>
  </v-row>
  <div v-for="(row, i) in modelValue" :key="i">
    <v-divider v-if="i > 0" class="my-2" />
    <v-row>
      <v-col cols="1" class="d-flex flex-column justify-center align-center">
        <div class="d-flex flex-column align-center">
          <v-btn
            icon
            size="x-small"
            color="green"
            class="pa-0"
            style="width: 24px; height: 24px; min-width: 24px; margin-bottom: 6px"
            @click="insertAfter(i)"
            :title="`Add ${title}`"
          >
            <v-icon size="18">mdi-plus</v-icon>
          </v-btn>
          <v-btn icon size="x-small" color="error" class="pa-0" style="width: 24px; height: 24px; min-width: 24px" @click="remove(i)" title="Remove">
            <v-icon size="18">mdi-delete</v-icon>
          </v-btn>
        </div>
      </v-col>
      <v-col cols="11">
        <slot :row="row" :index="i" />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Array, required: true },
  title: { type: String, required: true },
  blank: { type: Function, required: true }
});
const emit = defineEmits(["update:modelValue"]);

function add() {
  emit("update:modelValue", [...props.modelValue, props.blank()]);
}
function insertAfter(i) {
  const next = props.modelValue.slice();
  next.splice(i + 1, 0, props.blank());
  emit("update:modelValue", next);
}
function remove(i) {
  const next = props.modelValue.slice();
  next.splice(i, 1);
  emit("update:modelValue", next);
}
</script>
