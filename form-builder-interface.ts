// Define the base interface for a form field
import { AxiosInstance } from 'axios';
import { Component } from 'vue';

interface HtmlContentItem {
  tag: string;
  attrs?: Record<string, string>;
  content?: string;
}

export interface FormField {
  fieldId: string;
  dataField: string;
  colClass: string; // Column size
  component: string | Component; // Replace with specific Vue component type as needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>; // Replace 'any' with specific type as needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showCondition?: (values: Record<string, any>) => boolean; // Optional visibility condition
  children?: FormField[];
  htmlContent?: HtmlContentItem[];
  dynamicProps?: {
    [key: string]: string; // Key is the prop name, value is the fieldId to get the value from
  };
}

interface FormCallback {
  onCanceled?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (data: any) => any | Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError?: (error: any) => Promise<never>;
  beforeSubmit?: (
    values: Record<string, unknown>
  ) => Record<string, unknown> | Promise<Record<string, unknown>>;
}

// The entire form configuration is now just an array of fields

// Define the overall form configuration interface
export interface FormConfig {
  api: () => AxiosInstance;
  formFields: FormField[];
  submitUrl: string | ((data?: Record<string, unknown>) => string);
  callbacks?: FormCallback;
}
