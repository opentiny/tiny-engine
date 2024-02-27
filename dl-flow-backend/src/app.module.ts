import { Module, OnModuleInit } from '@nestjs/common';
import { LayerModule } from './layer/layer.module';
import { DbModule } from '@app/database';
import { MaterialModule } from './material/material.module';
import { CodeGenerateModule } from './code-generate/code-generate.module';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    DbModule,
    LayerModule,
    MaterialModule,
    CodeGenerateModule,
    UserModule,
    JwtModule.register({
      global: true,
      publicKey: process.env.JWT_PUB_KEY ?? './static/pub.key',
      privateKey: process.env.JWT_PRI_KEY ?? './static/pri.key',
      signOptions: {
        algorithm: process.env.JWT_SIGN_ALGORITHM,
        expiresIn: process.env.JWT_EXPIRE_IN ?? '24h',
      },
    }),
  ],
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
