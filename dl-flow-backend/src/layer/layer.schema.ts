import { Label, Property } from '@app/shared';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ autoCreate: true })
export class Layer {
  @Prop()
  id: string;
  @Prop({ type: () => Object })
  label: Label;
  @Prop()
  code: string;
  @Prop()
  clazz: string;
  @Prop({ type: () => Array })
  properties: Property[];
  @Prop({ type: () => Boolean })
  del: boolean;
  @Prop({ type: () => String })
  mode: string;
}

export const LayerSchema = SchemaFactory.createForClass(Layer);
