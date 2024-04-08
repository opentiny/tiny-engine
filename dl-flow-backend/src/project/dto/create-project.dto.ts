import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;
}
export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
