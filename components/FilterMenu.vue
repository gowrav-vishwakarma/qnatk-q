<template>
  <div class="row inline q-col-gutter-x-sm">
    <span
      v-for="component in visibleComponents"
      :key="component.field"
      class="flex bg-grey-3 q-mr-sm"
    >
      <component
        dense
        :is="getComponentByField(component.field)"
        :error="undefined"
        class="flex"
        v-model="localValues[component.field]"
        :map-options="component.bind?.['map-options']"
        :emit-value="component.bind?.['emit-value']"
        :range="
          componentCurrentOperators[component.field] === '$between' &&
          component.type === 'date'
        "
        v-bind="component.props"
      />
      <q-select
        v-if="component.operators && component.operators.length > 1"
        dense
        v-model="componentCurrentOperators[component.field]"
        :options="component.operators.map((op) => ({ label: op, value: op }))"
        class="q-mr-sm"
        emit-value
        @update:model-value="operatorChanged(component.field, $event)"
      />
    </span>
    <q-btn-dropdown
      flat
      split
      label="Filter"
      @click="executeFilter"
      size="sm"
      style="align-self: center"
      color="primary"
    >
      <q-list>
        <q-item
          clickable
          v-for="component in localFilterOptions"
          :key="component.field"
          v-close-popup
          @click="toggleFilterVisibility(component.field)"
        >
          <q-item-section side
            ><q-icon name="check" :color="component.visible ? 'red' : 'grey'"
          /></q-item-section>
          <q-item-section>
            <q-item-label>{{ component.props?.label }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-btn-dropdown>
  </div>
</template>
<script setup lang="ts">
import { computed, PropType, reactive, watch, watchEffect } from 'vue';

const props = defineProps({
  filterOptions: {
    type: Array as PropType<FilterOption[]>,
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

const localFilterOptions: FilterOption[] = reactive<FilterOption[]>([
  ...props.filterOptions.map((opt) => {
    const { component, ...rest } = opt;
    return { ...rest, component: '' };
  }),
]);

const getComponentByField = (field: string) => {
  const filterOption = props.filterOptions.find((opt) => opt.field === field);
  if (!filterOption) throw new Error('Invalid field');
  return filterOption.component;
};

const toggleFilterVisibility = (componentField: string) => {
  const component = localFilterOptions.find(
    (opt) => opt.field === componentField
  );
  if (component) {
    // Toggle the visibility
    component.visible = !component.visible;

    if (component.visible) {
      // If the component is now visible, update or add entries
      componentCurrentOperators[componentField] =
        component.currentOperator || component.operators[0];
      if (!(componentField in localValues)) {
        localValues[componentField] = component.defaultValues || '';
      }
    } else {
      // If the component is now not visible, remove its entries
      if (componentField in componentCurrentOperators) {
        delete componentCurrentOperators[componentField];
      }
      if (componentField in localValues) {
        delete localValues[componentField];
      }
    }
  }
};

const componentCurrentOperators = reactive<Record<string, Operator>>({});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const localValues = reactive<Record<string, any>>({});

const visibleComponents = computed(() => {
  return localFilterOptions.filter((option) => option.visible);
});

watch(
  localFilterOptions,
  (newOptions) => {
    newOptions.forEach((component) => {
      // Update componentCurrentOperators
      if (component.field in componentCurrentOperators) {
        // If it already exists, update it only if the currentOperator has changed
        if (
          component.currentOperator &&
          componentCurrentOperators[component.field] !==
            component.currentOperator
        ) {
          componentCurrentOperators[component.field] =
            component.currentOperator;
        }
      } else {
        // If it does not exist, add it
        componentCurrentOperators[component.field] =
          component.currentOperator || component.operators[0];
      }

      // Update localValues
      if (!(component.field in localValues)) {
        localValues[component.field] = component.defaultValues || '';
      }
    });
  },
  { deep: true }
);

const operatorChanged = (field: string, operator: Operator) => {
  componentCurrentOperators[field] = operator;
  if (operator === '$between') {
    localValues[field] = { from: localValues[field], to: localValues[field] };
  }
};

// Storing the initial state of fetchOptions
const initialFetchOptions = JSON.parse(JSON.stringify(props.fetchOptions));
const originalFilterOptions = JSON.parse(JSON.stringify(localFilterOptions));

// Helper function to build condition based on operator
const buildCondition = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conditionTemplate: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  operator: Operator
) => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const replaceCondition = (condition: any, operator: Operator, value: any) => {
  if (Array.isArray(condition)) {
    condition.forEach((subCondition) =>
      replaceCondition(subCondition, operator, value)
    );
  } else if (typeof condition === 'object' && condition !== null) {
    for (const key in condition) {
      if (condition[key]['$$op$$']) {
        condition[key] = { [operator]: value };
      } else {
        replaceCondition(condition[key], operator, value);
      }
    }
  }
};

const handleIncludes = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mergeInInclude: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newIncludeObject: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fieldValue: any,
  currentOperator: Operator
) => {
  if (!mergeInInclude.include) mergeInInclude.include = [];

  let existingInclude = mergeInInclude.include.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (include: any) => include.as === newIncludeObject.as
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
  console.log('executeFilter');
  let updatedFetchOptions = JSON.parse(JSON.stringify(initialFetchOptions));
  const filterOptions = JSON.parse(JSON.stringify(originalFilterOptions));

  filterOptions
    .filter((opt: FilterOption) => !opt.visible)
    .forEach((filterOption: FilterOption) => {
      let fieldValue = localValues[filterOption.field];
      const currentOperator = componentCurrentOperators[filterOption.field];

      if (
        typeof fieldValue === 'object' &&
        fieldValue !== null &&
        fieldValue.value !== undefined
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

      if (
        fieldValue !== undefined &&
        fieldValue !== null &&
        fieldValue !== ''
      ) {
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
