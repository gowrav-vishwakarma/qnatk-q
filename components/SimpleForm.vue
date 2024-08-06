<template>
  <q-card>
    <q-card-section
      ><slot name="title"
        ><div class="text-h6">Title here: slot #title</div></slot
      >
    </q-card-section>
    <q-form
      class="q-gutter-xs"
      @submit.prevent="validateAndSubmit"
      v-bind="$attrs"
    >
      <q-card-section>
        <div class="row q-col-gutter-md">
          <template v-for="field in reactiveFormFields" :key="field.fieldId">
            <div :class="`${field.colClass}`" v-if="field.isVisible">
              <template v-if="field.children">
                <component
                  :is="field.component"
                  v-bind="{ ...field.props, ...getDynamicProps(field) }"
                >
                  <template
                    v-for="childField in field.children"
                    :key="childField.fieldId"
                  >
                    <div
                      :class="`${childField.colClass}`"
                      v-if="childField.isVisible"
                    >
                      <span
                        class="q-px-sm"
                        v-if="childField.props.isHeaderLabel"
                      >
                        {{ childField.props.label }}
                        <span class="text-red">*</span>
                      </span>
                      <component
                        :is="childField.component"
                        v-bind="{
                          ...childField.props,
                          ...getDynamicProps(childField),
                        }"
                        v-model="values[childField.fieldId]"
                        :error="!!errors[childField.fieldId]"
                        :error-message="
                          errors[childField.fieldId]
                            ? errors[childField.fieldId].join('; ')
                            : ''
                        "
                        :rules="getRules(childField)"
                      >
                        <template v-if="field.htmlContent">
                          <component
                            v-for="(item, index) in field.htmlContent"
                            :key="index"
                            :is="item.tag"
                            v-bind="item.attrs"
                          >
                            {{ item.content }}
                          </component>
                        </template>
                      </component>
                    </div>
                  </template>
                </component>
              </template>
              <template v-else>
                <span class="q-px-sm" v-if="field.props.isHeaderLabel">
                  {{ field.props.label }} <span class="text-red">*</span>
                </span>
                <component
                  :is="field.component"
                  v-bind="{ ...field.props, ...getDynamicProps(field) }"
                  v-model="values[field.fieldId]"
                  :error="!!errors[field.fieldId]"
                  :error-message="
                    errors[field.fieldId]
                      ? errors[field.fieldId].join('; ')
                      : ''
                  "
                  :rules="getRules(field)"
                />
              </template>
            </div>
          </template>
        </div>
      </q-card-section>
      <q-card-section align="right">
        <q-btn
          flat
          @click.prevent="formConfig.callbacks?.onCanceled?.()"
          color="primary"
          v-close-popup
        >
          Cancel
        </q-btn>
        <q-btn
          flat
          type="submit"
          color="primary"
          :disable="disableMultipleSubmit && isLoading"
          >Submit</q-btn
        >
      </q-card-section>
    </q-form>
  </q-card>
</template>

<script setup lang="ts">
import { FormConfig, FormField } from '../form-builder-interface';
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
  disableMultipleSubmit: {
    type: Boolean,
    default: true,
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

// Making form fields reactive
const reactiveFormFields = computed(() => {
  return props.formConfig.formFields.map((field) => ({
    ...field,
    isVisible: !field.showCondition || field.showCondition(values.value),
    children: field.children?.map((childField) => ({
      ...childField,
      isVisible:
        !childField.showCondition || childField.showCondition(values.value),
    })),
  }));
});

const defaultValues = reactive({ ...initData.value });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initializeValues = (fields: any[]) => {
  fields.forEach((field) => {
    defaultValues[field.fieldId] = getNestedValue(
      field.dataField,
      props.initData
    );
    if (field.children) {
      initializeValues(field.children);
    }
  });
};

initializeValues(props.formConfig.formFields);

// props.formConfig.formFields.forEach((field) => {
//   defaultValues[field.fieldId] = getNestedValue(
//     field.dataField,
//     props.initData
//   );
// });

const submitUrl = computed(() => {
  const urlConfig = props.formConfig.submitUrl;
  return typeof urlConfig === 'function'
    ? urlConfig(props.initData)
    : urlConfig;
});

const { values, validateAndSubmit, callbacks, errors, isLoading } = useForm(
  props.formConfig?.api(),
  submitUrl.value,
  defaultValues
);

const getDynamicProps = (field: FormField) => {
  if (!field.dynamicProps) return {};

  const dynamicProps: Record<string, string> = {};
  for (const [propName, fieldId] of Object.entries(field.dynamicProps)) {
    dynamicProps[propName] = values.value[fieldId];
  }
  return dynamicProps;
};

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
