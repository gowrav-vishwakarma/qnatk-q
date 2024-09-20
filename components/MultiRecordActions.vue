<template>
  <q-btn-group>
    <template v-for="action in multiRecordActions" :key="action.name">
      <q-btn
        v-if="
          actionUnavailableBehavior === 'hide'
            ? checkCondition(action, props.records)
            : true
        "
        :disabled="
          actionUnavailableBehavior === 'disable' &&
          !checkCondition(action, props.records)
        "
        flat
        :icon="action.icon"
        :label="action.label"
        :color="
          actionUnavailableBehavior === 'disable' &&
          !checkCondition(action, props.records)
            ? 'grey'
            : action.iconColor ?? 'primary'
        "
        @click="() => handleActionClick(action)"
      >
        <q-dialog v-model="dialogStates[action.name]" full-width>
          <template v-if="isLoading">
            <q-spinner />
          </template>
          <template v-else>
            <slot
              :name="action.name"
              :action="action"
              :record="props.record"
              :closeDialog="() => toggleDialog(action.name, false)"
              :confirmAction="() => handleConfirmation(action)"
            >
              <!-- Check if the action UI is of type confirmation -->
              <template v-if="action.ui && action.ui.mode === 'confirmation'">
                <q-card>
                  <q-card-section>
                    <div class="text-h6">{{ action.ui.title }}</div>
                    <div>{{ action.ui.message }}</div>
                  </q-card-section>
                  <q-card-actions align="right">
                    <q-btn
                      flat
                      label="Cancel"
                      color="primary"
                      @click="toggleDialog(action.name, false)"
                    />
                    <q-btn
                      flat
                      label="Confirm"
                      color="primary"
                      @click="() => handleConfirmation(action)"
                    />
                  </q-card-actions>
                </q-card>
              </template>
              <template v-else>
                <q-card>
                  <q-card-section>
                    <div class="text-h6">{{ action.ui.title }}</div>
                    <div>{{ action.ui.message }}</div>
                  </q-card-section>
                  <q-card-section>
                    <q-banner icon="warning" class="bg-red-5" dark>
                      <div class="text-h6">NOT IMPLEMENTED</div>
                      <div>
                        This action is not implemented yet. Please create a
                        template in parent component with
                        <b>'#{{ action.name }}'</b>
                        slot.
                      </div>
                    </q-banner>
                    <code>
                      &lt;template #{{ action.name }}="{ action, closeDialog
                      }"&gt; &lt;your-component :action="action"
                      :record="props.row" :close-dialog="closeDialog"
                      @action-completed="fetchData" &gt;&lt;/your-component$lt;
                      &lt;/template&gt;
                    </code>
                  </q-card-section>
                  <q-card-actions align="right">
                    <q-btn
                      flat
                      label="Cancel"
                      color="primary"
                      @click="toggleDialog(action.name, false)"
                    />
                    <q-btn
                      flat
                      label="NOT IMPLEMENTED"
                      color="red"
                      @click="toggleDialog(action.name, false)"
                    />
                  </q-card-actions>
                </q-card>
              </template>
            </slot>
          </template>
          <template v-slot:confirm-action="{ action }">
            <!-- Scoped slot for overriding confirm action -->
            <slot
              :name="'confirm-' + action.name"
              :action="action"
              :closeDialog="() => toggleDialog(action.name, false)"
            />
          </template>
          <template v-for="(errorMessages, field) in errors" :key="field">
            <div
              v-for="message in errorMessages"
              :key="message"
              class="text-negative"
            >
              {{ message }}
            </div>
          </template>
        </q-dialog>
      </q-btn>
    </template>
  </q-btn-group>
</template>

<script setup lang="ts">
import { computed, reactive, toRefs } from 'vue';
import { useForm } from '../composibles/use-form';
import { ActionListDTO } from '../ActionDTO';

interface DialogStates {
  [key: string]: boolean;
}

interface ActionStructure {
  [key: string]: boolean;
}

