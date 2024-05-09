import { IsString } from 'class-validator';

export class DeleteLayer {
  @IsString()
  id: string;
}
