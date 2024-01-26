// Define a type for the allowed operator strings
type Operator =
  | '$eq'
  | '$gt'
  | '$lt'
  | '$gte'
  | '$lte'
  | '$between'
  | '$contains'
  | '$startsWith'
  | '$endsWith';

interface FilterOption {
  field: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: any; // Replace 'any' with a more specific type if possible
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>; // Use a more specific type if you know the structure of props
  operators: Operator[];
  currentOperator?: Operator;
  defaultOperator?: Operator;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValues?: any; // Replace 'any' with a more specific type if possible
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  where: Record<string, any>; // Use a more specific type if you know the structure of where
  visible?: boolean;
  label?: string;
  includePath?: string;
  include?: Include;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bind?: Record<string, any>; // Use a more specific type if you know the structure of bind
  options?: Array<{ label: string; value: string | number | null }>;
}

interface Include {
  model: string;
  as: string;
  attributes: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  where: Record<string, any>; // Use a more specific type if you know the structure of where
}
