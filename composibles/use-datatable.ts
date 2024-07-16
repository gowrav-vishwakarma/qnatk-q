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
  baseModelDefault: string,
  baseUrl = 'qnatk',
  transformSortBy: (sortBy: string) => string | TransformedSortOption = (
    sortBy
  ) => sortBy,
  dpp = 1000
) {
  // Default to no transformation)
  const data = ref<T[]>([]);
  const responseData = ref<T[]>([]);
  const actions = ref<ActionListDTO>({});
  const loading = ref(false);
  const error = ref(false);
  const baseModel = ref(baseModelDefault);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchOptions = ref<ModelOptions>({} as ModelOptions);
  const pagination = ref<PaginationOption>({
    page: 1,
    rowsPerPage: 10,
    sortBy: 'id',
    descending: true,
    rowsNumber: 0,
  });

  const lacHookName = ref('');

  const callBacks = reactive({
    rowIterator: (row: T) => row,
    downloadRowIterator: null as ((row: T) => T) | null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    aclCan: (actionName: string, baseModel: string): boolean => true, // default implementation
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

  const defaultDownloadRowIterator = (row: T) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flattenObject = (obj: any, parentKey = '', res: any = {}) => {
      for (const [key, value] of Object.entries(obj)) {
        const newKey = parentKey ? `${parentKey}_${key}` : key;

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flattenObject(value, newKey, res);
        } else if (Array.isArray(value)) {
          res[newKey + '_count'] = value.length;
        } else {
          res[newKey] = value;
        }
      }
      return res;
    };
    return flattenObject(row);
  };

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
        `${baseUrl}/${baseModel.value}/list-and-count` +
          (lacHookName.value ? '/' + lacHookName.value : ''),
        effectiveModelOptions
      );

      data.value = response.data.rows;
      data.value = processRows(
        data.value,
        pagination.value.page,
        pagination.value.rowsPerPage,
        callBacks.rowIterator
      );
      responseData.value = response.data;
      pagination.value.rowsNumber = Array.isArray(response.data.count)
        ? response.data.count.length
        : response.data.count;
      const filteredActions: ActionListDTO = {};
      Object.entries(response.data.actions as ActionListDTO).forEach(
        ([key, action]) => {
          if (callBacks.aclCan(key, baseModel.value)) {
            filteredActions[key] = action;
          }
        }
      );
      actions.value = filteredActions;
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
      const limit = dpp;
      let offset = 0;
      let hasMoreData = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataArray: Record<string, any>[] = [];
      console.log('starting fetch iterator :');
      while (hasMoreData) {
        console.log('fetching offset,limit :', offset, limit);
        const response = await api.post(`${baseUrl}/${baseModel.value}/list`, {
          ...effectiveModelOptions,
          limit: limit,
          offset: offset,
        });
        offset += limit;
        if (response.data && response.data.length) {
          dataArray.push(...response.data);
          if (response.data.length < limit) {
            hasMoreData = false;
          }
        } else {
          hasMoreData = false;
        }
      }

      const data = processRows(
        dataArray,
        undefined,
        undefined,
        callBacks.downloadRowIterator || defaultDownloadRowIterator
      );

      const csvString = arrayToCSV(data);
      const status = exportFile('file.csv', csvString, {
        encoding: 'windows-1252',
        mimeType: 'text/csv;charset=windows-1252;',
      });

      console.log('status', status);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      error.value =
        e.response?.data.message || e.message || 'An error occurred';
    } finally {
      loading.value = false;
    }
  };

  const changeBaseModel = (newBaseModel: string) => {
    baseModel.value = newBaseModel;
  };

  return {
    callBacks,
    fetchOptions,
    data,
    responseData,
    actions,
    pagination,
    loading,
    error,
    fetchData,
    onRequest,
    closeDialogAndReload,
    downloadData,
    lacHookName,
    changeBaseModel,
  };
}
