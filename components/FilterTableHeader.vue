<template>
  <q-tr>
    <q-th v-for="col in props.cols" :key="col.name">
      <div class="row items-center no-wrap">
        <div class="col">{{ col.label }}</div>
        <q-btn
          v-if="isFilterable(col.name)"
          flat
          dense
          round
          :icon="getFilterIcon(col.name)"
          :color="isFilterActive(col.name) ? 'primary' : 'grey'"
          size="sm"
          @click="openFilterMenu(col.name)"
        >
          <q-menu anchor="bottom right" self="top right">
            <q-list style="min-width: 200px">
              <q-item>
                <q-item-section>
                  <q-select
                    v-model="filters[col.name].operator"
                    :options="getOperatorOptions(col.name)"
                    label="Operator"
                    dense
                    options-dense
                    emit-value
                    map-options
                    @update:model-value="operatorChanged(col.name, $event)"
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <component
                    :is="getFilterComponent(col.name)"
                    v-model="filters[col.name].value"
                    v-bind="getFilterProps(col.name)"
                    dense
                  />
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-btn
                    label="Apply"
                    color="primary"
                    dense
                    @click="applyFilter(col.name)"
                  />
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    label="Clear"
                    color="grey"
                    dense
                    flat
                    @click="clearFilter(col.name)"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </q-th>
  </q-tr>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, watch, onMounted, computed } from 'vue';
import { QTableColumn, date } from 'quasar';
import { FilterOption } from 'components/qnatk/QNATKFilterOptions';
import { cloneDeep } from 'lodash';

const props = defineProps<{
  cols: QTableColumn[];
  filterOptions: FilterOption[];
  fetchOptions: any;
  fetchDataFunction: () => void;
}>();

const emit = defineEmits(['update:filterOptions', 'update:fetchOptions']);

const filters = ref<
  Record<string, { operator: string; value: any; active: boolean }>
>({});
const initialFetchOptions = ref<any>(null);

onMounted(() => {
  initialFetchOptions.value = cloneDeep(props.fetchOptions);
  initializeFilters();
});

const initializeFilters = () => {
  props.filterOptions.forEach((option) => {
    const operator = option.currentOperator || option.operators[0];
    let value = option.defaultValues;
    if (option.type === 'date') {
      value = operator === '$between' ? { from: '', to: '' } : '';
    }
    filters.value[option.field] = { operator, value, active: false };
  });
};

const isFilterable = (colName: string) => {
  return props.filterOptions.some((option) => option.field === colName);
};

const getFilterOption = (colName: string) => {
  return props.filterOptions.find((option) => option.field === colName);
};

const getOperatorOptions = (colName: string) => {
  const option = getFilterOption(colName);
  return option?.operators.map((op) => ({ label: op, value: op })) || [];
};

const getFilterComponent = (colName: string) => {
  const option = getFilterOption(colName);
  return option?.component || 'q-input';
};

const getFilterProps = (colName: string) => {
  const option = getFilterOption(colName);
  const baseProps = option?.props || {};

  if (option?.type === 'date') {
    return {
      ...baseProps,
      placeholder: isDateRangeFilter(colName)
        ? 'YYYY-MM-DD - YYYY-MM-DD'
        : 'YYYY-MM-DD',
      range: isDateRangeFilter(colName),
    };
  }

  return baseProps;
};

const isDateFilter = (colName: string) => {
  const option = getFilterOption(colName);
  return option?.type === 'date';
};

const isDateRangeFilter = (colName: string) => {
  return (
    isDateFilter(colName) && filters.value[colName]?.operator === '$between'
  );
};

const openFilterMenu = (colName: string) => {
  if (!filters.value[colName]) {
    const option = getFilterOption(colName);
    const operator = option?.currentOperator || option?.operators[0] || '$eq';
    const value =
      option?.type === 'date' && operator === '$between'
        ? { from: '', to: '' }
        : '';
    filters.value[colName] = { operator, value, active: false };
  }
};

const operatorChanged = (field: string, operator: string) => {
  filters.value[field].operator = operator;
  if (isDateFilter(field)) {
    filters.value[field].value =
      operator === '$between' ? { from: '', to: '' } : '';
  }
};

const applyFilter = (colName: string) => {
  const option = getFilterOption(colName);
  if (option) {
    const filter = filters.value[colName];
    filter.active = true;

    const updatedOption = {
      ...option,
      currentOperator: filter.operator,
      defaultValues: filter.value,
    };
    emit(
      'update:filterOptions',
      props.filterOptions.map((opt) =>
        opt.field === colName ? updatedOption : opt
      )
    );

    applyAllFilters();
  }
};

