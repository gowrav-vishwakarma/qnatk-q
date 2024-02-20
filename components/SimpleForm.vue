<template>
  <q-card>
    <q-card-section
      ><slot name="title"
        ><div class="text-h6">Title here: slot #title</div></slot
      >
    </q-card-section>
    <q-form class="q-gutter-xs" @submit.prevent="validateAndSubmit">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div
            v-for="field in formConfig.formFields"
            :key="field.fieldId"
            :class="`${field.colClass}`"
          >
            <component
              :is="field.component"
              v-bind="field.props"
              v-model="values[field.fieldId]"
              :error="!!errors[field.fieldId]"
              :error-message="
                errors[field.fieldId] ? errors[field.fieldId].join('; ') : ''
              "
              :rules="getRules(field)"
            />
          </div>
        </div>
      </q-card-section>
      <q-card-section align="right">
        <q-btn
          flat
          @click.prevent="formConfig.callbacks?.onCanceled?.()"
          color="primary"
        >
          Cancel
        </q-btn>
        <q-btn flat type="submit" color="primary">Submit</q-btn>
      </q-card-section>
    </q-form>
  </q-card>
</template>

<script setup lang="ts">
import { FormConfig } from '../form-builder-interface';
import { useForm } from '../composibles/use-form';
import { computed, reactive, toRefs } from 'vue';

const props = defineProps({
  formConfig: {
    type: Object as () => FormConfig,
    required: true,
  },
  initData: {
    type: Object,
    required: true,
  },
});

const { initData } = toRefs(props);

const getNestedValue = (path, dataObject) => {
  return path.split('.').reduce((value, key) => {
    if (value && typeof value === 'object') {
      return value[key];
    }
    return undefined;
  }, dataObject);
};

const defaultValues = reactive({ ...initData.value });

props.formConfig.formFields.forEach((field) => {
  defaultValues[field.fieldId] = getNestedValue(
    field.dataField,
    props.initData
  );
});

const submitUrl = computed(() => {
  const urlConfig = props.formConfig.submitUrl;
  return typeof urlConfig === 'function'
    ? urlConfig(props.initData)
    : urlConfig;
});

const { values, updateUrl, validateAndSubmit, callbacks, errors } = useForm(
  props.formConfig?.api(),
  submitUrl.value,
  defaultValues
);

const getRules = (field) => {
  if (typeof field.props.rules === 'function') {
    return field.props.rules(values);
  }
  return field.props.rules;
};

// Override useForm callbacks with those provided in formConfig
if (props.formConfig?.callbacks) {
  if (props.formConfig.callbacks.onSuccess) {
    callbacks.onSuccess = props.formConfig.callbacks.onSuccess;
  }
  if (props.formConfig.callbacks.onError) {
    callbacks.onError = props.formConfig.callbacks.onError;
  }
  if (props.formConfig.callbacks.beforeSubmit) {
    callbacks.beforeSubmit = props.formConfig.callbacks.beforeSubmit;
  }
}
</script>

<style scoped></style>
