// FormFieldTypes.ts
import { Ref } from 'vue';

// Define a generic type parameter T for the value
export interface BaseField<T> {
  name: string;
  label: string;
  component: string;
  class?: string;
  rules?: Array<(v: T) => boolean | string>;
}

export interface InputField<T> extends BaseField<T> {
  component: 'q-input';
  type?: string; // if you want to specify 'text', 'number', etc.
  // ... other q-input specific props
}

export interface SelectField<T> extends BaseField<T> {
  component: 'q-select';
  options:
    | Array<{ label: string; value: T }>
    | Array<string>
    | Ref<Array<{ label: string; value: T }>>;
  'use-input'?: boolean;
  filterFn?: (val: string, update: () => void, abort: () => void) => void;
  // ... other q-select specific props
}

export interface RadioField<T> extends BaseField<T> {
  component: 'q-radio';
  options: Array<{ label: string; value: T }>;
  // ... other q-radio specific props
}

export interface CheckboxField<T> extends BaseField<T> {
  component: 'q-checkbox';
  // ... other q-checkbox specific props
}

export interface DateField<T> extends BaseField<T> {
  component: 'q-date';
  // ... other q-date specific props
}

// Combine all field types into a single type
export type QNATKFormField<T> =
  | InputField<T>
  | SelectField<T>
  | RadioField<T>
  | CheckboxField<T>
  | DateField<T>;
