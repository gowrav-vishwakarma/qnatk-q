import { ref, watch } from 'vue';
import { ModelOptions, PaginationOption, TransformedSortOption } from '../QnatkListDTO';
import { useQuasar } from 'quasar';
import { AxiosInstance } from 'axios';

interface RequestProps {
  pagination: {
    sortBy: string;
    descending: boolean;
    page: number;
    rowsPerPage: number;
    rowsNumber: number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCellValue: (col: any, row: any) => any;
}

export function useDatatable<T>(api: AxiosInstance, baseModel: string, baseUrl = 'qnatk', transformSortBy: (sortBy: string) => string | TransformedSortOption = (sortBy) => sortBy) {
  // Default to no transformation)
  const data = ref<T[]>([]);
  const actions = ref([]);
  const loading = ref(false);
  const error = ref(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchOptions = ref<ModelOptions>({} as ModelOptions);
  const pagination = ref<PaginationOption>({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'id',
    descending: true,
    rowsNumber: 0,
  });

  const $q = useQuasar();

  // Centralized error handling with a watcher
  watch(error, (err) => {
    if (err) {
      $q.notify({
        color: 'negative',
        message: err as unknown as string,
        icon: 'report_problem',
      });
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchData = async (options?: any) => {
    loading.value = true;
    error.value = false;

    // Construct the modelOptions with pagination
    const effectiveModelOptions = {
      ...fetchOptions.value,
      limit: pagination.value.rowsPerPage,
      offset: (pagination.value.page - 1) * pagination.value.rowsPerPage,
      sortByDescending: pagination.value.descending,
      ...options,
    };

    // Apply the transformation to the sortBy, if present
    if (pagination.value.sortBy) {
      effectiveModelOptions.sortBy = transformSortBy(pagination.value.sortBy);
    }

    try {
      const response = await api.post(`${baseUrl}/${baseModel}/list-and-count`, effectiveModelOptions);

      data.value = response.data.rows;
      pagination.value.rowsNumber = response.data.count;
      actions.value = response.data.actions;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      error.value = e.response?.data.message || e.message || 'An error occurred';
    } finally {
      loading.value = false;
    }
  };

  const onRequest = (props: RequestProps): void => {
    pagination.value = props.pagination;
    fetchData().then((r) => r);
  };

  const closeDialogAndReload = () => {
    pagination.value.page = 1;
    fetchData();
    return false;
  };

  return {
    fetchOptions,
    data,
    actions,
    pagination,
    loading,
    error,
    fetchData,
    onRequest,
    closeDialogAndReload,
  };
}
