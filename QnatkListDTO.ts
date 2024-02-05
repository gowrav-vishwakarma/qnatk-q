// export interface QnatkListDTO {
//   modelOptions: ModelOptions;
//   pagination: Pagination;
//   customOptions?: Record<string, unknown>; // You can add any additional custom options here
// }

import { PropType } from 'vue';

export interface ModelOptions {
  attributes?: (string | Record<string, unknown>)[]; // You can specify attributes as an array or an object
  include?: (ModelInclude | Record<string, unknown>)[]; // Include can be an array of Include objects or an object
  where?: Record<string, unknown>; // Define conditions here
  order?: string | string[]; // Define sorting order here
  limit?: number;
  offset?: number;
}

interface ModelInclude {
  model: string;
  attributes?: (string | Record<string, unknown>)[];
  where?: Record<string, unknown>;
  required?: boolean;
  duplicating?: boolean;
}

export interface ModelWhere {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // The 'any' type can be replaced with a more specific type or union of types as needed
  $and?: ModelWhere | ModelWhere[];
  $or?: ModelWhere | ModelWhere[];
  $like?: string;
  $notLike?: string;
  $iLike?: string;
  $notILike?: string;
  $gt?: number;
  $gte?: number;
  $lt?: number;
  $lte?: number;
  $ne?: string | number;
  $eq?: string | number;
  $in?: Array<string | number>;
  $notIn?: Array<string | number>;
  $between?: [number, number];
  $notBetween?: [number, number];
  $overlap?: [number, number];
  // Add other operators as needed
}

// You may also want to define a specific type for the value of $like, $gt, etc., if you want to restrict it to certain types.

export interface PaginationOption {
  page: number;
  rowsPerPage: number;
  sortBy: string;
  descending: boolean;
  rowsNumber: number;
}

export type TransformedSortOption = [
  {
    model: string;
    as: string;
  },
  string
];

export const autoCompletePropTypes = {
  modelValue: [Number, Object, null] as PropType<
    number | Record<string, unknown> | null
  >,
  label: {
    type: String,
  },
  baseModel: {
    type: String,
    required: true,
  },
  attributes: Array as PropType<string[]>,
  include: {
    type: [Array, Function] as PropType<
      ModelInclude[] | ((val: string) => ModelInclude[])
    >,
  },
  where: {
    type: [Function, undefined, Boolean] as PropType<
      ((val: string) => ModelWhere) | false | undefined
    >,
    default: undefined, // Setting default as undefined
  },
  whereOnInitialFetch: {
    type: [Function, undefined, Boolean] as PropType<
      ((val: string) => ModelWhere) | false | undefined
    >,
    default: undefined, // Setting default as undefined
  },
  limit: Number,
  getModelOptionsFn: Function as PropType<(val: string) => ModelOptions>,
  getFetchInitialValueOptionsFn: Function as PropType<
    (id: string) => ModelOptions
  >,
  valueFieldName: {
    type: String,
    default: 'id',
  },
  labelFieldName: {
    type: String,
    default: 'name',
  },
  error: Boolean,
  errorMessage: String,
  placeholder: String,
};

export interface SelectOption {
  id: number;
  name: string;
  [key: string]: unknown;
}

export interface AutocompleteFunction<T> {
  (val: string): T;
}
