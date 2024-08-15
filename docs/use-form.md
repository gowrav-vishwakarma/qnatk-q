# useForm Documentation

## Introduction

`useForm` is a powerful composable function provided by the QNATK framework for Vue 3 and Quasar 2 applications. It simplifies form handling, validation, submission processes, and response validation, making it easier to create robust and efficient forms in your application.

## Installation

Ensure you have the QNATK framework installed in your Vue 3 and Quasar 2 project. The `useForm` composable is typically available in the `src/qnatk/composibles/use-form.ts` file.

## Basic Usage

Here's a basic example of how to use the `useForm` composable:

```vue
<template>
  <q-form @submit="validateAndSubmit">
    <q-input
      v-model="values.name"
      label="Name"
      :error="!!errors.name"
      :error-message="errors.name?.join('; ')"
    />
    <q-input
      v-model="values.email"
      label="Email"
      :error="!!errors.email"
      :error-message="errors.email?.join('; ')"
    />
    <q-btn type="submit" label="Submit" :loading="isLoading" />
  </q-form>
</template>

<script setup lang="ts">
import { useForm } from 'src/qnatk/composibles/use-form';
import { api } from 'boot/axios';

const { values, errors, isLoading, validateAndSubmit } = useForm(
  api,
  '/api/users',
  {
    name: '',
    email: '',
  }
);
</script>
```

## API Reference

### Function Signature

```typescript
function useForm<ResponseFormat extends Record<string, any>>(
  api: AxiosInstance,
  initialUrl: string,
  defaultValues: Record<string, any>,
  METHOD: 'post' | 'get' = 'post',
  DTOClass?: new () => ResponseFormat,
  responseValidationOptions: ResponseValidationOptions = {}
): {
  values: Ref<Record<string, any>>;
  errors: Ref<FormErrors>;
  isLoading: Ref<boolean>;
  validateAndSubmit: (resetForm?: boolean) => Promise<void>;
  updateUrl: (newUrl: string) => void;
  updateApiInstance: (newApi: AxiosInstance) => void;
  responseData: Ref<ResponseFormat | ResponseFormat[]>;
  callbacks: {
    onSuccess: (data: any) => any | Promise<any>;
    onError: (error: any) => Promise<never>;
    beforeSubmit: (
      values: Record<string, unknown>
    ) => Record<string, unknown> | Promise<Record<string, unknown>>;
  };
  resetForm: () => void;
  validateResponse: <T extends object>(
    data: any,
    DTOClass: new () => T,
    options?: ResponseValidationOptions
  ) => Promise<T | T[]>;
};
```

### Parameters

- `api`: The Axios instance for making API calls.
- `initialUrl`: The initial API endpoint for form submission.
- `defaultValues`: An object containing the initial values for form fields.
- `METHOD`: The HTTP method to use for form submission (default: 'post').
- `DTOClass`: An optional class for response data validation.
- `responseValidationOptions`: Options for response validation (see Response Validation section).

### Returned Object

- `values`: A reactive reference to the current form values.
- `errors`: A reactive reference to form validation errors.
- `isLoading`: A boolean ref indicating if a form submission is in progress.
- `validateAndSubmit`: A function to validate and submit the form.
- `updateUrl`: A function to update the submission URL.
- `updateApiInstance`: A function to update the Axios instance used for API calls.
- `responseData`: A reactive reference to the API response data.
- `callbacks`: An object containing customizable callback functions.
- `resetForm`: A function to reset the form to its initial state.
- `validateResponse`: A function to validate response data against a DTO class.

## Advanced Usage

### Custom Validation and Data Transformation

You can implement custom validation logic and transform the data before submission using the `beforeSubmit` callback:

