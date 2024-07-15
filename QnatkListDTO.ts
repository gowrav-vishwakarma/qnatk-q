import { PropType } from 'vue';

export interface ScopeOption {
  name: string;
  params: unknown[];
}

export interface FunctionAttribute {
  fn: string;
  args?:
    | (
        | ColumnReference
        | FunctionAttribute
        | LiteralAttribute
        | string
        | number
      )[]
    | ColumnReference
    | FunctionAttribute
    | LiteralAttribute
    | string
    | number;
  as?: string;
}

export interface ColumnReference {
  col: string;
}

export interface LiteralAttribute {
  literal: string;
}

export type Attribute =
  | string
  | FunctionAttribute
  | ColumnReference
  | LiteralAttribute;

export interface ModelOptions {
  attributes?: Attribute[];
  include?: (ModelInclude | Record<string, unknown>)[];
  where?: ModelWhere;
  order?: string | string[] | [string, 'ASC' | 'DESC'][];
  limit?: number;
  offset?: number;
  subQuery?: boolean;
  scope?: false | string | ScopeOption | (string | ScopeOption)[];
  group?: string[];
}

export interface ModelInclude {
  model: string;
  attributes?: Attribute[];
  where?: ModelWhere;
  required?: boolean;
  duplicating?: boolean;
  include?: ModelInclude[];
}

export interface ModelWhere {
  [key: string]: any;
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
  $fullText?:
    | {
        table: string;
        fields: string[];
        query: string;
      }
    | {
        table: string;
        fields: string[];
        query: string;
      }[];
}

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
  attributes: Array as PropType<Attribute[]>,
  include: {
    type: [Array, Function] as PropType<
      ModelInclude[] | ((val: string) => ModelInclude[])
    >,
  },
  where: {
    type: [Function, undefined, Boolean] as PropType<
      ((val: string) => ModelWhere) | false | undefined
    >,
    default: undefined,
  },
  whereOnInitialFetch: {
    type: [Function, undefined, Boolean] as PropType<
      ((val: string) => ModelWhere) | false | undefined
    >,
    default: undefined,
  },
  limit: Number,
  subQuery: Boolean,
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
