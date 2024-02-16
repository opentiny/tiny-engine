import { Module } from '@nestjs/common';
import { CodeGenerateService } from './code-generate.service';
import { CodeGenerateGateway } from './code-generate.gateway';
import { AST } from './ast.service';
import { CodeGenerateController } from './code-generate.controller';

@Module({
  controllers: [CodeGenerateController],
  providers: [CodeGenerateGateway, CodeGenerateService, AST],
})
export class CodeGenerateModule {}
