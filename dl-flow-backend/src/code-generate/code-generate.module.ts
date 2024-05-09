import { Module, OnModuleInit } from '@nestjs/common';
import { CodeGenerateService } from './code-generate.service';
import { CodeGenerateGateway } from './code-generate.gateway';
import { AST } from './ast.service';
import { CodeGenerateController } from './code-generate.controller';
import { JwtModule } from '@nestjs/jwt';
import { join } from 'path';
import { readFileSync } from 'fs';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      publicKey: readFileSync(
        join(process.cwd(), process.env.JWT_PUB_KEY ?? './keys/pub.key'),
      ).toString(),
      privateKey: readFileSync(
        join(process.cwd(), process.env.JWT_PRI_KEY ?? './keys/pri.key'),
      ).toString(),
      signOptions: {
        algorithm: process.env.JWT_SIGN_ALGORITHM ?? 'RS256',
        expiresIn: process.env.JWT_EXPIRE_IN ?? '1 day',
      },
    }),
  ],
  controllers: [CodeGenerateController],
  providers: [CodeGenerateGateway, CodeGenerateService, AST],
})
export class CodeGenerateModule implements OnModuleInit {
  onModuleInit() {
    console.log(
      join(process.cwd(), process.env.JWT_PUB_KEY ?? './keys/pub.key'),
    );
  }
}
