import { Module } from '@nestjs/common';
import { LayerService } from './layer.service';
import { LayerController } from './layer.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Layer, LayerSchema } from './;ayer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Layer.name, schema: LayerSchema }]),
  ],
  controllers: [LayerController],
  providers: [LayerService],
})
export class LayerModule {}
