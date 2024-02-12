import { Test, TestingModule } from '@nestjs/testing';
import { AST } from '../ast.service';

describe('AST', () => {
  let service: AST;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AST],
    }).compile();
    service = module.get<AST>(AST);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('buildLayer', () => {
    const layer = service.buildLayer(
      {
        clazz: 'testClazz',
        code: `
class testClazz:
    def __init__(self):
        pass
`,
        del: false,
        id: 'id',
        label: {
          zh_CN: '',
          en_US: '',
        },
        mode: 'layer',
        properties: [],
      },
      'cell',
    );
    expect(layer).toBeDefined();
    expect(layer.name).toBe('testClazz');
  });
  describe('buildNN', () => {
    it('non properties', () => {
      const varDecl = service.buildNN(
        {
          id: 'nn',
          label: {
            zh_CN: '',
            en_US: '',
          },
          properties: [],
          desc: '',
          mode: 'nn',
          nn: true,
        },
        'cell',
      );
      expect(varDecl).toBeDefined();
      expect(varDecl.codeGen()).toBe('cell = paddle.nn.nn()');
    });
    it('has properties', () => {
      const varDecl = service.buildNN(
        {
          id: 'nn',
          label: {
            zh_CN: '',
            en_US: '',
          },
          properties: [
            {
              id: 'in_channel',
              data: 256,
              label: {
                zh_CN: 'in_channel',
                en_US: 'in_channel',
              },
              type: 'number',
              default: 256,
              enums: [],
            },
          ],
          desc: '',
          mode: 'nn',
          nn: true,
        },
        'cell',
      );
      expect(varDecl).toBeDefined();
      expect(varDecl.codeGen()).toBe('cell = paddle.nn.nn(256)');
      const varDecl2 = service.buildNN(
        {
          id: 'nn',
          label: {
            zh_CN: '',
            en_US: '',
          },
          properties: [
            {
              id: 'in_channel',
              data: 256,
              label: {
                zh_CN: 'in_channel',
                en_US: 'in_channel',
              },
              type: 'number',
              default: 256,
              enums: [],
            },
            {
              id: 'out_channel',
              data: 128,
              label: {
                zh_CN: 'in_channel',
                en_US: 'in_channel',
              },
              type: 'number',
              default: 256,
              enums: [],
            },
          ],
          desc: '',
          mode: 'nn',
          nn: true,
        },
        'cell',
      );
      expect(varDecl2).toBeDefined();
      expect(varDecl2.codeGen()).toBe('cell = paddle.nn.nn(256,128)');
    });
  });
});