```vue
<script setup lang="ts">
import { useForm } from 'src/qnatk/composibles/use-form';
import { api } from 'boot/axios';

const { values, errors, isLoading, validateAndSubmit, callbacks } = useForm(
  api,
  '/api/users',
  {
    name: '',
    email: '',
    age: '',
  }
);

callbacks.beforeSubmit = (formValues) => {
  const newErrors: Record<string, string[]> = {};

  if (formValues.name.length < 3) {
    newErrors.name = ['Name must be at least 3 characters long'];
  }

  if (!/^\S+@\S+\.\S+$/.test(formValues.email)) {
    newErrors.email = ['Invalid email format'];
  }

  if (parseInt(formValues.age) < 18) {
    newErrors.age = ['Must be 18 or older'];
  }

  if (Object.keys(newErrors).length > 0) {
    errors.value = newErrors;
    throw new Error('Validation failed');
  }

  // Transform data before submission
  return {
    ...formValues,
    age: parseInt(formValues.age),
    createdAt: new Date().toISOString(),
  };
};
</script>
```

### Handling API Responses

Customize how API responses are handled using the `onSuccess` and `onError` callbacks:

```vue
<script setup lang="ts">
import { useForm } from 'src/qnatk/composibles/use-form';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const { values, errors, isLoading, validateAndSubmit, callbacks } = useForm(
  api,
  '/api/users',
  {
    name: '',
    email: '',
  }
);

callbacks.onSuccess = (data) => {
  $q.notify({
    type: 'positive',
    message: `User ${data.name} created successfully!`,
  });
  return data; // You can transform the data here if needed
};

callbacks.onError = (error) => {
  $q.notify({
    type: 'negative',
    message: `Error: ${error.message}`,
  });
  throw error; // Rethrow the error or handle it as needed
};
</script>
```

### Dynamic Form Fields

You can create dynamic form fields by manipulating the `values` object:

```vue
<template>
  <q-form @submit="validateAndSubmit">
    <div v-for="(field, index) in values.fields" :key="index">
      <q-input v-model="field.value" :label="`Field ${index + 1}`" />
    </div>
    <q-btn @click="addField" label="Add Field" type="button" />
    <q-btn type="submit" label="Submit" :loading="isLoading" />
  </q-form>
</template>

<script setup lang="ts">
import { useForm } from 'src/qnatk/composibles/use-form';
import { api } from 'boot/axios';

const { values, errors, isLoading, validateAndSubmit } = useForm(
  api,
  '/api/dynamic-form',
  {
    fields: [{ value: '' }],
  }
);

const addField = () => {
  values.value.fields.push({ value: '' });
};
</script>
```

### File Uploads

The `useForm` composable automatically handles file uploads by converting the form data to `FormData` when it detects `File` objects:

```vue
<template>
  <q-form @submit="validateAndSubmit">
    <q-input v-model="values.name" label="Name" />
    <q-file v-model="values.avatar" label="Avatar" />
    <q-btn type="submit" label="Submit" :loading="isLoading" />
  </q-form>
</template>

<script setup lang="ts">
import { useForm } from 'src/qnatk/composibles/use-form';
import { api } from 'boot/axios';

const { values, errors, isLoading, validateAndSubmit } = useForm(
  api,
  '/api/users',
  {
    name: '',
    avatar: null,
  }
);
</script>
```

## Response Validation

The `useForm` composable provides built-in response validation using the `class-validator` and `class-transformer` libraries. You can configure the validation behavior using the `responseValidationOptions` parameter:

```typescript
interface ResponseValidationOptions {
  expectArray?: boolean;
  filterExtraFields?: boolean;
  warnOnExtraFields?: boolean;
  throwOnExtraFields?: boolean;
  validatorOptions?: ValidatorOptions;
  onValidationError?: (errors: ValidationError[]) => void;
  validationFailed?: 'warn' | 'throw' | 'silent';
}
```

- `expectArray`: Specifies whether to expect an array response (default: inferred from DTO).
- `filterExtraFields`: If true, removes any fields not defined in the DTO class.
- `warnOnExtraFields`: If true, logs a warning for any extra fields found in the response.
- `throwOnExtraFields`: If true, throws an error if extra fields are found in the response.
- `validatorOptions`: Options passed to the `class-validator` library.
- `onValidationError`: A custom function to handle validation errors.
- `validationFailed`: Determines the behavior when validation fails ('warn', 'throw', or 'silent').

### Using TypeScript DTOs with Response Validation

