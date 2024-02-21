import { Test, TestingModule } from '@nestjs/testing';
import { AST } from '../ast.service';
import { Material } from '../../material/material.schema';

describe('AST', () => {
  let service: AST;
  const layer = {
    code: `
class Layer:
    def __init__(self,x):
      pass
`,
    clazz: 'Layer',
    id: 'layer-1',
    label: {
      zh_CN: '',
      en_US: '',
    },
    properties: [],
    del: false,
    mode: 'layer',
  };
  const buildNode = (total: number) => {
    const arr = [];
    for (let i = 1; i <= total; i++) {
      arr.push({
        id: `node-${i}`,
        shape: 'dag-node',
        position: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
        attrs: {},
        zIndex: 0,
        data: {
          mode: 'nn',
          id: 'Conv1d',
          properties: [],
        } as any,
      });
    }
    return arr;
  };
  const buildLayer = (total: number) => {
    const arr = [];
    for (let i = 1; i <= total; i++) {
      arr.push({
        id: `layer-${i}`,
        shape: 'dag-node',
        label: {
          zh_CN: '',
          en_US: '',
        },
        data: {
          code: `
class Layer${i}:
  def __init__(self,x):
    pass
          `,
          clazz: `Layer${i}`,
          properties: [{ id: 'x', data: 1 }],
          del: false,
          mode: 'layer',
        },
      });
    }
    return arr;
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AST],
    }).compile();
    service = module.get<AST>(AST);
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('build', () => {
    it('just cell', () => {
      const ast = service.build([...buildNode(100)]);
      expect(ast.children.length).toBe(100);
      expect(ast.codeGen()).not.toContain('undefined');
    });
    it('just layer', () => {
      const ast = service.build([...buildLayer(100)]);
      expect(ast.codeGen()).not.toContain('undefined');
    });
    it('group', () => {
      const ast = service.build([
        {
          children: [
            {
              id: 'node-1',
              shape: 'dag-node',
              position: {
                x: 0,
                y: 0,
              },
              size: {
                width: 0,
                height: 0,
              },
              attrs: {},
              zIndex: 0,
              data: {
                id: 'Conv1D',
                mode: 'nn',
                properties: [{ id: 'p', type: 'number', data: 123 } as any],
              } as any,
            },
            {
              shape: 'dag-node',
              id: 'layer',
              data: layer,
            } as any,
          ],
          id: 'group',
          shape: 'group-node',
          position: {
            x: 0,
            y: 0,
          },
          size: {
            width: 0,
            height: 0,
          },
          attrs: undefined,
          zIndex: 0,
          data: {} as any,
        },
      ]);
      expect(ast.codeGen()).toContain('group = paddle.concat(x=[node1,layer]');
    });
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
  it('buildLayer', () => {
    const ast = service.buildLayer(layer);
    expect(ast.code).toBe(layer.code);
    expect(ast.codeGen()).toBe(layer.code);
  });
  describe('buildGroup', () => {
    describe('just cell', () => {
      it('non nest', () => {
        const ast = service.buildGroup({
          children: [
            {
              id: 'node-1',
              shape: 'dag-node',
              position: {
                x: 0,
                y: 0,
              },
              size: {
                width: 0,
                height: 0,
              },
              attrs: {},
              zIndex: 0,
              data: {
                id: 'Conv1D',
                mode: 'nn',
                properties: [{ id: 'p', type: 'number', data: 123 } as any],
              } as any,
            },
            {
              id: 'node-2',
              shape: 'dag-node',
              position: {
                x: 0,
                y: 0,
              },
              size: {
                width: 0,
                height: 0,
              },
              attrs: {},
              zIndex: 0,
              data: {
                id: 'Conv1D',
                mode: 'nn',
                properties: [{ id: 'p', type: 'string', data: '123' } as any],
              } as any,
            },
          ],
          id: 'group',
          shape: 'group-node',
          position: {
            x: 0,
            y: 0,
          },
          size: {
            width: 0,
            height: 0,
          },
          attrs: undefined,
          zIndex: 0,
          data: new Material(),
        });
        expect(ast.codeGen()).toBeDefined();
        expect(ast.codeGen()).toBe(`node1 = paddle.nn.Conv1D(123)
node2 = paddle.nn.Conv1D(123)
group = paddle.concat(x=[node1,node2])`);
      });
      it('has nest', () => {
        const ast = service.buildGroup({
          children: [
            {
              children: [
                {
                  id: 'node-1',
                  shape: 'dag-node',
                  position: {
                    x: 0,
                    y: 0,
                  },
                  size: {
                    width: 0,
                    height: 0,
                  },
                  attrs: {},
                  zIndex: 0,
                  data: {
                    id: 'Conv1D',
                    mode: 'nn',
                    properties: [{ id: 'p', type: 'number', data: 123 } as any],
                  } as any,
                },
                {
                  id: 'node-2',
                  shape: 'dag-node',
                  position: {
                    x: 0,
                    y: 0,
                  },
                  size: {
                    width: 0,
                    height: 0,
                  },
                  attrs: {},
                  zIndex: 0,
                  data: {
                    id: 'Conv1D',
                    mode: 'nn',
                    properties: [
                      { id: 'p', type: 'string', data: '123' } as any,
                    ],
                  } as any,
                },
                {
                  children: [
                    {
                      id: 'node-3',
                      shape: 'dag-node',
                      position: {
                        x: 0,
                        y: 0,
                      },
                      size: {
                        width: 0,
                        height: 0,
                      },
                      attrs: {},
                      zIndex: 0,
                      data: {
                        id: 'Conv1D',
                        mode: 'nn',
                        properties: [
                          { id: 'p', type: 'number', data: 123 } as any,
                        ],
                      } as any,
                    },
                    {
                      id: 'node-4',
                      shape: 'dag-node',
                      position: {
                        x: 0,
                        y: 0,
                      },
                      size: {
                        width: 0,
                        height: 0,
                      },
                      attrs: {},
                      zIndex: 0,
                      data: {
                        id: 'Conv1D',
                        mode: 'nn',
                        properties: [
                          { id: 'p', type: 'string', data: '123' } as any,
                        ],
                      } as any,
                    },
                  ],
                  id: 'group-2',
                  shape: 'group-node',
                  position: {
                    x: 0,
                    y: 0,
                  },
                  size: {
                    width: 0,
                    height: 0,
                  },
                  attrs: undefined,
                  zIndex: 0,
                  data: new Material(),
                },
              ],
              id: 'group-3',
              shape: 'group-node',
              position: {
                x: 0,
                y: 0,
              },
              size: {
                width: 0,
                height: 0,
              },
              attrs: undefined,
              zIndex: 0,
              data: new Material(),
            },
            {
              id: 'node-5',
              shape: 'dag-node',
              position: {
                x: 0,
                y: 0,
              },
              size: {
                width: 0,
                height: 0,
              },
              attrs: {},
              zIndex: 0,
              data: {
                id: 'Conv1D',
                mode: 'nn',
                properties: [{ id: 'p', type: 'number', data: 123 } as any],
              } as any,
            },
            {
              id: 'node-6',
              shape: 'dag-node',
              position: {
                x: 0,
                y: 0,
              },
              size: {
                width: 0,
                height: 0,
              },
              attrs: {},
              zIndex: 0,
              data: {
                id: 'Conv1D',
                mode: 'nn',
                properties: [{ id: 'p', type: 'string', data: '123' } as any],
              } as any,
            },
          ],
          id: 'group',
          shape: 'group-node',
          position: {
            x: 0,
            y: 0,
          },
          size: {
            width: 0,
            height: 0,
          },
          attrs: undefined,
          zIndex: 0,
          data: new Material(),
        });
        expect(ast.codeGen()).toBeDefined();
        expect(ast.codeGen()).toBe(`node1 = paddle.nn.Conv1D(123)
node2 = paddle.nn.Conv1D(123)
node3 = paddle.nn.Conv1D(123)
node4 = paddle.nn.Conv1D(123)
group2 = paddle.concat(x=[node3,node4])
group3 = paddle.concat(x=[node1,node2,group2])
node5 = paddle.nn.Conv1D(123)
node6 = paddle.nn.Conv1D(123)
group = paddle.concat(x=[group3,node5,node6])`);
      });
    });
    describe('layer & cell', () => {
      it('non nest', () => {
        const code = service.buildGroup({
          children: [
            {
              id: 'node-1',
              shape: 'dag-node',
              position: {
                x: 0,
                y: 0,
              },
              size: {
                width: 0,
                height: 0,
              },
              attrs: {},
              zIndex: 0,
              data: {
                id: 'Conv1D',
                mode: 'nn',
                properties: [{ id: 'p', type: 'number', data: 123 } as any],
              } as any,
            },
            {
              shape: 'dag-node',
              id: 'layer',
              data: layer,
            } as any,
          ],
          id: 'group',
          shape: 'group-node',
          position: {
            x: 0,
            y: 0,
          },
          size: {
            width: 0,
            height: 0,
          },
          attrs: undefined,
          zIndex: 0,
          data: null,
        });
        expect(code.codeGen()).toContain(
          'group = paddle.concat(x=[node1,layer]',
        );
      });
      it('has nest', () => {
        const code = service.buildGroup({
          children: [
            {
              id: 'group-2',
              shape: 'group-node',
              position: {
                x: 0,
                y: 0,
              },
              size: { width: 0, height: 0 },
              attrs: undefined,
              zIndex: 0,
              data: {} as any,
              children: [
                {
                  id: 'node-1',
                  shape: 'dag-node',
                  position: {
                    x: 0,
                    y: 0,
                  },
                  size: {
                    width: 0,
                    height: 0,
                  },
                  attrs: {},
                  zIndex: 0,
                  data: {
                    id: 'Conv1D',
                    mode: 'nn',
                    properties: [{ id: 'p', type: 'number', data: 123 } as any],
                  } as any,
                },
                {
                  shape: 'dag-node',
                  id: 'layer',
                  data: layer,
                } as any,
              ],
            },
          ],
          id: 'group',
          shape: 'group-node',
          position: {
            x: 0,
            y: 0,
          },
          size: {
            width: 0,
            height: 0,
          },
          attrs: undefined,
          zIndex: 0,
          data: null,
        });
        expect(code.codeGen()).toBe(`node1 = paddle.nn.Conv1D(123)

class Layer:
    def __init__(self,x):
      pass

layer = Layer()
group2 = paddle.concat(x=[node1,layer])
group = paddle.concat(x=[group2])`);
      });
    });
  });
});
