import { Module } from '@nestjs/common';
import { CodeGenerateService } from './code-generate.service';
import { CodeGenerateGateway } from './code-generate.gateway';
import { AST } from './ast.service';

@Module({
  providers: [CodeGenerateGateway, CodeGenerateService, AST],
})
export class CodeGenerateModule {}