You can use TypeScript DTOs to ensure type safety for your form data and API responses:

```vue
<script setup lang="ts">
import { useForm } from 'src/qnatk/composibles/use-form';
import { api } from 'boot/axios';
import { UserDTO } from './user.dto';

const { values, errors, isLoading, validateAndSubmit, responseData } =
  useForm<UserDTO>(
    api,
    '/api/users',
    {
      name: '',
      email: '',
    },
    'post',
    UserDTO,
    {
      filterExtraFields: true,
      warnOnExtraFields: true,
      validationFailed: 'warn',
    }
  );

// responseData will be typed as Ref<UserDTO | UserDTO[]>
</script>
```

### Using validateResponse Separately

You can also use the `validateResponse` function separately from `useForm`:

```typescript
import { useForm } from 'src/qnatk/composibles/use-form';
import { api } from 'boot/axios';
import { UserDTO } from './user.dto';

const { validateResponse } = useForm(api, '/api/users', {});

const validateUserResponse = async (data: unknown) => {
  try {
    const validatedUser = await validateResponse(data, UserDTO, {
      warnOnExtraFields: true,
      validationFailed: 'throw',
    });
    console.log('Validated user:', validatedUser);
  } catch (error) {
    console.error('Validation error:', error);
  }
};
```

## Advanced Features

### Updating API Instance

You can update the Axios instance used by the form at runtime:

```typescript
import { useForm } from 'src/qnatk/composibles/use-form';
import { api, createNewApi } from './api';

const { updateApiInstance } = useForm(api, '/api/users', {});

// Later in your code
const newApi = createNewApi({
  /* new config */
});
updateApiInstance(newApi);
```

### Resetting the Form

Use the `resetForm` function to clear the form after successful submission:

```typescript
const { validateAndSubmit, resetForm } = useForm(api, '/api/users', { ... });

const handleSubmit = async () => {
  await validateAndSubmit();
  resetForm();
};
```

### Conditional Form Submission

You can conditionally submit the form based on certain criteria:

```typescript
const { values, validateAndSubmit } = useForm(api, '/api/users', { ... });

const handleSubmit = async () => {
  if (values.value.agreeToTerms) {
    await validateAndSubmit();
  } else {
    // Show error or prompt user to agree to terms
  }
};
```

### Updating URL Dynamically

Use the `updateUrl` function to change the submission endpoint based on form state:

```typescript
const { values, updateUrl, validateAndSubmit } = useForm(api, '/api/users', { ... });

watch(() => values.value.userType, (newUserType) => {
  updateUrl(`/api/${newUserType}s`);
});
```

## Tips and Tricks

1. **Creating a Wrapper Function**: You can create a wrapper function to simplify the usage of `useForm` in your project:

   ```typescript
   // src/composables/use-backend-form.ts
   import { useForm } from 'src/qnatk/composibles/use-form';
   import { api } from 'boot/axios';

   export function useBackendForm<ResponseFormat extends object>(
     initialUrl: string,
     defaultValues: Record<string, any>
   ) {
     return useForm<ResponseFormat>(api, initialUrl, defaultValues);
   }
   ```

2. **Custom Error Handling**: Implement custom error handling for specific fields:

   ```vue
   <template>
     <q-input
       v-model="values.email"
       label="Email"
       :error="!!errors.email"
       :error-message="getErrorMessage('email')"
     />
   </template>

   <script setup lang="ts">
   import { useForm } from 'src/qnatk/composibles/use-form';
   import { api } from 'boot/axios';

   const { values, errors } = useForm(api, '/api/users', { email: '' });

   const getErrorMessage = (field: string) => {
     if (errors.value[field]) {
       return errors.value[field].map((msg) => msg.toUpperCase()).join('; ');
     }
     return '';
   };
   </script>
   ```

3. **Integration with Vuex/Pinia**: You can integrate `useForm` with state management libraries:

   ```typescript
   import { useStore } from 'vuex';
   import { useForm } from 'src/qnatk/composibles/use-form';
   import { api } from 'boot/axios';

   const store = useStore();
   const { values, validateAndSubmit, callbacks } = useForm(api, '/api/users', { ... });

   callbacks.onSuccess = (data) => {
     store.commit('setUser', data);
   };
   ```

