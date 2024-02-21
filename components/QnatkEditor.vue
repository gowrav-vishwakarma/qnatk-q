<template>
  <q-field
    :label="label"
    :error="error"
    :error-message="errorMessage"
    stack-label
    :dense="dense"
    :rules="computedRules"
    v-model="editorContent"
  >
    <template #control>
      <q-editor
        v-model="editorContent"
        min-height="5rem"
        class="full-width"
        :class="{ 'is-error': error }"
      />
    </template>
  </q-field>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  modelValue: String,
  label: String,
  error: Boolean,
  errorMessage: String,
  rules: Array,
  dense: Boolean,
});

const emit = defineEmits(['update:modelValue']);

const editorContent = ref(props.modelValue);

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== editorContent.value) {
      editorContent.value = newVal;
    }
  },
  { immediate: true }
);

watch(editorContent, (newVal) => {
  emit('update:modelValue', newVal);
});

const isEditorEmpty = (content) => {
  // This function checks if the content is empty or if it only contains empty HTML tags
  return (
    !content || content.trim() === '<p><br></p>' || content.trim() === '<br>'
  );
};

const computedRules = computed(() => {
  const baseRules = [(val) => !isEditorEmpty(val) || 'Field is required'];
  return props.rules ? baseRules.concat(props.rules) : baseRules;
});
</script>

<style scoped>
.q-editor.is-error {
  border: 1px solid var(--q-color-negative);
}
</style>
