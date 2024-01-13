import { Ref, ref } from 'vue';
import axios, { AxiosInstance } from 'axios';
import { exportFile } from 'quasar';

//eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModelOptions = any; // Replace with your actual type

export function useFind(api: AxiosInstance, baseUrl: string) {
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const findAll = async <T = any>(
    baseModel: string,
    findOptions: ModelOptions
  ) => {
    const data: Ref<T[] | null> = ref(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    loading.value = true;
    try {
      const response = await api.post(`${baseUrl}/${baseModel}/list`, {
        ...findOptions,
        limit: findOptions.limit ?? undefined,
        offset: findOptions.offset ?? undefined,
      });
      data.value = response.data as T[];
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        error.value =
          e.response?.data?.message || e.message || 'An error occurred';
      } else {
        error.value = e as string;
      }
    } finally {
      loading.value = false;
    }

    return { data, error, loading };
  };

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const findOne = async <T = any>(
    baseModel: string,
    findOptions: ModelOptions
  ) => {
    const data: Ref<T | null> = ref(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    loading.value = true;
    try {
      const response = await api.post(`${baseUrl}/${baseModel}/list`, {
        ...findOptions,
        limit: 1,
        offset: findOptions.offset ?? 0,
      });
      data.value = response.data[0] as T;
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        error.value =
          e.response?.data?.message || e.message || 'An error occurred';
      } else {
        error.value = e as string;
      }
    } finally {
      loading.value = false;
    }

    return { data, error, loading };
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

  const downloadData = async (baseModel: string, findOptions: ModelOptions) => {
    const downloading = ref(false);
    const error = ref<string | null>(null);
    const {
      data,
      error: findError,
      loading,
    } = await findAll(baseModel, findOptions);
    if (!data.value) {
      error.value = findError.value;
      return;
    }
    const csvString = arrayToCSV(data.value);
    const status = exportFile('file.csv', csvString, {
      encoding: 'windows-1252',
      mimeType: 'text/csv;charset=windows-1252;',
    });
  };

  return { findAll, findOne };
}
