import { Module } from '@nestjs/common';
import { LayerModule } from './layer/layer.module';
import { DbModule } from '@app/database';
import { MaterialModule } from './material/material.module';

@Module({
  imports: [DbModule, LayerModule, MaterialModule],
})
export class AppModule {}
