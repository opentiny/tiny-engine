import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { User } from '../../user/user.schema';

@Schema({ autoCreate: true })
export class Project {
  @Prop({ type: () => Number })
  projectId: number;
  @Prop({ type: () => String })
  name: string;
  @Prop({ type: () => String })
  author: string;
  @Prop({ type: () => Number })
  createAt: number;
  @Prop({ type: () => Boolean })
  removed: boolean;
  @Prop({ type: () => Object })
  data: Record<string, any>;
  @Prop({ type: () => Object })
  graphData: Record<string, any>;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
