import { ref } from 'vue';
import { api } from 'boot/axios';
import { ModelOptions } from 'components/qnatk/QnatkListDTO';

interface Pagination {
  page: number;
  rowsPerPage: number;
  sortBy: string;
  descending: boolean;
  rowsNumber: number;
}

export function useFetchImmediate<T>(baseUrl = 'qnatk') {
  const data = ref<T[]>([]);
  const loading = ref(false);
  const error = ref(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pagination = ref<Pagination>({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'id',
    descending: false,
    rowsNumber: 0,
  });

  const fetchImmediateData = async (
    baseModel: string,
    immediateOptions: ModelOptions
  ) => {
    loading.value = true;
    error.value = false;
    try {
      const response = await api.post(
        baseUrl + '/' + baseModel + '/list',
        immediateOptions
      );
      // Handle the response as needed
      // For example, you might want to return the data or set it to a local variable
      return response.data; // or set to a local reactive state
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      error.value = e.response.data.message;
      // Handle the error, e.g., by showing a notification
    } finally {
      loading.value = false;
    }
  };

  return {
    data,
    pagination,
    loading,
    error,
    fetchImmediateData,
  };
}
