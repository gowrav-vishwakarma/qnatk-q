<template>
  <q-btn-group>
    <template v-for="action in singleRecordActions" :key="action.name">
      <q-btn
        v-if="
          actionUnavailableBehavior === 'hide'
            ? checkCondition(action, props.record)
            : true
        "
        :disabled="
          actionUnavailableBehavior === 'disable' &&
          !checkCondition(action, props.record)
        "
        dense
        flat
        :icon="action.icon"
        :color="
          actionUnavailableBehavior === 'disable' &&
          !checkCondition(action, props.record)
            ? 'grey'
            : action.iconColor ?? 'primary'
        "
        size="sm"
        @click="() => toggleDialog(action.name)"
      >
        <slot
          :name="`${action.name}-outer`"
          :action="action"
          :record="props.record"
          :closeDialog="() => toggleDialog(action.name, false)"
          :confirmAction="() => handleConfirmation(action)"
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
                        @action-completed="fetchData"
                        &gt;&lt;/your-component$lt; &lt;/template&gt;
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
        </slot>
      </q-btn>
    </template>
  </q-btn-group>
</template>

<script setup lang="ts">
import { computed, reactive, toRefs } from 'vue';
import { useForm } from '../composibles/use-form';
import { ActionListDTO } from '../ActionDTO';
import { AxiosInstance } from 'axios';

interface DialogStates {
  [key: string]: boolean;
}

interface ActionStructure {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
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
  record: {
    type: Object,
    required: true,
  },
  customConfirmations: {
    type: Object, // Object mapping action names to functions
    default: () => ({}),
  },
  actionUnavailableBehavior: {
    type: String,
    default: 'disable', // or 'hide'
  },

  api: {
    type: Function,
    required: true,
  },
});

const emit = defineEmits(['action-completed']);

const { customConfirmations } = toRefs(props);

const checkCondition = (action: ActionStructure, record) => {
  if (!action.condition) {
    // If no condition is specified, the action is always available
    return true;
  }

  return Object.entries(action.condition).every(([key, value]) => {
    return record[key] === value;
  });
};

const singleRecordActions = computed(() => {
  return Object.keys(props.actions)
    .filter((key) => props.actions[key].mode === 'SingleRecord')
    .map((key) => props.actions[key]);
});

// State to track dialog open/close for each action
const dialogStates = reactive(
  singleRecordActions.value.reduce((acc: DialogStates, action) => {
    acc[action.name] = false;
    return acc;
  }, {})
);

const toggleDialog = (actionName, open = true) => {
  dialogStates[actionName] = open;
};

// Outside the handleConfirmation method
const { values, validateAndSubmit, isLoading, errors, updateUrl, callbacks } =
  useForm(
    props.api(),
    `/qnatk/${props.baseModel}/actionExecute`,
    {} // Initialize with empty object or default values
  );

callbacks.onSuccess = (data) => {
  isLoading.value = false; // Reset loading state
  errors.value = {}; // Reset errors
  console.log('Success:', data);
  // Handle success (e.g., show success message, refresh data)
};

callbacks.onError = (error) => {
  isLoading.value = false; // Reset loading state
  console.log('Error:', error);
  // Handle error (e.g., show error message)
};

// Inside SingleRecordActions setup
const handleConfirmation = async (action) => {
  updateUrl(`/qnatk/${props.baseModel}/actionExecute/${action.name}`);
  // Prepare the form data
  values.value = { action: action, record: props.record }; // Update form data

  if (customConfirmations.value[action.name]) {
    // Custom confirmation logic
    customConfirmations.value[action.name](action, props.record, () =>
      toggleDialog(action.name, false)
    );
  } else {
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
