import { ref, Ref } from 'vue';
import { ModelOptions } from 'components/qnatk/QnatkListDTO';
import axios, { AxiosInstance } from 'axios';

export function useFind<T>(api: AxiosInstance, baseUrl = 'qnatk') {
  // Use `T | null` to indicate that data may hold a single object or null.
  const data: Ref<T | T[] | null> = ref(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const findAll = async (baseModel: string, findOptions: ModelOptions) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post(`${baseUrl}/${baseModel}/list`, {
        ...findOptions,
        limit: findOptions.limit ?? -1,
        offset: findOptions.offset ?? 0,
      });
      // When fetching all, we should expect an array, so we cast accordingly.
      data.value = response.data as T[];
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        error.value = e.response?.data?.message || e.message || 'An error occurred';
      } else {
        error.value = e as string;
      }
    } finally {
      loading.value = false;
    }
  };

  const findOne = async (baseModel: string, findOptions: ModelOptions) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post(`${baseUrl}/${baseModel}/list`, {
        ...findOptions,
        limit: 1,
        offset: findOptions.offset ?? 0,
      });
      // When fetching one, we should expect a single object, so we cast accordingly.
      // Note that we also make sure to handle the possibility of an empty array.
      const result = response.data as T[];
      data.value = result.length > 0 ? result[0] : null;
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        error.value = e.response?.data?.message || e.message || 'An error occurred';
      } else {
        error.value = e as string;
      }
    } finally {
      loading.value = false;
    }
  };

  return {
    data,
    loading,
    error,
    findAll,
    findOne,
  };
}
