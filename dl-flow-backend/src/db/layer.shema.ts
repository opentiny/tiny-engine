import { Prop, getModelForClass } from '@typegoose/typegoose';
import { Property } from './property.schema';
export class Layer {
    @Prop({ type: () => String })
    id: String;

    @Prop({ type: () => Object })
    label: {
        zh_CN: String,
        en_US: String
    };

    @Prop({ type: () => String })
    code: String;

    @Prop({ type: () => Object })
    codeAst: Object;

    @Prop({ type: () => String })
    clazz: String;

    @Prop({ type: () => Array })
    properties: Property[];
}
export const LayerModel = getModelForClass(Layer);