import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsObject,
  IsArray,
  IsOptional,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'isStringOrObject', async: false })
export class IsStringOrObjectConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown, args: ValidationArguments) {
    return (
      typeof value === 'string' || (typeof value === 'object' && value !== null)
    );
  }

  defaultMessage(args: ValidationArguments) {
    return 'icon must be a string or an object';
  }
}

export function IsStringOrObject(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStringOrObject',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStringOrObjectConstraint,
    });
  };
}

class UIOptionsDTO {
  @IsString()
  mode!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LayoutRow)
  layout?: LayoutRow[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FieldSchema)
  fields?: Record<string, FieldSchema>;

  @IsNotEmpty()
  title!: string;

  @IsNotEmpty()
  message!: string;

  @IsNotEmpty()
  okLabel!: string;

  @IsNotEmpty()
  cancelLabel!: string;
}

class FieldSchema {
  @IsString()
  type!: string;

  @IsString()
  label!: string;

  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue: any;

  @IsOptional()
  @IsArray()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validation!: any[]; // Define validation rules here

  // ... add more field properties if needed
}

class LayoutColumn {
  @IsString()
  fieldKey!: string;

  @IsOptional()
  width?: number;

  @IsOptional()
  @IsString()
  class?: string;
}

class LayoutRow {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LayoutColumn)
  columns!: LayoutColumn[];
}

export class ActionDTO {
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  baseModel?: string;

  @IsStringOrObject({ message: 'label must be a string or an object' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  label?: string | Record<string, any>;

  @IsOptional()
  @IsString()
  tooltip?: string;

  @IsStringOrObject({ message: 'icon must be a string or an object' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon!: string | Record<string, any>;

  @IsStringOrObject({ message: 'icon color must be a string or an object' })
  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  iconColor?: string | Record<string, any>;

  @IsNotEmpty()
  description!: string;

  @IsNotEmpty()
  mode!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => UIOptionsDTO)
  ui!: UIOptionsDTO;

  @IsString()
  @IsOptional()
  loadBy?:
    | string
    | {
        paramField: string;
        tableField: string;
      };

  @IsArray()
  @IsString({ each: true })
  roles!: string[];

  @IsOptional()
  @IsObject()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  condition?: Record<string, any>;

  @IsOptional()
  @IsObject()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  returnModel: Record<string, any> | boolean = false;
}

export type ActionListDTO = Record<string, ActionDTO>;
