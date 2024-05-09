import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ autoCreate: true, autoIndex: true })
export class User {
  @Prop({ type: () => String })
  email: string;
  @Prop({ type: () => String })
  password: string;
  @Prop({ type: () => String })
  nick: string;
  @Prop({ type: () => Number })
  create_at: number;
  @Prop({ type: () => Number })
  update_at: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
