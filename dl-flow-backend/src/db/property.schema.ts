import { Prop } from '@typegoose/typegoose';

export interface IEnum {
  id: string;
  label: string;
  value: string;
  default :boolean;
}
export interface IProperty {
  order: number;
  id: string;
  label: {
    zh_CN: string;
    en_US: string;
  }
  type: string;
  default: 'string' | 'number' | 'null' | 'boolean';
  enums: IEnum[]
}

export class Property implements IProperty {
  @Prop()
  order: number;

  @Prop()
  id: string;

  @Prop()
  label: { zh_CN: string; en_US: string; };

  @Prop()
  type: string;

  @Prop()
  default: 'string' | 'number' | 'boolean' | 'null';

  @Prop()
  enums: IEnum[];

}