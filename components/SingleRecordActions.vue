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
        :icon="getIcon(action, props.record)"
        :color="
          actionUnavailableBehavior === 'disable' &&
          !checkCondition(action, props.record)
            ? 'grey'
            : getIconColor(action, props.record)
        "
        size="sm"
        @click="() => toggleDialog(action.name)"
        :label="getLabel(action, props.record)"
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
    <slot />
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
  visibleActions: {
    type: Array as () => string[],
    default: () => [],
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
  const actionKeys = Object.keys(props.actions);
  const filteredKeys =
    props.visibleActions.length > 0
      ? actionKeys.filter((key) => props.visibleActions.includes(key))
      : actionKeys;

  return filteredKeys
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

const getIcon = (action, record) => {
  // console.log(action, record);
  if (typeof action.icon === 'string') {
    return action.icon; // Return the string directly if it's a string
  } else if (typeof action.icon === 'object') {
    // Iterate through the object keys and check conditions
    for (const [key, condition] of Object.entries(action.icon)) {
      if (checkCondition({ condition }, record)) {
        return key; // Return the key (icon) that matches the condition
      }
    }
  }
  return null; // Default icon or handle this case as needed
};

const getIconColor = (action, record) => {
  if (typeof action.iconColor === 'string') {
    return action.iconColor; // Return the string directly if it's a string
  } else if (typeof action.iconColor === 'object') {
    // Iterate through the object keys and check conditions
    for (const [key, condition] of Object.entries(action.iconColor)) {
      if (checkCondition({ condition }, record)) {
        return key; // Return the key (icon) that matches the condition
      }
    }
  }
  return 'primary'; // Default icon or handle this case as needed
};

const getLabel = (action, record) => {
  if (typeof action.label === 'string') {
    return action.label; // Return the string directly if it's a string
  } else if (typeof action.label === 'object') {
    // Iterate through the object keys and check conditions
    for (const [key, condition] of Object.entries(action.label)) {
      if (checkCondition({ condition }, record)) {
        return key; // Return the key (icon) that matches the condition
      }
    }
  }
  return null; // Default icon or handle this case as needed
};

// Outside the handleConfirmation method
const { values, validateAndSubmit, isLoading, errors, updateUrl, callbacks } =
  useForm(
    props.api(),
    `/qnatk/${props.baseModel}/actionExecute`,
    {} // Initialize with empty object or default values
  );

// callbacks.onError = (error) => {
//   isLoading.value = false; // Reset loading state
//   console.log('Error:', error);
// };

// Inside SingleRecordActions setup
const handleConfirmation = async (action) => {
  const baseModel = action.baseModel ?? props.baseModel;

  updateUrl(`/qnatk/${baseModel}/actionExecute/${action.name}`);
  // Prepare the form data
  values.value = props.record; // Update form data

  callbacks.onSuccess = (data) => {
    isLoading.value = false; // Reset loading state
    errors.value = {}; // Reset errors
    emit('action-completed', { action, modelInstance: data.modelInstance }); // Emitting the event
    // Handle success (e.g., show success message, refresh data)
  };

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
    }
  }
};
</script>
