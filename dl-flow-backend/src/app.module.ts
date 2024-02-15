import { Module, OnModuleInit } from '@nestjs/common';
import { LayerModule } from './layer/layer.module';
import { DbModule } from '@app/database';
import { MaterialModule } from './material/material.module';
import { CodeGenerateModule } from './code-generate/code-generate.module';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Module({
  imports: [DbModule, LayerModule, MaterialModule, CodeGenerateModule],
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    const root = process.cwd();
    const publicPath = join(root, 'public');
    if (!existsSync(publicPath)) {
      mkdirSync(publicPath);
    }
  }
}