4. **Debounced Validation**: Implement debounced validation for better performance:

   ```typescript
   import { useForm } from 'src/qnatk/composibles/use-form';
   import { api } from 'boot/axios';
   import { debounce } from 'quasar';

   const { values, errors, callbacks } = useForm(api, '/api/users', { ... });

   const debouncedValidate = debounce(() => {
     callbacks.beforeSubmit(values.value).catch(() => {
       // Validation failed, errors are set
     });
   }, 300);

   watch(values, debouncedValidate);
   ```

5. **Using Different HTTP Methods**: You can specify the HTTP method when calling `useForm`:

   ```typescript
   const { values, validateAndSubmit } = useForm(
     api,
     '/api/users',
     { id: 1, name: 'John Doe' },
     'get' // Use GET method instead of the default POST
   );
   ```

6. **Handling Nested Data**: You can work with nested data structures in your form:

   ```vue
   <script setup lang="ts">
   import { useForm } from 'src/qnatk/composibles/use-form';
   import { api } from 'boot/axios';

   const { values, validateAndSubmit } = useForm(api, '/api/users', {
     name: '',
     address: {
       street: '',
       city: '',
       country: '',
     },
   });
   </script>

   <template>
     <q-input v-model="values.name" label="Name" />
     <q-input v-model="values.address.street" label="Street" />
     <q-input v-model="values.address.city" label="City" />
     <q-input v-model="values.address.country" label="Country" />
   </template>
   ```

7. **Async Validation**: Implement asynchronous validation in the `beforeSubmit` callback:

   ```typescript
   const { values, errors, callbacks } = useForm(api, '/api/users', {
     username: '',
   });

   callbacks.beforeSubmit = async (formValues) => {
     const { data } = await api.get(
       `/api/check-username/${formValues.username}`
     );
     if (data.exists) {
       errors.value.username = ['Username already exists'];
       throw new Error('Username taken');
     }
     return formValues;
   };
   ```

8. **Form Initialization from API**: You can initialize the form with data from an API:

   ```typescript
   import { useForm } from 'src/qnatk/composibles/use-form';
   import { api } from 'boot/axios';
   import { onMounted } from 'vue';

   const { values, updateUrl } = useForm(api, '/api/users', {
     name: '',
     email: '',
   });

   onMounted(async () => {
     const { data } = await api.get('/api/user/1');
     values.value = data;
     updateUrl(`/api/users/${data.id}`);
   });
   ```

9. **Custom Headers**: You can add custom headers to your form submission:

   ```typescript
   import { useForm } from 'src/qnatk/composibles/use-form';
   import axios from 'axios';

   const api = axios.create({
     headers: {
       'Custom-Header': 'SomeValue'
     }
   });

   const { validateAndSubmit } = useForm(api, '/api/users', { ... });
   ```

10. **Handling Multiple Submit Buttons**: You can handle multiple submit actions in a single form:

    ```vue
    <template>
      <q-form @submit.prevent>
        <q-input v-model="values.name" label="Name" />
        <q-btn @click="submitDraft">Save Draft</q-btn>
        <q-btn @click="submitFinal">Submit Final</q-btn>
      </q-form>
    </template>

    <script setup lang="ts">
    import { useForm } from 'src/qnatk/composibles/use-form';
    import { api } from 'boot/axios';

    const { values, validateAndSubmit, updateUrl } = useForm(
      api,
      '/api/users',
      {
        name: '',
        status: '',
      }
    );

    const submitDraft = () => {
      values.value.status = 'draft';
      updateUrl('/api/drafts');
      validateAndSubmit();
    };

    const submitFinal = () => {
      values.value.status = 'final';
      updateUrl('/api/submissions');
      validateAndSubmit();
    };
    </script>
    ```

Remember to adapt these examples to your specific use case and project structure. The QNATK framework provides a flexible foundation for building complex forms with ease in Vue 3 and Quasar 2 applications.
