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
import { useAutocomplete } from '../composibles/use-autocomplete';
import { autoCompletePropTypes, ModelOptions } from '../QnatkListDTO';
import  { AxiosInstance } from 'axios';

const props = defineProps({
  ...autoCompletePropTypes,
  api: {
    type: Function,
    required: true,
  }
});

const defaultGetModelOptionsFn = (val: string): ModelOptions => {
  const modelOptions: ModelOptions = {
    attributes: props.attributes || [
      props.valueFieldName,
      props.labelFieldName,
    ],
    include:
      typeof props.include === 'function'
        ? props.include(val)
        : props.include || [],
    limit: props.limit || 10,
  };
  // if (props.where === undefined) {
  //   modelOptions.where = { [props.labelFieldName]: { $like: `%${val}%` } };
  // } else
  if (props.where !== false && typeof props.where === 'function') {
    modelOptions.where = props.where(val);
  }

  console.log('modelOptions', modelOptions, 'props', props);
  return modelOptions;
};

const defaultGetFetchInitialValueOptionsFn = (id: string): ModelOptions => {
  const modelOptions: ModelOptions = {
    attributes: props.attributes || [
      props.valueFieldName,
      props.labelFieldName,
    ],
    include:
      typeof props.include === 'function'
        ? props.include(id)
        : props.include || [],
  };

  if (props.whereOnInitialFetch !== false) {
    modelOptions.where = props.whereOnInitialFetch
      ? props.whereOnInitialFetch(id)
      : { [props.valueFieldName]: { $eq: id } };
  }

  return modelOptions;
};
const emits = defineEmits(['update:modelValue']);
if (!props.baseModel) throw new Error('baseModel is required');

// Set up autocomplete using props
const { suggestions, isLoading, filterFn, selected, fetchInitialValue } =
  useAutocomplete(
    props.api(),
    props.baseModel,
    props.getModelOptionsFn || defaultGetModelOptionsFn,
    props.getFetchInitialValueOptionsFn || defaultGetFetchInitialValueOptionsFn,
    props.valueFieldName,
    props.labelFieldName
  );

// Function to emit the selected value
const updateSelected = (newValue: { label: string; value: number } | null) => {
  selected.value = newValue;
  emits('update:modelValue', newValue);
};

// Initial fetch and watch for external changes
watch(
  () => props.modelValue,
  async (newVal) => {
    console.log('newVal', newVal);
    if (typeof newVal === 'number' && newVal !== selected.value?.value) {
      await fetchInitialValue(newVal);
    }
  },
  { immediate: true } // Run immediately on component mount
);
</script>