const applyAllFilters = () => {
  let updatedFetchOptions = cloneDeep(initialFetchOptions.value);

  if (!updatedFetchOptions.where) {
    updatedFetchOptions.where = {};
  }

  Object.entries(filters.value).forEach(([colName, filter]) => {
    if (filter.active) {
      const option = getFilterOption(colName);
      if (option?.where) {
        const condition = buildCondition(
          option.where,
          filter.value,
          filter.operator,
          option.type
        );

        // Merge the new condition into the root where clause
        Object.assign(updatedFetchOptions.where, condition);
      }

      if (option?.include) {
        handleIncludes(
          updatedFetchOptions,
          option.include,
          filter.value,
          filter.operator,
          option.type
        );
      }
    }
  });

  // Remove any empty conditions
  Object.keys(updatedFetchOptions.where).forEach((key) => {
    if (Object.keys(updatedFetchOptions.where[key]).length === 0) {
      delete updatedFetchOptions.where[key];
    }
  });

  // If where clause is empty after filtering, remove it
  if (Object.keys(updatedFetchOptions.where).length === 0) {
    delete updatedFetchOptions.where;
  }

  emit('update:fetchOptions', updatedFetchOptions);
  props.fetchDataFunction();
};

const clearFilter = (colName: string) => {
  const option = getFilterOption(colName);
  if (option) {
    const operator = option.operators[0];
    const value =
      option.type === 'date' && operator === '$between'
        ? { from: '', to: '' }
        : '';
    filters.value[colName] = { operator, value, active: false };

    const updatedFilterOptions = props.filterOptions.map((opt) =>
      opt.field === colName
        ? { ...opt, currentOperator: operator, defaultValues: undefined }
        : opt
    );
    emit('update:filterOptions', updatedFilterOptions);

    applyAllFilters();
  }
};

const isFilterActive = (colName: string) => {
  const filter = filters.value[colName];
  if (!filter) return false;

  if (filter.operator === '$between' && typeof filter.value === 'object') {
    return filter.active && (filter.value.from || filter.value.to);
  }

  return (
    filter.active &&
    filter.value !== '' &&
    filter.value !== undefined &&
    filter.value !== null
  );
};

const getFilterIcon = (colName: string) => {
  return isFilterActive(colName) ? 'filter_list' : 'filter_list_off';
};

const buildCondition = (
  conditionTemplate: any,
  value: any,
  operator: string,
  type: string
) => {
  let condition = cloneDeep(conditionTemplate);

  const processedValue =
    type === 'date' ? formatDateValue(value, operator) : value;

  const applyOperator = (cond: any) => {
    Object.keys(cond).forEach((key) => {
      if (cond[key] && cond[key]['$$op$$']) {
        switch (operator) {
          case '$contains':
            cond[key] = `%${processedValue}%`;
            break;
          case '$startsWith':
            cond[key] = `${processedValue}%`;
            break;
          case '$endsWith':
            cond[key] = `%${processedValue}`;
            break;
          case '$between':
            cond[key] = processedValue;
            break;
          default:
            cond[key] = processedValue;
            break;
        }
      } else if (typeof cond[key] === 'object' && cond[key] !== null) {
        applyOperator(cond[key]);
      }
    });
  };

  applyOperator(condition);

  // Apply the operator to the root of the condition
  if (
    operator === '$contains' ||
    operator === '$startsWith' ||
    operator === '$endsWith'
  ) {
    return {
      [Object.keys(condition)[0]]: { $like: Object.values(condition)[0] },
    };
  } else {
    return {
      [Object.keys(condition)[0]]: { [operator]: Object.values(condition)[0] },
    };
  }
};
const formatDateValue = (value: any, operator: string) => {
  if (
    operator === '$between' &&
    typeof value === 'object' &&
    value.from &&
    value.to
  ) {
    return [
      date.formatDate(value.from, 'YYYY-MM-DD'),
      date.formatDate(value.to, 'YYYY-MM-DD 23:59:59'),
    ];
  } else if (typeof value === 'string') {
    return date.formatDate(value, 'YYYY-MM-DD');
  }
  return value;
};

const replaceCondition = (condition: any, operator: string, value: any) => {
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
  mergeInInclude: any,
  newIncludeObject: any,
  fieldValue: any,
  currentOperator: string,
  type: string
) => {
  if (!mergeInInclude.include) mergeInInclude.include = [];

  let existingInclude = mergeInInclude.include.find(
    (include: any) => include.as === newIncludeObject.as
  );

  if (!existingInclude) {
    newIncludeObject.where = buildCondition(
      newIncludeObject.where,
      fieldValue,
      currentOperator,
      type
    );
    mergeInInclude.include.push(newIncludeObject);
  } else {
    if (newIncludeObject.where && !existingInclude.where)
      existingInclude.where = {};
    existingInclude.where = {
      ...existingInclude.where,
      ...buildCondition(
        newIncludeObject.where,
        fieldValue,
        currentOperator,
        type
      ),
    };
  }
};

watch(() => props.filterOptions, initializeFilters, { deep: true });
</script>
