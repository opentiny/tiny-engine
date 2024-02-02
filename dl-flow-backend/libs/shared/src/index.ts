import { ValidationOptions, registerDecorator } from 'class-validator';

export type Enum = {
  id: string;
  label: string;
  value: string;
  default?: boolean;
};

export type Label = {
  zh_CN: string;
  en_US: string;
};

export type Property = {
  id: string;
  label: Label;
  type: string;
  default: string | number | null | boolean;
  enums: Enum[];
};

export const isProperty = (object: unknown | unknown[]) => {
  if (Array.isArray(object)) {
    return false;
  }
  if (object instanceof Object) {
    const maybeProperty: Partial<Property> = object;
    const keys = ['id', 'label', 'type', 'default'];
    const maybePropertyKeys = Object.keys(maybeProperty);
    if (!maybePropertyKeys.length) {
      return false;
    }
    return maybePropertyKeys.every((key) => keys.includes(key));
  }
  return false;
};

export function IsProperty(validationOptions?: ValidationOptions) {
  return function (object: Partial<Property>, propertyName: string) {
    registerDecorator({
      name: 'isProperty',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return isProperty(value);
        },
      },
    });
  };
}

export function IsProperties(validationOptions?: ValidationOptions) {
  return function (object: Partial<Property>, propertyName: string) {
    registerDecorator({
      name: 'IsProperties',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown[]) {
          if (!value.length) {
            return false;
          }
          return value.every((v) => isProperty(v));
        },
      },
    });
  };
}
