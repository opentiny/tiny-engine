import { Module, OnModuleInit } from '@nestjs/common';
import { LayerModule } from './layer/layer.module';
import { DbModule } from '@app/database';
import { MaterialModule } from './material/material.module';
import { CodeGenerateModule } from './code-generate/code-generate.module';
import { existsSync, mkdirSync, readFileSync } from 'fs';
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
      publicKey: readFileSync(
        join(process.cwd(), process.env.JWT_PUB_KEY ?? './keys/pub.key'),
      ),
      privateKey: readFileSync(
        join(process.cwd(), process.env.JWT_PRI_KEY ?? './keys/pri.key'),
      ),
      signOptions: {
        algorithm: process.env.JWT_SIGN_ALGORITHM ?? 'RS256',
        expiresIn: process.env.JWT_EXPIRE_IN ?? '1 day',
      },
    }),
  ],
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    console.log(process.env.JWT_SIGN_ALGORITHM);
    const root = process.cwd();
    const publicPath = join(root, 'public');
    if (!existsSync(publicPath)) {
      mkdirSync(publicPath);
    }
  }
}
