import { reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { validate } from 'class-validator';
import {
  classToPlain,
  instanceToPlain,
  plainToClass,
  plainToInstance,
} from 'class-transformer';

type FormErrors = Record<string, string[]>;
type ErrorResponse = {
  errors: FormErrors;
};

export function useForm(
  api: AxiosInstance, // Add the AxiosInstance parameter
  initialUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValues: Record<string, any>,
  METHOD: 'post' | 'get' = 'post'
) {
  const $q = useQuasar();
  const values = ref({ ...defaultValues });
  const errors = ref<FormErrors>({});
  const isLoading = ref(false);

  const url = ref(initialUrl);

  // Define the callback functions in a reactive object
  const callbacks = reactive({
    // Define a default implementation for onSuccess
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSuccess: (data: any): any | Promise<any> => {
      $q.notify({ color: 'positive', message: 'Form submitted successfully!' });
      return data; // Return the input parameter
    },
    // Define a default implementation for onError
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: async (error: any) => {
      if (axios.isAxiosError(error) && error.response) {
        const errorResponse = error.response.data as ErrorResponse;
        if (errorResponse && errorResponse.errors) {
          errors.value = errorResponse.errors;
          Object.entries(errors.value).forEach(([field, messages]) => {
            if (!(field in defaultValues)) {
              $q.notify({
                color: 'negative',
                message: `${field}: ${messages.join('; ')}`,
              });
            }
          });
        } else {
          $q.notify({
            color: 'negative',
            message:
              error.response.data.statusCode +
              ' ' +
              error.response.data.message,
          });
        }
      } else {
        $q.notify({
          color: 'negative',
          message: 'An unexpected error occurred.',
        });
      }
      throw error; // Throw the input error
    },
    // Define a default implementation for beforeSubmit
    beforeSubmit: (
      values: Record<string, unknown>
    ): Record<string, unknown> | Promise<Record<string, unknown>> => {
      return values; // Default implementation
    },
  });

  async function validateResponse<T extends object>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    DTOClass: new () => T
  ): Promise<T> {
    if (!DTOClass) return data; // If no DTO class is provided, return the data as is

    const dtoInstance = plainToInstance(DTOClass, data);
    const validationErrors = await validate(dtoInstance);

    if (validationErrors.length > 0) {
      throw validationErrors; // Throw validation errors
    }

    return instanceToPlain(dtoInstance) as T; // Return the transformed and validated data
  }

  // Function to update the URL
  const updateUrl = (newUrl: string) => {
    url.value = newUrl;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isFile = (value: any): value is File => {
    return value instanceof File;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const containsFiles = (obj: any): boolean => {
    if (isFile(obj)) {
      return true;
    } else if (Array.isArray(obj)) {
      return obj.some(containsFiles);
    } else if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(containsFiles);
    }
    return false;
  };

  const validateAndSubmit = async (resetForm = true) => {
    errors.value = {};
    isLoading.value = true;

    let data_to_submit;

    // Check if beforeSubmit is asynchronous (returns a promise)
    if (callbacks.beforeSubmit(values.value) instanceof Promise) {
      data_to_submit = await callbacks.beforeSubmit(values.value);
    } else {
      data_to_submit = callbacks.beforeSubmit(values.value);
    }

    if (!data_to_submit) {
      data_to_submit = values.value;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: FormData | Record<string, any>;
    const hasFiles = containsFiles(values.value);

    if (hasFiles) {
      payload = new FormData();
      Object.entries(data_to_submit).forEach(([key, value]) => {
        if (isFile(value)) {
          payload.append(key, value);
        } else if (Array.isArray(value) && value.some(isFile)) {
          value.forEach((file) => {
            if (isFile(file)) {
              payload.append(key, file);
            }
          });
        } else {
          // Check if the value is an object and not a File, and stringify it
          if (
            typeof value === 'object' &&
            value !== null &&
            !(value instanceof File)
          ) {
            payload.append(key, JSON.stringify(value));
          } else {
            payload.append(key, value);
          }
        }
      });
    } else {
      payload = data_to_submit;
    }

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': hasFiles ? 'multipart/form-data' : 'application/json',
      },
    };

    try {
      const response = await api[METHOD](url.value, payload, config);
      if (resetForm) values.value = { ...defaultValues };
      await callbacks.onSuccess(response.data);
    } catch (error) {
      await callbacks.onError(error);
      console.error(error);
    } finally {
      isLoading.value = false;
    }
  };

  const resetForm = () => {
    values.value = { ...defaultValues };
  };

  return {
    values,
    errors,
    isLoading,
    updateUrl,
    validateAndSubmit,
    validateResponse,
    callbacks,
    resetForm,
  };
}
