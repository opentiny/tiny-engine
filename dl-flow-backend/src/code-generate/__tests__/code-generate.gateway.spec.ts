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
            cell: [],
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
            cell: [
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
            cell: [
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
            cell: [
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
            cell: [
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
            cell: [
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
            cell: [
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
    it('success - not group', () => {
      const code = gateway.create(
        {
          meta: {
            start: 'start',
            end: 'end',
          },
          payload: {
            cell: [
              {
                shape: 'dag-edge',
                source: { cell: 'start' },
                target: { cell: 'node-2' },
              } as Edge,
              {
                shape: 'dag-edge',
                source: { cell: 'node-2' },
                target: { cell: 'end' },
              } as Edge,
              {
                id: 'start',
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
                } as Material,
              } as Cell,
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
                      data: 128,
                    },
                  ],
                } as Material,
              } as Cell,
              {
                id: 'end',
                shape: 'dag-node',
                position: { x: 0, y: 0 },
                size: { width: 0, height: 0 },
                data: {
                  mode: 'nn',
                  id: 'Conv1d',
                  properties: [
                    {
                      id: 'in_channel',
                      data: 128,
                    },
                    {
                      id: 'out_channel',
                      data: 128 / 2,
                    },
                  ],
                } as Material,
              } as Cell,
            ],
          },
        },
        client as any,
      );
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
            cell: [
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
