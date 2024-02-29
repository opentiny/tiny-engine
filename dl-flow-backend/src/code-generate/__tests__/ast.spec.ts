import { Test, TestingModule } from '@nestjs/testing';
import { AST, VarDecl } from '../ast.service';
import { Material } from '../../material/material.schema';
import { Cell, Edge } from '@antv/x6';
import { Layer } from '../code-generate.schema';
import { StandardizationNodes } from '../code-generate.service';

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
  const buildNode = (total: number, startId = 0) => {
    const arr: {
      id: string;
      shape: string;
      position: {
        x: number;
        y: number;
      };
      size: {
        width: number;
        height: number;
      };
      zIndex: number;
      data: Material;
    }[] = [];
    for (let i = 1; i <= total; i++) {
      const obj = {
        id: `node${i + startId}`,
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
      };
      arr.push(obj);
    }
    return arr;
  };
  const buildLayer = (total: number): any[] => {
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
  it.skip('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('standardization', () => {
    expect(service.standardization('123', 'string')).toBe(`'123'`);
    expect(service.standardization('123', 'number')).toBe(`123`);
    expect(service.standardization('[0,0]', 'array')).toBe('[0,0]');
    expect(service.standardization('123', 'boolean')).toBe('true');
    expect(service.standardization('true', 'boolean')).toBe('true');
    expect(service.standardization('false', 'boolean')).toBe('false');
  });
  describe('buildNN', () => {
    it('non properties', () => {
      const node = buildNode(1)[0];
      expect(service.buildNN(node.data, node.id).name).toBe(`node${node.id}`);
      expect(service.buildNN(node.data, node.id).codeGen()).toBe(
        `node${node.id} = paddle.nn.${node.data.id}()`,
      );
    });
    it('has properties', () => {
      const node = buildNode(1)[0];
      node.data.properties.push(
        {
          id: 'in_channel',
          data: 256,
          label: {
            zh_CN: '',
            en_US: '',
          },
          type: 'number',
          default: '',
          enums: [],
        },
        {
          id: 'out_channel',
          data: 128,
          label: {
            zh_CN: '',
            en_US: '',
          },
          type: 'number',
          default: '',
          enums: [],
        },
        {
          id: 'weight_attr',
          data: {
            name: 'weight',
            learning_rate: 1e-5,
          },
          label: {
            zh_CN: '',
            en_US: '',
          },
          type: 'ParamAttr',
          default: '',
          enums: [],
        },
        {
          id: 'test',
          type: 'list',
          data: [1, '2', true, {}],
          label: {
            zh_CN: '',
            en_US: '',
          },
          default: '',
          enums: [],
        },
      );
      expect(service.buildNN(node.data, node.id).name).toBe(`node${node.id}`);
      expect(service.buildNN(node.data, node.id).codeGen()).toBe(
        `node${node.id} = paddle.nn.${node.data.id}(in_channel = 256,out_channel = 128,weight_attr = ParamAttr(name = 'weight',learning_rate = 0.00001),test = [1,'2',true,{}])`,
      );
    });
  });
  describe('group', () => {
    it('non nest', () => {
      const group = {
        id: 'group-1',
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
        children: ['node-1', 'node-2'],
      };
      const ast = service.buildGroup(group as any, {
        'group-1': group as any,
        'node-1': {
          id: 'node-1',
          shape: 'dag-node',
          data: {
            id: 'Conv1D',
            mode: 'nn',
            properties: [],
          } as Material,
          position: { x: 0, y: 0 },
          size: {
            width: 0,
            height: 0,
          },
          attrs: undefined,
          zIndex: 0,
        },
        'node-2': {
          id: 'node-2',
          shape: 'dag-node',
          data: {
            id: 'Conv1D',
            mode: 'nn',
            properties: [],
          } as Material,
          position: { x: 0, y: 0 },
          size: {
            width: 0,
            height: 0,
          },
          attrs: undefined,
          zIndex: 0,
        },
      });
      // expect(ast.children.length).toBe(3);
      // expect(ast.children[0]).toBeInstanceOf(VarDecl);
      // expect(ast.children[1]).toBeInstanceOf(VarDecl);
      // expect(ast.children[2]).toBeInstanceOf(VarDecl);
      expect(ast.children[0].codeGen()).toContain('group1');
    });
    it('has nest', () => {
      const nodes = {
        'node-4': buildNode(1, 3)[0],
        'node-11': buildNode(1, 10)[0],
        'group-3': {
          id: 'group-3',
          shape: 'group',
          children: ['node-11'] as any,
          data: new Material(),
          position: { x: 0, y: 0 },
          size: {
            width: 0,
            height: 0,
          },
          attrs: undefined,
          zIndex: 0,
        },
        'group-2': {
          id: 'group-2',
          shape: 'group',
          data: new Material(),
          position: { x: 0, y: 0 },
          size: {
            width: 0,
            height: 0,
          },
          attrs: undefined,
          zIndex: 0,
          children: ['node-4', 'group-3'] as any,
        },
        'node-2': {
          id: 'node-2',
          shape: 'dag-node',
          data: {
            id: 'Conv1D',
            mode: 'nn',
            properties: [],
          } as Material,
          position: { x: 0, y: 0 },
          size: {
            width: 0,
            height: 0,
          },
          attrs: undefined,
          zIndex: 0,
        },
        'node-1': {
          id: 'node-1',
          shape: 'dag-node',
          data: {
            id: 'Conv1D',
            mode: 'nn',
            properties: [],
          } as Material,
          position: { x: 0, y: 0 },
          size: {
            width: 0,
            height: 0,
          },
          attrs: undefined,
          zIndex: 0,
        },
      };
      const group = {
        id: 'group-1',
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
        children: ['node-1', 'node-2', 'group-2'],
      };
      const ast = service.buildGroup(group as any, nodes as any);
      console.log(ast.codeGen());
      expect(ast.codeGen()).toBe(`group_group3 = paddle.concat(x=[nodenode11])
group_group2 = paddle.concat(x=[group_group3,nodenode4])
group_group1 = paddle.concat(x=[group_group2,nodenode2,nodenode1])`);
    });
  });
  it('build', () => {
    const node: StandardizationNodes = {
      'node-1': {
        id: 'node-1',
        shape: 'node',
        position: {
          x: 0,
          y: 0,
        },
        size: { width: 0, height: 0 },
        attrs: {},
        zIndex: 0,
        data: {
          mode: 'nn',
          id: 'Conv1D',
          properties: [],
        } as Material,
      },
      'node-2': {
        id: 'node-2',
        shape: 'node',
        position: {
          x: 0,
          y: 0,
        },
        size: { width: 0, height: 0 },
        attrs: {},
        zIndex: 0,
        data: {
          mode: 'nn',
          id: 'Conv1D',
          properties: [],
        } as Material,
      },
      layer: {
        ...(buildLayer(1)[0] as Layer),
      } as any,
      'node-3': {
        id: 'node-3',
        shape: 'node',
        position: {
          x: 0,
          y: 0,
        },
        size: { width: 0, height: 0 },
        attrs: {},
        zIndex: 0,
        data: {
          mode: 'nn',
          id: 'Conv1D',
          properties: [],
        } as Material,
      },
      'layer-2': {
        ...buildLayer(1)[0],
      },
      group: {
        id: 'group',
        shape: 'group',
        position: {
          x: 0,
          y: 0,
        },
        size: { width: 0, height: 0 },
        attrs: {},
        zIndex: 0,
        children: ['node-3', 'layer-2'] as any,
        data: new Material(),
      },
    };
    const ast = service.build(
      [node['node-1'], node['node-2'], node['layer'], node['group']],
      node,
    );
    console.log(ast.codeGen());
    expect(ast.codeGen().replace(/\n| /gim, '')).toEqual(
      `true = True
      false = False
      nodenode1 = paddle.nn.Conv1D()
      nodenode2 = paddle.nn.Conv1D()
  
      class Layer1:
        def __init__(self,x):
          pass
  
      layer1 = Layer1(x=1)
      group_group = paddle.concat(x=[nodelayer1,nodenode3])`.replace(
        /\n| /gim,
        '',
      ),
    );
  });
});
