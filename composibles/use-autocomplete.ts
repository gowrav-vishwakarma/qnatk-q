// useAutocomplete.ts
import { ref, Ref } from 'vue';
import { api } from 'boot/axios';
import {
  AutocompleteFunction,
  ModelOptions,
  SelectOption,
} from '../QnatkListDTO';

export function useAutocomplete(
  baseModel: string,
  getModelOptionsFn: AutocompleteFunction<ModelOptions>,
  getFetchInitialValueOptionsFn: AutocompleteFunction<ModelOptions>,
  valueFieldName = 'id',
  labelFieldName = 'name'
) {
  const searchTerm: Ref<string> = ref('');
  const suggestions: Ref<Array<{ label: string; value: number }>> = ref([]);
  const isLoading: Ref<boolean> = ref(false);
  const selected: Ref<{
    label: string;
    value: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  } | null> = ref(null);

  async function performSearch(val: string, endpoint: string): Promise<void> {
    if (val.length < 2) {
      suggestions.value = [];
      return;
    }

    isLoading.value = true;
    try {
      const modelOptions = getModelOptionsFn(val);
      const response = await api.post<SelectOption[]>(
        `qnatk/${baseModel}${endpoint}`,
        {
          ...modelOptions,
          limit: 10,
          offset: 0,
          sortByDescending: false,
          sortBy: 'id',
        }
      );

      suggestions.value = response.data.map((item: SelectOption) => ({
        ...item,
        label: item[labelFieldName] as string,
        value: item[valueFieldName] as number,
      }));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function search(val: string): Promise<void> {
    await performSearch(val, '/list');
  }

  async function filterFn(
    val: string,
    update: () => void,
    abort: () => void
  ): Promise<void> {
    try {
      await performSearch(val, '/list');
      update();
    } catch {
      abort();
    }
  }

  async function fetchInitialValue(id: number): Promise<void> {
    if (!id) return;
    isLoading.value = true;
    try {
      const modelOptions = getFetchInitialValueOptionsFn(id.toString());
      const response = await api.post<SelectOption[]>(
        `qnatk/${baseModel}/list`,
        {
          ...modelOptions,
          limit: 10,
          offset: 0,
          sortByDescending: false,
          sortBy: 'id',
        }
      );

      if (response.data.length > 0) {
        const item = response.data[0];
        selected.value = {
          ...item,
          label: item[labelFieldName] as string,
          value: item[valueFieldName] as number,
        };
        searchTerm.value = item[labelFieldName] as string;
      } else {
        console.error('No data found for ID:', id);
        selected.value = null;
      }
    } catch (error) {
      console.error('Error fetching initial value:', error);
      selected.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    searchTerm,
    suggestions,
    isLoading,
    search,
    selected,
    filterFn,
    fetchInitialValue,
  };
}
