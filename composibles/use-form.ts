/* eslint-disable @typescript-eslint/no-explicit-any */

import { reactive, ref, UnwrapRef } from 'vue';
import { useQuasar } from 'quasar';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { validate, ValidationError, ValidatorOptions } from 'class-validator';
import { instanceToPlain, plainToInstance } from 'class-transformer';

type FormErrors = Record<string, string[]>;
type ErrorResponse = {
  errors: FormErrors;
};

interface ResponseValidationOptions {
  filterExtraFields?: boolean;
  warnOnExtraFields?: boolean;
  throwOnExtraFields?: boolean;
  validatorOptions?: ValidatorOptions;
  onValidationError?: (errors: ValidationError[]) => void;
}
export function useForm<ResponseFormat extends Record<string, any>>(
  api: AxiosInstance, // Add the AxiosInstance parameter
  initialUrl: string,
  defaultValues: Record<string, any>,
  METHOD: 'post' | 'get' = 'post',
  DTOClass?: new () => ResponseFormat,
  responseValidationOptions: ResponseValidationOptions = {}
) {
  const $q = useQuasar();
  const values = ref({ ...defaultValues });
  const errors = ref<FormErrors>({});
  const isLoading = ref(false);
  const responseData = ref<ResponseFormat | ResponseFormat[]>(
    [] as unknown as ResponseFormat[]
  );

  const url = ref(initialUrl);
  const apiInstance = ref(api);

  // Define the callback functions in a reactive object
  const callbacks = reactive({
    // Define a default implementation for onSuccess
    onSuccess: (data: any): any | Promise<any> => {
      $q.notify({ color: 'positive', message: 'Form submitted successfully!' });
      return data; // Return the input parameter
    },
    // Define a default implementation for onError
    onError: async (error: any): Promise<never> => {
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

  // Separate validateResponse function
  async function validateResponse<T extends object>(
    data: any,
    DTOClass: new () => T,
    options: ResponseValidationOptions = {}
  ): Promise<T> {
    const {
      filterExtraFields = false,
      warnOnExtraFields = false,
      throwOnExtraFields = false,
      validatorOptions = {},
      onValidationError,
    } = options;

    const dtoInstance = plainToInstance(DTOClass, data, {
      excludeExtraneousValues: filterExtraFields,
    });

    const validationErrors = await validate(dtoInstance, validatorOptions);

    if (validationErrors.length > 0) {
      if (onValidationError) {
        onValidationError(validationErrors);
      } else {
        throw validationErrors;
      }
    }

    const transformedData = instanceToPlain(dtoInstance) as T;

    if (!filterExtraFields) {
      const extraFields = Object.keys(data).filter(
        (key) => !(key in transformedData)
      );
      if (extraFields.length > 0) {
        if (warnOnExtraFields) {
          console.warn('Extra fields detected:', extraFields);
        }
        if (throwOnExtraFields) {
          throw new Error(`Extra fields detected: ${extraFields.join(', ')}`);
        }
      }
    }

    return transformedData;
  }

  // Function to update the URL
  const updateUrl = (newUrl: string) => {
    url.value = newUrl;
  };

  const updateApiInstance = (newApi: AxiosInstance) => {
    apiInstance.value = newApi;
  };

  const isFile = (value: any): value is File => {
    return value instanceof File;
  };

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

    // Check if beforeSubmit is asynchronous (returns a promise)
    let data_to_submit = await callbacks.beforeSubmit(values.value);

    if (!data_to_submit) {
      data_to_submit = values.value;
    }

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
      const response = await apiInstance.value[METHOD](
        url.value,
        payload,
        config
      );

      if (DTOClass) {
        try {
          responseData.value = (await validateResponse(
            response.data,
            DTOClass,
            responseValidationOptions
          )) as UnwrapRef<ResponseFormat>;
        } catch (validationError) {
          if (responseValidationOptions.onValidationError) {
            responseValidationOptions.onValidationError(
              validationError as ValidationError[]
            );
          } else {
            throw validationError;
          }
        }
      } else {
        responseData.value = response.data;
      }
      responseData.value = response.data;
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
    updateApiInstance,
    validateAndSubmit,
    validateResponse,
    responseData,
    callbacks,
    resetForm,
  };
}
