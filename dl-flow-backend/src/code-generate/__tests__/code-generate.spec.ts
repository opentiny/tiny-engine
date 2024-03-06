import { Test, TestingModule } from '@nestjs/testing';
import { CodeGenerateService } from '../code-generate.service';
import { Cell, Edge } from '../code-generate.schema';
import { readFileSync } from 'fs';

const groupNestTestCase = JSON.parse(
  readFileSync('./group-nest-test-case.json').toString(),
);

describe('code generate', () => {
  let service: CodeGenerateService;
  beforeEach(async () => {
    const moudle: TestingModule = await Test.createTestingModule({
      providers: [CodeGenerateService],
    }).compile();
    service = moudle.get<CodeGenerateService>(CodeGenerateService);
  });
  it('standardizationEdge', () => {
    expect(
      service.standardizationEdge(
        groupNestTestCase.payload.edges as unknown as Edge[],
        service.standardizationNode(groupNestTestCase.payload.cells),
      ),
    ).toBeDefined();
    console.log(
      service.standardizationEdge(
        groupNestTestCase.payload.edges as unknown as Edge[],
        service.standardizationNode(groupNestTestCase.payload.cells),
      ),
    );
  });
  it('sequencingNode', () => {
    const nodes = service.standardizationNode(
      service.extract(
        groupNestTestCase.payload.cells as unknown as Cell[],
        (cell) => cell.shape.includes('node'),
      ),
    );
    const edges = service.standardizationEdge(
      groupNestTestCase.payload.edges as unknown as Edge[],
      service.standardizationNode(groupNestTestCase.payload.cells),
    );
    const { start, end } = groupNestTestCase.meta;
    expect(service.sequencingNode(nodes, edges, start, end)).toBeDefined();
  });
});
