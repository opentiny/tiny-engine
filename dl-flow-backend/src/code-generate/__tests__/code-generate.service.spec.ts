import { Test, TestingModule } from '@nestjs/testing';
import { CodeGenerateService } from '../code-generate.service';
import { AST } from '../ast.service';

describe('CodeGenerateService', () => {
  let service: CodeGenerateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CodeGenerateService, AST],
    }).compile();

    service = module.get<CodeGenerateService>(CodeGenerateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
