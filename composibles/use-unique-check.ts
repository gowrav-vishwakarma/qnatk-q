// useUniqueCheck.ts
import { ref } from 'vue';
import { api } from 'boot/axios';
import { ModelOptions } from '../QnatkListDTO';

export function useUniqueCheck(
  baseModel: string,
  modelOptionsFn: () => ModelOptions,
  errorMessageFormatter: (value: Record<string, unknown>) => string = () =>
    'Value not unique',
  baseUrl = 'qnatk'
) {
  const isUnique = ref(true);
  const errorMessage = ref('');

  const triggerCheckUniqueness = async ($event: unknown) => {
    console.log('triggerCheckUniqueness', $event);
    if (!$event) {
      errorMessage.value = '';
      return;
    }
    try {
      const modelOptions = modelOptionsFn();
      errorMessage.value = 'Checking ...';
      const response = await api.post(`${baseUrl}/${baseModel}/list`, {
        ...modelOptions,
        limit: 1,
      });
      // Here you might expect a specific response structure indicating uniqueness
      isUnique.value = response.data.length === 0;
      errorMessage.value = isUnique.value
        ? ''
        : errorMessageFormatter(response.data[0]);
    } catch (e) {
      errorMessage.value = 'Error checking uniqueness';
    }
  };

  return {
    isUnique,
    errorMessage,
    triggerCheckUniqueness,
  };
}
