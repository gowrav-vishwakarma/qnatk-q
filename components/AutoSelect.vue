<template>
  <q-select
    :model-value="selected"
    :options="suggestions"
    :loading="isLoading"
    :error="error"
    :error-message="errorMessage"
    use-input
    clearable
    @filter="filterFn"
    @update:model-value="updateSelected"
    :label="label"
    v-bind="$attrs"
  >
    <!-- Providing slots from the parent component -->
    <template
      v-for="(slotName, index) in Object.keys($slots)"
      :key="index"
      #[slotName]="slotProps"
    >
      <slot :name="slotName" v-bind="slotProps"></slot>
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import { useAutocomplete } from 'components/qnatk/composibles/use-autocomplete';
import {
  autoCompletePropTypes,
  ModelOptions,
} from 'components/qnatk/QnatkListDTO';

const props = defineProps({
  ...autoCompletePropTypes,
});

// Define default functions
const defaultGetModelOptionsFn = (val: string): ModelOptions => ({
  attributes: props.attributes || [props.valueFieldName, props.labelFieldName],
  include: props.include || [],
  where: props.where
    ? props.where(val)
    : { [props.labelFieldName]: { $like: `%${val}%` } },
  limit: props.limit || 10,
});

const defaultGetFetchInitialValueOptionsFn = (id: string): ModelOptions => ({
  attributes: props.attributes || [props.valueFieldName, props.labelFieldName],
  include: props.include || [],
  where: props.whereOnInitialFetch
    ? props.whereOnInitialFetch(id)
    : { [props.valueFieldName]: { $eq: id } },
});

const emits = defineEmits(['update:modelValue']);

// Set up autocomplete using props
const { suggestions, isLoading, filterFn, selected, fetchInitialValue } =
  useAutocomplete(
    props.baseModel,
    props.getModelOptionsFn || defaultGetModelOptionsFn,
    props.getFetchInitialValueOptionsFn || defaultGetFetchInitialValueOptionsFn,
    props.valueFieldName,
    props.labelFieldName
  );

// Function to emit the selected value
const updateSelected = (newValue: { label: string; value: number } | null) => {
  selected.value = newValue;
  emits('update:modelValue', newValue?.value);
};

// Initial fetch and watch for external changes
watch(
  () => props.modelValue,
  async (newVal) => {
    if (typeof newVal === 'number' && newVal !== selected.value?.value) {
      await fetchInitialValue(newVal);
    }
  },
  { immediate: true } // Run immediately on component mount
);
</script>
