<template>
  <q-btn-group :class="buttonGroupClasses">
    <template v-for="action in buttonGroupActions" :key="action.name">
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
        @click="() => handleActionClick(action)"
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
                        @action-completed="fetchData" &gt;&lt;/your-component>
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
        </slot>
      </q-btn>
    </template>
    <slot />

    <q-btn
      @click="toggleMenuActions = !toggleMenuActions"
      dense
      flat
      size="sm"
      icon="more_vert"
      v-if="menuActions.length"
    >
      {{ menuLabel }}

      <q-menu offset-y>
        <q-list dense separator>
          <q-item
            v-for="action in menuActions"
            :key="action.name"
            @click="() => handleActionClick(action)"
          >
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
              @click="() => handleActionClick(action)"
              :label="getLabel(action, props.record)"
              class="full-width"
              align="left"
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
                      <template
                        v-if="action.ui && action.ui.mode === 'confirmation'"
                      >
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
                                This action is not implemented yet. Please
                                create a template in parent component with
                                <b>'#{{ action.name }}'</b>
                                slot.
                              </div>
                            </q-banner>
                            <code>
                              &lt;template #{{ action.name }}="{ action,
                              closeDialog }"&gt; &lt;your-component
                              :action="action" :record="props.row"
                              :close-dialog="closeDialog"
                              @action-completed="fetchData"
                              &gt;&lt;/your-component> &lt;/template&gt;
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
                  <template
                    v-for="(errorMessages, field) in errors"
                    :key="field"
                  >
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
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </q-btn-group>
</template>

<script setup lang="ts">
import { computed, reactive, toRefs, ref, PropType } from "vue";
import { useForm } from "../composibles/use-form";
import { ActionListDTO } from "../ActionDTO";

interface DialogStates {
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
    type: [Array, Object] as PropType<
      | string[]
      | Record<
          string,
          {
            displayMode: "btngroup" | "menu";
          }
        >
    >,
    default: () => [],
  },
  record: {
    type: Object,
    required: true,
  },
  customActions: {
    type: Object, // Object mapping action names to functions
    default: () => ({}),
  },
  actionUnavailableBehavior: {
    type: String,
    default: "disable", // or 'hide'
  },
  api: {
    type: Function,
    required: true,
  },
  buttonGroupClasses: {
    type: String,
    default: "",
  },
  qnatkUrl: {
    type: String,
    default: "/qnatk",
  },
  menuLabel: {
    type: String,
    default: "Actions",
  },
});

const toggleMenuActions = ref(false);

const emit = defineEmits(["action-completed"]);

const { customActions } = toRefs(props);

const visibleActionsIsArray = Array.isArray(props.visibleActions);
const visibleActionsArray = visibleActionsIsArray
  ? props.visibleActions
  : Object.keys(props.visibleActions);

const checkCondition = (action, record) => {
  const evaluateCondition = (conditionValue, recordValue) => {
    if (Array.isArray(conditionValue)) {
      return conditionValue.includes(recordValue); // 'OR' condition
    }
    return conditionValue === recordValue; // Single value condition
  };

  if (!action.condition) {
    return true; // If no condition is specified, the action is always available
  }

  for (const [key, value] of Object.entries(action.condition)) {
    // If any condition fails, return false
    if (!evaluateCondition(value, record[key])) {
      return false;
    }
  }
  return true; // All conditions passed
};

const singleRecordActions = computed(() => {
  const actionKeys = Object.keys(props.actions);

  const filteredKeys =
    visibleActionsArray.length > 0
      ? actionKeys.filter((key) => visibleActionsArray.includes(key))
      : actionKeys;

  return filteredKeys
    .filter((key) => {
      // props.actionUnavailableBehavior === 'hide'
      //       ? visibleActionsArray.includes(key) && checkCondition(props.actions[key], props.record)
      //   : visibleActionsArray.includes(key)
      return (
        props.actions[key].mode === "SingleRecord" &&
        (props.actionUnavailableBehavior === "hide"
          ? checkCondition(props.actions[key], props.record)
          : true)
      );
    })
    .map((key) => {
      const actionData = props.actions[key];
      if (visibleActionsIsArray && !actionData["displayMode"])
        actionData["displayMode"] = "btngroup";
      else if (!visibleActionsIsArray && props.visibleActions[key]) {
        actionData["displayMode"] = props.visibleActions[key].displayMode;
      }

      return actionData;
    });
});

const menuActions = computed(() => {
  return singleRecordActions.value.filter((action) => {
    return action.displayMode === "menu";
  });
});

const buttonGroupActions = computed(() => {
  return singleRecordActions.value.filter(
    (action) => action.displayMode !== "menu"
  );
});

// State to track dialog open/close for each action
const dialogStates = reactive(
  singleRecordActions.value.reduce((acc: DialogStates, action) => {
    acc[action.name] = false;
    return acc;
  }, {})
);

const handleActionClick = (action) => {
  console.log("Action clicked:", action.name);
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

const getIcon = (action, record) => {
  // console.log(action, record);
  if (typeof action.icon === "string") {
    return action.icon; // Return the string directly if it's a string
  } else if (typeof action.icon === "object") {
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
  if (typeof action.iconColor === "string") {
    return action.iconColor; // Return the string directly if it's a string
  } else if (typeof action.iconColor === "object") {
    // Iterate through the object keys and check conditions
    for (const [key, condition] of Object.entries(action.iconColor)) {
      if (checkCondition({ condition }, record)) {
        return key; // Return the key (icon) that matches the condition
      }
    }
  }
  return "primary"; // Default icon or handle this case as needed
};

const getLabel = (action, record) => {
  if (typeof action.label === "string") {
    return action.label; // Return the string directly if it's a string
  } else if (typeof action.label === "object") {
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
    `${props.qnatkUrl}/${props.baseModel}/actionExecute`,
    {} // Initialize with empty object or default values
  );

// callbacks.onError = (error) => {
//   isLoading.value = false; // Reset loading state
//   console.log('Error:', error);
// };

// Inside SingleRecordActions setup
const handleConfirmation = async (action) => {
  const baseModel = action.baseModel ?? props.baseModel;

  updateUrl(`${props.qnatkUrl}/${baseModel}/actionExecute/${action.name}`);
  // Prepare the form data
  values.value = props.record; // Update form data

  callbacks.onSuccess = (data) => {
    isLoading.value = false; // Reset loading state
    errors.value = {}; // Reset errors
    emit("action-completed", { action, modelInstance: data.modelInstance }); // Emitting the event
    // Handle success (e.g., show success message, refresh data)
  };

  // Default confirmation logic
  console.log("Confirmed action:", action.name);
  await validateAndSubmit(); // Submit the form
  if (Object.keys(errors.value).length === 0 && !isLoading.value) {
    toggleDialog(action.name, false);
  }
};
</script>
