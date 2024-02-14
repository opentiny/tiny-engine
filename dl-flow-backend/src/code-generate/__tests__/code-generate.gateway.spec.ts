import { Test, TestingModule } from '@nestjs/testing';
import { CodeGenerateGateway, State } from '../code-generate.gateway';
import { CodeGenerateService } from '../code-generate.service';
import { AST } from '../ast.service';
import { Cell, Edge } from '../code-generate.schema';
import { Material } from '../../material/material.schema';

describe('CodeGenerateGateway', () => {
  let gateway: CodeGenerateGateway;
  let client;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CodeGenerateGateway, CodeGenerateService, AST],
    }).compile();

    gateway = module.get<CodeGenerateGateway>(CodeGenerateGateway);
    client = {
      emit: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
  describe('generate', () => {
    it('empty cell', () => {
      const _ = gateway.create(
        {
          meta: {
            start: 'start',
            end: 'end',
          },
          payload: {
            cells: [],
          },
        },
        client as any,
      );
      expect(client.emit).toBeCalledTimes(1);
      expect(client.emit).toBeCalledWith(State.finfish, expect.any(String));
    });
    it('have cell but cell.start is non', () => {
      gateway.create(
        {
          meta: {
            start: '',
            end: 'end',
          },
          payload: {
            cells: [
              {
                id: 'uuid',
              } as any,
            ],
          },
        },
        client as any,
      );
      expect(client.emit).toBeCalledWith(State.progress, expect.any(String));
      expect(client.emit).toBeCalledWith(State.err, expect.any(String));
    });
    it('have cell but cell.start is non', () => {
      gateway.create(
        {
          meta: {
            start: 'start',
            end: '',
          },
          payload: {
            cells: [
              {
                id: 'uuid',
              } as any,
            ],
          },
        },
        client as any,
      );
      expect(client.emit).toBeCalledWith(State.progress, expect.any(String));
      expect(client.emit).toBeCalledWith(State.err, expect.any(String));
    });
    it('start not exists', () => {
      gateway.create(
        {
          meta: {
            start: 'start',
            end: 'end',
          },
          payload: {
            cells: [
              {
                id: 'uuid',
              } as any,
            ],
          },
        },
        client as any,
      );
      expect(client.emit).toBeCalledWith(State.err, '找不到起始节点');
    });
    it('end not exists', () => {
      gateway.create(
        {
          meta: {
            start: 'uuid',
            end: 'end',
          },
          payload: {
            cells: [
              {
                id: 'uuid',
              } as any,
            ],
          },
        },
        client as any,
      );
      expect(client.emit).toBeCalledWith(State.err, '找不到结束节点');
    });
    it('mutile end node', () => {
      gateway.create(
        {
          meta: {
            start: 'uuid',
            end: 'uuid-end',
          },
          payload: {
            cells: [
              {
                id: 'uuid',
              } as any,
              {
                id: 'uuid-end',
              } as any,
              {
                id: 'uuid-end',
              } as any,
            ],
          },
        },
        client as any,
      );
      expect(client.emit).toBeCalledWith(
        State.err,
        expect.stringMatching('结束节点数量大于1,'),
      );
    });
    it('non edges', () => {
      gateway.create(
        {
          meta: {
            start: 'uuid',
            end: 'uuid-end',
          },
          payload: {
            cells: [
              {
                id: 'uuid',
                shape: 'dag-node',
              } as any,
              {
                id: 'uuid-end',
                shape: 'dag-node',
              } as any,
            ],
          },
        },
        client as any,
      );
      expect(client.emit).toBeCalledWith(
        State.finfish,
        expect.stringMatching('生成结束, 边节点数量为0'),
      );
    });
    it.only('success - not group', () => {
      gateway.create(
        {
          meta: {
            start: '5893f689-879b-4c5e-b988-98fdc5ed23da',
            end: 'bd90870d-3bc7-4edc-83d5-11585e6e24c2',
          },
          payload: {
            cells: [],
            edges: [
              {
                source: {},
              },
            ],
          },
        },
        client,
      );
      // const code = gateway.create(
      //   {
      //     meta: {
      //       start: '5893f689-879b-4c5e-b988-98fdc5ed23da',
      //       end: 'bd90870d-3bc7-4edc-83d5-11585e6e24c2',
      //     },
      //     payload: {
      //       cells: [
      //         {
      //           shape: 'dag-edge',
      //           attrs: {
      //             line: {
      //               strokeDasharray: '5 5',
      //             },
      //           },
      //           id: '56921448-80a7-4782-ba1a-61859e5dbe79',
      //           zIndex: -1,
      //           source: {
      //             cell: '5893f689-879b-4c5e-b988-98fdc5ed23da',
      //             port: 'out',
      //           },
      //           target: {
      //             x: 50,
      //             y: 50,
      //           },
      //         },
      //         {
      //           position: {
      //             x: 0,
      //             y: 0,
      //           },
      //           size: {
      //             width: 112,
      //             height: 48,
      //           },
      //           view: 'vue-shape-view',
      //           shape: 'dag-node',
      //           ports: {
      //             groups: {
      //               top: {
      //                 position: 'top',
      //                 attrs: {
      //                   circle: {
      //                     r: 4,
      //                     magnet: true,
      //                     stroke: '#C2C8D5',
      //                     strokeWidth: 1,
      //                     fill: '#fff',
      //                   },
      //                 },
      //               },
      //               bottom: {
      //                 position: 'bottom',
      //                 attrs: {
      //                   circle: {
      //                     r: 4,
      //                     magnet: true,
      //                     stroke: '#C2C8D5',
      //                     strokeWidth: 1,
      //                     fill: '#fff',
      //                   },
      //                 },
      //               },
      //             },
      //             items: [
      //               {
      //                 id: 'in',
      //                 group: 'top',
      //               },
      //               {
      //                 id: 'out',
      //                 group: 'bottom',
      //               },
      //             ],
      //           },
      //           id: '5893f689-879b-4c5e-b988-98fdc5ed23da',
      //           data: {
      //             label: {
      //               zh_CN: '1D 卷积神经网络',
      //               en_US: 'Conv 1D',
      //             },
      //             id: 'Conv1D',
      //             desc: '一维卷积层',
      //             nn: true,
      //             mode: 'nn',
      //             properties: [
      //               {
      //                 id: 'in_channels',
      //                 label: {
      //                   zh_CN: '输入通道数',
      //                   en_US: 'in_channels',
      //                 },
      //                 type: 'number',
      //                 required: true,
      //                 default: 255,
      //                 data: 255,
      //               },
      //               {
      //                 id: 'out_channels',
      //                 label: {
      //                   zh_CN: '输出通道数',
      //                   en_US: 'out_channels',
      //                 },
      //                 type: 'number',
      //                 required: true,
      //                 default: 255,
      //                 data: 255,
      //               },
      //               {
      //                 id: 'kernal_size',
      //                 label: {
      //                   zh_CN: '卷积核大小',
      //                   en_US: 'kernal_size',
      //                 },
      //                 type: 'number',
      //                 required: true,
      //                 default: 3,
      //                 data: 3,
      //               },
      //               {
      //                 id: 'stride',
      //                 label: {
      //                   zh_CN: '步长',
      //                   en_US: 'stride',
      //                 },
      //                 type: 'number',
      //                 required: true,
      //                 default: 1,
      //                 data: 1,
      //               },
      //               {
      //                 id: 'dilation',
      //                 label: {
      //                   zh_CN: '空洞大小',
      //                   en_US: 'dilation',
      //                 },
      //                 type: 'number',
      //                 required: true,
      //                 default: 0,
      //                 data: 0,
      //               },
      //               {
      //                 id: 'groups',
      //                 label: {
      //                   zh_CN: '组数',
      //                   en_US: 'groups',
      //                 },
      //                 type: 'number',
      //                 required: true,
      //                 default: 0,
      //                 data: 0,
      //               },
      //               {
      //                 id: 'padding_mode',
      //                 label: {
      //                   zh_CN: '填充模式',
      //                   en_US: 'padding_mode',
      //                 },
      //                 type: 'enums',
      //                 enums: [
      //                   {
      //                     id: 1,
      //                     label: 'zeros',
      //                     value: 'zeros',
      //                     default: true,
      //                   },
      //                   {
      //                     id: 2,
      //                     label: 'reflect',
      //                     value: 'reflect',
      //                   },
      //                   {
      //                     id: 3,
      //                     label: 'replicate',
      //                     value: 'replicate',
      //                   },
      //                   {
      //                     id: 4,
      //                     label: 'circular',
      //                     value: 'circular',
      //                   },
      //                 ],
      //                 required: true,
      //                 data: 'zeros',
      //               },
      //               {
      //                 id: 'weight_attr',
      //                 label: {
      //                   zh_CN: '权重参数',
      //                   en_US: 'weight_attr',
      //                 },
      //                 type: 'ParamAttr',
      //                 data: {
      //                   name: '',
      //                   initializer: '',
      //                   learning_rate: 1,
      //                   regularizer: 'L1Decay',
      //                   trainable: true,
      //                   do_model_average: true,
      //                   need_clip: true,
      //                 },
      //               },
      //               {
      //                 id: 'bias_attr',
      //                 label: {
      //                   zh_CN: '偏置参数',
      //                   en_US: 'bias_attr',
      //                 },
      //                 type: 'ParamAttr',
      //                 data: {
      //                   name: '',
      //                   initializer: '',
      //                   learning_rate: 1,
      //                   regularizer: 'L1Decay',
      //                   trainable: true,
      //                   do_model_average: true,
      //                   need_clip: true,
      //                 },
      //               },
      //               {
      //                 id: 'data_format',
      //                 label: {
      //                   zh_CN: '数据格式',
      //                   en_US: 'data_format',
      //                 },
      //                 type: 'string',
      //                 required: true,
      //               },
      //             ] as any,
      //           },
      //           zIndex: 1,
      //         },
      //         {
      //           position: {
      //             x: 10,
      //             y: 160,
      //           },
      //           size: {
      //             width: 112,
      //             height: 48,
      //           },
      //           shape: 'dag-node',
      //           ports: {
      //             groups: {
      //               top: {
      //                 position: 'top',
      //                 attrs: {
      //                   circle: {
      //                     r: 4,
      //                     magnet: true,
      //                     stroke: '#C2C8D5',
      //                     strokeWidth: 1,
      //                     fill: '#fff',
      //                   },
      //                 },
      //               },
      //               bottom: {
      //                 position: 'bottom',
      //                 attrs: {
      //                   circle: {
      //                     r: 4,
      //                     magnet: true,
      //                     stroke: '#C2C8D5',
      //                     strokeWidth: 1,
      //                     fill: '#fff',
      //                   },
      //                 },
      //               },
      //             },
      //             items: [
      //               {
      //                 id: 'in',
      //                 group: 'top',
      //               },
      //               {
      //                 id: 'out',
      //                 group: 'bottom',
      //               },
      //             ],
      //           } as any,
      //           id: 'bd90870d-3bc7-4edc-83d5-11585e6e24c2',
      //           data: {
      //             label: {
      //               zh_CN: '1D 卷积神经网络',
      //               en_US: 'Conv 1D',
      //             },
      //             id: 'Conv1D',
      //             desc: '一维卷积层',
      //             nn: true,
      //             mode: 'nn',
      //             properties: [
      //               {
      //                 id: 'in_channels',
      //                 label: {
      //                   zh_CN: '输入通道数',
      //                   en_US: 'in_channels',
      //                 },
      //                 type: 'number',
      //                 required: true,
      //                 default: 255,
      //                 data: 255,
      //               },
      //               {
      //                 id: 'out_channels',
      //                 label: {
      //                   zh_CN: '输出通道数',
      //                   en_US: 'out_channels',
      //                 },
      //                 type: 'number',
      //                 required: true,
      //                 default: 255,
      //                 data: 255,
      //               },
      //               {
      //                 id: 'kernal_size',
      //                 label: {
      //                   zh_CN: '卷积核大小',
      //                   en_US: 'kernal_size',
      //                 },
      //                 type: 'number',
      //                 required: true,
      //                 default: 3,
      //                 data: 3,
      //               },
      //               {
      //                 id: 'stride',
      //                 label: {
      //                   zh_CN: '步长',
      //                   en_US: 'stride',
      //                 },
      //                 type: 'number',
      //                 required: true,
      //                 default: 1,
      //                 data: 1,
      //               },
      //               {
      //                 id: 'dilation',
      //                 label: {
      //                   zh_CN: '空洞大小',
      //                   en_US: 'dilation',
      //                 },
      //                 type: 'number',
      //                 required: true,
      //                 default: 0,
      //                 data: 0,
      //               },
      //               {
      //                 id: 'groups',
      //                 label: {
      //                   zh_CN: '组数',
      //                   en_US: 'groups',
      //                 },
      //                 type: 'number',
      //                 required: true,
      //                 default: 0,
      //                 data: 0,
      //               },
      //               {
      //                 id: 'padding_mode',
      //                 label: {
      //                   zh_CN: '填充模式',
      //                   en_US: 'padding_mode',
      //                 },
      //                 type: 'enums',
      //                 enums: [
      //                   {
      //                     id: 1,
      //                     label: 'zeros',
      //                     value: 'zeros',
      //                     default: true,
      //                   },
      //                   {
      //                     id: 2,
      //                     label: 'reflect',
      //                     value: 'reflect',
      //                   },
      //                   {
      //                     id: 3,
      //                     label: 'replicate',
      //                     value: 'replicate',
      //                   },
      //                   {
      //                     id: 4,
      //                     label: 'circular',
      //                     value: 'circular',
      //                   },
      //                 ],
      //                 required: true,
      //                 data: 'zeros',
      //               },
      //               {
      //                 id: 'weight_attr',
      //                 label: {
      //                   zh_CN: '权重参数',
      //                   en_US: 'weight_attr',
      //                 },
      //                 type: 'ParamAttr',
      //                 data: {
      //                   name: '',
      //                   initializer: '',
      //                   learning_rate: 1,
      //                   regularizer: 'L1Decay',
      //                   trainable: true,
      //                   do_model_average: true,
      //                   need_clip: true,
      //                 } as any,
      //               } as any,
      //               {
      //                 id: 'bias_attr',
      //                 label: {
      //                   zh_CN: '偏置参数',
      //                   en_US: 'bias_attr',
      //                 },
      //                 type: 'ParamAttr',
      //                 data: {
      //                   name: '',
      //                   initializer: '',
      //                   learning_rate: 1,
      //                   regularizer: 'L1Decay',
      //                   trainable: true,
      //                   do_model_average: true,
      //                   need_clip: true,
      //                 },
      //               },
      //               {
      //                 id: 'data_format',
      //                 label: {
      //                   zh_CN: '数据格式',
      //                   en_US: 'data_format',
      //                 },
      //                 type: 'string',
      //                 required: true,
      //               },
      //             ],
      //           },
      //           zIndex: 2,
      //         },
      //       ],
      //     },
      //   } as any,
      //   client as any,
      // );
      console.log(code);
      expect(code).not.toBeUndefined();
      expect(code).toBe(
        `start = paddle.nn.Conv1d(256,128)
node2 = paddle.nn.Conv1d(128)
end = paddle.nn.Conv1d(128,64)`,
      );
    });
    it.skip('sucess - group', () => {
      const code = gateway.create(
        {
          meta: {
            start: 's',
            end: 'e',
          },
          payload: {
            cells: [
              {
                shape: 'dag-edge',
                source: { cell: 's' },
                target: { cell: 'node-3' },
              } as Edge,
              {
                shape: 'dag-edge',
                source: { cell: 'node-3' },
                target: { cell: 'e' },
              } as Edge,
              {
                shape: 'dag-edge',
                source: { cell: 'node-1' },
                target: { cell: 'node-2' },
              } as Edge,
              {
                id: 's',
                shape: 'group-node',
                children: [
                  {
                    id: 'node-1',
                    shape: 'dag-node',
                    position: { x: 0, y: 0 },
                    size: { width: 0, height: 0 },
                    data: {
                      mode: 'nn',
                      id: 'Conv1d',
                      properties: [
                        {
                          id: 'in_channel',
                          data: 256,
                        },
                        {
                          id: 'out_channel',
                          data: 128,
                        },
                      ],
                    },
                  },
                  {
                    id: 'node-2',
                    shape: 'dag-node',
                    position: { x: 0, y: 0 },
                    size: { width: 0, height: 0 },
                    data: {
                      mode: 'nn',
                      id: 'Conv1d',
                      properties: [
                        {
                          id: 'in_channel',
                          data: 256,
                        },
                        {
                          id: 'out_channel',
                          data: 128,
                        },
                      ],
                    },
                  },
                ],
              } as Cell,
              {
                id: 'node-3',
                shape: 'dag-node',
                position: { x: 0, y: 0 },
                size: { width: 0, height: 0 },
                data: {
                  mode: 'nn',
                  id: 'Conv1d',
                  properties: [
                    {
                      id: 'in_channel',
                      data: 256,
                    },
                    {
                      id: 'out_channel',
                      data: 128,
                    },
                  ],
                },
              } as Cell,
              {
                id: 'e',
                shape: 'dag-node',
                position: { x: 0, y: 0 },
                size: { width: 0, height: 0 },
                data: {
                  mode: 'nn',
                  id: 'Conv1d',
                  properties: [
                    {
                      id: 'in_channel',
                      data: 256,
                    },
                    {
                      id: 'out_channel',
                      data: 128,
                    },
                  ],
                },
              } as Cell,
            ],
          },
        },
        client,
      );
      expect(code).toBeDefined();
    });
  });
});
