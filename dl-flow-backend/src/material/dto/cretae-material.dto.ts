import { IsProperties, Label, Property } from '@app/shared';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export class CretaeMaterial {
  @IsString()
  id: string;

  @IsString()
  @IsOptional()
  desc: string;

  @IsBoolean()
  @IsOptional()
  nn: boolean;

  @IsString()
  mode: string;

  @IsObject()
  label: Label;

  @IsProperties()
  properties: Property[];
}
