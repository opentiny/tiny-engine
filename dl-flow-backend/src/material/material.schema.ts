import { Label, Property } from '@app/shared';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ autoCreate: true })
export class Material {
  @Prop({ type: () => Object })
  label: Label;
  @Prop({ type: () => String })
  id: string;
  @Prop({ type: () => String })
  desc: string;
  @Prop({ type: () => Boolean })
  nn: boolean;
  @Prop({ type: () => Array })
  properties: Property[];
  @Prop({ type: () => String })
  mode: string;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