const props = defineProps({
  baseModel: {
    type: String,
    required: true,
  },
  actions: {
    type: Object as () => ActionListDTO,
    required: true,
  },
  visibleActions: {
    type: Array as () => string[],
    default: () => [],
  },
  records: {
    type: Object,
    required: true,
  },
  api: {
    type: Function,
    required: true,
  },
  customActions: {
    type: Object, // Object mapping action names to functions
    default: () => ({}),
  },
  customConfirmations: {
    type: Object, // Object mapping action names to functions
    default: () => ({}),
  },
  actionUnavailableBehavior: {
    type: String,
    default: 'disable', // or 'hide'
  },
  qnatkUrl: {
    type: String,
    default: '/qnatk',
  },
});

const emit = defineEmits(['action-completed']);

const { customActions, customConfirmations } = toRefs(props);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const checkCondition = (action: ActionStructure, selectedRecords: any[]) => {
  if (selectedRecords.length === 0) {
    return false; // If no records are selected, the action is not available
  }

  if (!action.condition) {
    return true; // If no condition is specified, the action is always available
  }

  return selectedRecords.every((record) => {
    return Object.entries(action.condition).every(([key, value]) => {
      if (Array.isArray(value))
        return value.includes(record[key]); // 'OR' condition (array value)
      else {
        return record[key] === value;
      }
    });
  });
};

const multiRecordActions = computed(() => {
  const actionKeys = Object.keys(props.actions);
  const filteredKeys =
    props.visibleActions.length > 0
      ? actionKeys.filter((key) => props.visibleActions.includes(key))
      : actionKeys;

    return filteredKeys
    .filter((key) => props.actions[key].mode === 'MultiRecord')
    .map((key) => props.actions[key]);
});

// State to track dialog open/close for each action
const dialogStates = reactive(
  multiRecordActions.value.reduce((acc: DialogStates, action) => {
    acc[action.name] = false;
    return acc;
  }, {})
);

const handleActionClick = (action) => {
  // Check if there's custom confirmation logic defined for this action
  if (customActions.value[action.name]) {
    // Execute the custom confirmation logic directly
    customActions.value[action.name](action, props.record, () =>
      toggleDialog(action.name, false)
    );
  } else {
    // No custom confirmation logic, toggle the dialog for default handling
    toggleDialog(action.name);
  }
};

const toggleDialog = (actionName, open = true) => {
  dialogStates[actionName] = open;
};

const onSuccess = (data) => {
  isLoading.value = false; // Reset loading state
  errors.value = {}; // Reset errors
  console.log('Success:', data);
  // Handle success (e.g., show success message, refresh data)
};

const onError = (error) => {
  isLoading.value = false; // Reset loading state
  console.log('Error:', error);
  // Handle error (e.g., show error message)
};

// Outside the handleConfirmation method
const { values, validateAndSubmit, isLoading, errors, updateUrl, callbacks } =
  useForm(
    props.api(),
    `/${props.qnatkUrl}/${props.baseModel}/execute-action-multi-record`,
    {} // Initialize with empty object or default values
  );

// Inside SingleRecordActions setup
const handleConfirmation = async (action) => {
  updateUrl(
    `/${props.qnatkUrl}/${props.baseModel}/bulkActionExecute/${action.name}`
  );
  // Prepare the form data
  values.value = { action: action, records: props.records }; // Update form data

  if (customConfirmations.value[action.name]) {
    // Custom confirmation logic
    customConfirmations.value[action.name](action, props.records, () =>
      toggleDialog(action.name, false)
    );
  } else {
    callbacks.onSuccess = (data) => {
      isLoading.value = false; // Reset loading state
      errors.value = {}; // Reset errors
      emit('action-completed', { action, modelInstance: data.modelInstance }); // Emitting the event
      // Handle success (e.g., show success message, refresh data)
    };
    // Default confirmation logic
    console.log('Confirmed action:', action.name);
    await validateAndSubmit(); // Submit the form
    if (Object.keys(errors.value).length === 0 && !isLoading.value) {
      toggleDialog(action.name, false);
      emit('action-completed', action.name); // Emitting the event
    }
  }
};
</script>
