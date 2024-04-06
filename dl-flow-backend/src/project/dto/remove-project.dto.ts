import { IsString } from 'class-validator';

export class DeleteProjectDto {
  @IsString()
  project_id: string;
}
