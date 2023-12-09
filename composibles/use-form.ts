import { ref } from 'vue';
import { useQuasar } from 'quasar';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

type FormErrors = Record<string, string[]>;
type ErrorResponse = {
  errors: FormErrors;
};

export function useForm(
  api: AxiosInstance, // Add the AxiosInstance parameter
  initialUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValues: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (data: any) => void,
  onError?: (error: unknown) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  beforeSubmit?: (values: Record<string, any>) => void
) {
  const $q = useQuasar();
  const values = ref({ ...defaultValues });
  const errors = ref<FormErrors>({});
  const isLoading = ref(false);

  const url = ref(initialUrl);

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

  const validateAndSubmit = async () => {
    errors.value = {};
    isLoading.value = true;

    if (beforeSubmit) {
      beforeSubmit(values.value);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: FormData | Record<string, any>;
    const hasFiles = containsFiles(values.value);

    if (hasFiles) {
      payload = new FormData();
      Object.entries(values.value).forEach(([key, value]) => {
        if (isFile(value)) {
          payload.append(key, value);
        } else if (Array.isArray(value) && value.some(isFile)) {
          value.forEach((file) => {
            if (isFile(file)) {
              payload.append(key, file);
            }
          });
        } else {
          payload.append(key, value);
        }
      });
    } else {
      payload = values.value;
    }

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': hasFiles ? 'multipart/form-data' : 'application/json',
      },
    };

    try {
      const response = await api.post(url.value, payload, config);
      $q.notify({ color: 'positive', message: 'Form submitted successfully!' });
      values.value = { ...defaultValues };
      onSuccess?.(response.data);
    } catch (error) {
      onError?.(error);
      console.error(error);
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
    } finally {
      isLoading.value = false;
    }
  };

  return {
    values,
    errors,
    isLoading,
    updateUrl,
    validateAndSubmit,
  };
}
