import { Module } from '@nestjs/common';
import { LayerModule } from './layer/layer.module';
import { DbModule } from '@app/database';

@Module({
  imports: [DbModule, LayerModule],
})
export class AppModule {}
