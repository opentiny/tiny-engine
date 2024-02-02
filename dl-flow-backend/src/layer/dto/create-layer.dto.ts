import { IsProperties, Label, Property } from '@app/shared';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateLayerDto {
  @IsOptional()
  @IsString({ message: 'Id should be string' })
  id?: string;
  @IsObject()
  label: Label;
  @IsString()
  code: string;
  @IsString()
  @IsNotEmpty()
  clazz: string;
  @IsProperties({
    message: 'properties should be array, please check field',
  })
  properties: Property[];
}
