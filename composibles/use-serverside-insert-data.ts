import { ref } from 'vue';
import { api } from 'boot/axios';
import { QNATKFormField } from '../form-field-types';

export function useInsertData<T>(
  baseModel: string,
  addFields?: QNATKFormField<string | number>[], // Add this parameter to accept field definitions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userTransformFn?: (data: T) => any,
  baseUrl = 'qnatk'
) {
  const inserting = ref(false);
  const error = ref(false);

  // Define a default transform function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultTransform = (data: any) => {
    const transformedData = { ...data };

    // Use the addFields definitions to apply transformations
    addFields?.forEach((field) => {
      if (
        field.component === 'q-select' &&
        data[field.name]?.value !== undefined
      ) {
        transformedData[field.name] = data[field.name].value;
      }
      // Add more conditions for other field types if needed
    });

    return transformedData;
  };

  const transformFn = userTransformFn || defaultTransform;

  const insertData = async (newData: T) => {
    inserting.value = true;
    error.value = false;

    const transformedData = transformFn(newData); // Use the transform function

    try {
      await api.post(`${baseUrl}/${baseModel}/add`, transformedData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      error.value = e.response.data.message;
    } finally {
      inserting.value = false;
    }
  };

  return {
    inserting,
    error,
    insertData,
  };
}
