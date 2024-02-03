import { Prop } from '@nestjs/mongoose';

export class DeleteMaterial {
  @Prop()
  id: string;
}
