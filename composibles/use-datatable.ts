import { reactive, ref, watch } from 'vue';
import {
  ModelOptions,
  PaginationOption,
  TransformedSortOption,
} from '../QnatkListDTO';
import { exportFile, useQuasar } from 'quasar';
import { AxiosInstance } from 'axios';
import { ActionListDTO } from '../ActionDTO';

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

export function useDatatable<T>(
  api: AxiosInstance,
  baseModel: string,
  baseUrl = 'qnatk',
  transformSortBy: (sortBy: string) => string | TransformedSortOption = (
    sortBy
  ) => sortBy
) {
  // Default to no transformation)
  const data = ref<T[]>([]);
  const actions = ref<ActionListDTO>({});
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

  const callBacks = reactive({
    rowIterator: (row: T) => row,
    downloadRowIterator: (row: T) => row,
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

  const processRows = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    page: number | undefined = undefined,
    rowsPerPage: number | undefined = undefined,
    rowIterator: (row: T) => T = (row) => row,
    addSNo = true
  ) => {
    const startIndex = page && rowsPerPage ? (page - 1) * rowsPerPage : 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any, index: number) => {
      return {
        s_no: addSNo ? startIndex + index + 1 : undefined,
        ...rowIterator(item),
      };
    });
  };

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
      const response = await api.post(
        `${baseUrl}/${baseModel}/list-and-count`,
        effectiveModelOptions
      );

      data.value = response.data.rows;
      data.value = processRows(
        data.value,
        pagination.value.page,
        pagination.value.rowsPerPage,
        callBacks.rowIterator
      );
      pagination.value.rowsNumber = response.data.count;
      actions.value = response.data.actions;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      error.value =
        e.response?.data.message || e.message || 'An error occurred';
      console.log('error', e);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arrayToCSV = (array: any) => {
    const header = Object.keys(array[0]).join(',');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = array.map((obj: any) =>
      Object.values(obj)
        .map((value) => (typeof value === 'string' ? `"${value}"` : value))
        .join(',')
    );
    return [header, ...rows].join('\n');
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const downloadData = async (options?: any) => {
    loading.value = true;
    error.value = false;

    // Construct the modelOptions with pagination
    const effectiveModelOptions = {
      ...fetchOptions.value,
      sortByDescending: pagination.value.descending,
      ...options,
    };

    // Apply the transformation to the sortBy, if present
    if (pagination.value.sortBy) {
      effectiveModelOptions.sortBy = transformSortBy(pagination.value.sortBy);
    }

    try {
      const response = await api.post(
        `${baseUrl}/${baseModel}/list`,
        effectiveModelOptions
      );

      const data = processRows(
        response.data,
        undefined,
        undefined,
        callBacks.downloadRowIterator
      );

      const csvString = arrayToCSV(data);
      const status = exportFile('file.csv', csvString, {
        encoding: 'windows-1252',
        mimeType: 'text/csv;charset=windows-1252;',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      error.value =
        e.response?.data.message || e.message || 'An error occurred';
    } finally {
      loading.value = false;
    }
  };

  return {
    callBacks,
    fetchOptions,
    data,
    actions,
    pagination,
    loading,
    error,
    fetchData,
    onRequest,
    closeDialogAndReload,
    downloadData,
  };
}
