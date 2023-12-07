import { ref } from 'vue';
import { api } from 'boot/axios';
import { QNATKFormField } from '../form-field-types';

export function useEditData<T>(
  baseModel: string,
  editFields?: QNATKFormField<string | number>[],
  baseUrl = 'qnatk'
) {
  const editing = ref(false);
  const error = ref(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultTransform = (data: any) => {
    const transformedData = { ...data };

    editFields?.forEach((field) => {
      if (
        field.component === 'q-select' &&
        data[field.name]?.value !== undefined
      ) {
        transformedData[field.name] = data[field.name].value;
      }
    });

    return transformedData;
  };

  const editData = async (id: number, newData: T) => {
    console.log(id, newData);
    editing.value = true;
    error.value = false;

    const transformedData = defaultTransform(newData);

    try {
      await api.put(`${baseUrl}/${baseModel}/${id}`, transformedData);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      error.value = e.response.data.message;
    } finally {
      editing.value = false;
    }
  };

  return {
    editing,
    error,
    editData,
  };
}
