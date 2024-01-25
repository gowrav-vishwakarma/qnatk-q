<template>
  <div class="row">
    <span v-for="component in visibleComponents" :key="component.name">
      <q-select
        v-if="component.operators"
        dense
        v-model="componentCurrentOperators[component.field]"
        :options="component.operators.map((op) => ({ label: op, value: op }))"
        class="q-mr-sm"
        emit-value
        @update:model-value="operatorChanged(component.field, $event)"
      />
      <component
        dense
        :is="component.component"
        v-bind="component.props"
        class="flex"
        v-model="localValues[component.field]"
        :map-options="component.bind?.['map-options']"
        :emit-value="component.bind?.['emit-value']"
        :range="
          componentCurrentOperators[component.field] === '$between' &&
          component.type === 'date'
        "
      />
    </span>
    <q-btn label="Filter" @click="executeFilter" />
  </div>
</template>
<script setup lang="ts">
import { computed, reactive } from 'vue';

const props = defineProps({
  filterOptions: {
    type: Array,
    required: true,
  },

  fetchOptions: {
    type: Object,
    required: true,
  },

  fetchDataFunction: {
    type: Function,
    required: true,
  },
});

const emits = defineEmits([
  'update:fetchOptions',
  'update:filterOptions',
  'update:fetchDataFunction',
]);

const visibleComponents = computed(() => {
  return props.filterOptions.filter((option) => option.visible);
});

const componentCurrentOperators = reactive({});
const localValues = reactive({});

visibleComponents.value.forEach((component) => {
  // Initialize operators and values for each component
  componentCurrentOperators[component.field] =
    component.currentOperator || component.operators[0];

  localValues[component.field] = component.defaultValues || '';
});

const operatorChanged = (field, operator) => {
  componentCurrentOperators[field] = operator;
  if (operator === '$between') {
    localValues[field] = { from: localValues[field], to: localValues[field] };
  }
};

// Storing the initial state of fetchOptions
const initialFetchOptions = JSON.parse(JSON.stringify(props.fetchOptions));

// Helper function to build condition based on operator
const buildCondition = (conditionTemplate, value, operator) => {
  let condition = JSON.parse(JSON.stringify(conditionTemplate));

  switch (operator) {
    case '$contains':
      replaceCondition(condition, '$like', `%${value}%`);
      break;
    case '$startsWith':
      replaceCondition(condition, '$like', `${value}%`);
      break;
    case '$endsWith':
      replaceCondition(condition, '$like', `%${value}`);
      break;
    case '$between':
      replaceCondition(condition, '$between', value); // Assuming value is an array for between
      break;
    default:
      replaceCondition(condition, operator, value);
      break;
  }

  return condition;
};

const replaceCondition = (condition, operator, value) => {
  for (const key in condition) {
    if (condition[key]['$$op$$']) {
      condition[key] = { [operator]: value };
    }
  }
};

const handleIncludes = (
  mergeInInclude,
  newIncludeObject,
  fieldValue,
  currentOperator
) => {
  if (!mergeInInclude.include) mergeInInclude.include = [];

  let existingInclude = mergeInInclude.include.find(
    (include) => include.as === newIncludeObject.as
  );

  if (!existingInclude) {
    newIncludeObject.where = buildCondition(
      newIncludeObject.where,
      fieldValue,
      currentOperator
    );
    mergeInInclude.include.push(newIncludeObject);
  } else {
    if (newIncludeObject.where && !existingInclude.where)
      existingInclude.where = {};
    existingInclude.where = {
      ...existingInclude.where,
      ...buildCondition(newIncludeObject.where, fieldValue, currentOperator),
    };
  }

  // if (newIncludeObject.include) {
  //   handleIncludes(
  //     newIncludeObject,
  //     newIncludeObject.include,
  //     fieldValue,
  //     currentOperator
  //   );
  // }
};

// Main function to execute filter
const executeFilter = () => {
  let updatedFetchOptions = JSON.parse(JSON.stringify(initialFetchOptions));

  props.filterOptions.forEach((filterOption) => {
    let fieldValue = localValues[filterOption.field];
    const currentOperator = componentCurrentOperators[filterOption.field];

    if (
      typeof fieldValue === 'object' &&
      fieldValue !== null &&
      fieldValue.value
    ) {
      fieldValue = fieldValue.value;
    }

    if (
      typeof fieldValue === 'object' &&
      fieldValue !== null &&
      fieldValue.from
    ) {
      fieldValue = [fieldValue.from, fieldValue.to];
    }

    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
      if (filterOption.where) {
        filterOption.where = buildCondition(
          filterOption.where,
          fieldValue,
          currentOperator
        );
        if (!updatedFetchOptions.where) updatedFetchOptions.where = {};
        updatedFetchOptions.where = {
          ...updatedFetchOptions.where,
          ...filterOption.where,
        };
      }

      if (filterOption.include) {
        handleIncludes(
          updatedFetchOptions,
          filterOption.include,
          fieldValue,
          currentOperator
        );
      }
    }
  });

  emits('update:fetchOptions', updatedFetchOptions);
  props.fetchDataFunction();
  return updatedFetchOptions;
};
</script>

<style scoped></style>
