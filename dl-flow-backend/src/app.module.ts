import { Module } from '@nestjs/common';
import { LayerModule } from './layer/layer.module';
import { DbModule } from '@app/database';
import { MaterialModule } from './material/material.module';
import { CodeGenerateModule } from './code-generate/code-generate.module';

@Module({
  imports: [DbModule, LayerModule, MaterialModule, CodeGenerateModule],
})
export class AppModule {}
