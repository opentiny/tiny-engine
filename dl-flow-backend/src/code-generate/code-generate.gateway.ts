import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { CodeGenerateService, Exception } from './code-generate.service';
import { Cell, GenerateCodeDto } from './code-generate.schema';
import { Socket } from 'socket.io';
import { AST } from './ast.service';
import { UseFilters, ValidationPipe } from '@nestjs/common';
import { writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { join } from 'path';
import { cwd } from 'process';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { WsExceptionFilter } from '../ws-exception/ws-exception.filter';

export enum State {
  err = 'err',
  finfish = 'finish',
  progress = 'progress',
  done = 'done',
}

@WebSocketGateway(9001, {
  cors: {
    origin: '*',
  },
})
export class CodeGenerateGateway {
  constructor(
    private readonly codeGenerateService: CodeGenerateService,
    private readonly ast: AST,
    private readonly jwt: JwtService,
    @InjectRedis() private readonly redis: Redis,
  ) {}
  @UseFilters(WsExceptionFilter)
  @SubscribeMessage('createCodeGenerate')
  async create(
    @MessageBody(new ValidationPipe()) schema: GenerateCodeDto,
    @ConnectedSocket() client: Socket,
  ) {
    const token = client.handshake.headers.authorization;
    if (!token || !(await this.redis.exists(token))) {
      client.emit('unauth', '');
      client.disconnect();
      return;
    }
    try {
      const {
        handshake: {
          headers: { authorization },
        },
      } = client;
      this.jwt.verifyAsync(authorization ?? '');
    } catch {
      client.emit('unauth', '');
      client.disconnect();
      return;
    }
    const {
      meta: { start, end },
      payload: { cells: cell, edges },
    } = schema;
    if (!cell) {
      client.emitWithAck(State.err, '创建结束, 因为没有节点');
      return;
    }
    if (!cell.length) {
      client.emitWithAck(State.finfish, '创建结束, 因为图为空');
      return;
    }
    try {
      client.emitWithAck(State.progress, '检查起始节点');
      this.codeGenerateService.checkStartNodes(cell, start);
      client.emitWithAck(State.progress, '检查起始节点通过');
      client.emitWithAck(State.progress, '检查结束节点');
      this.codeGenerateService.checkEndNode(cell, end);
      client.emitWithAck(State.progress, '检查结束节点通过');
    } catch (e) {
      const { message } = e as Error;
      client.emitWithAck(State.err, message);
      return;
    }
    client.emitWithAck(State.progress, '提取节点...');
    const nodes = this.codeGenerateService.extract<Cell>(cell, (cell: any) =>
      cell.shape.includes('node'),
    );
    client.emitWithAck(State.progress, `节点数量为: ${nodes.length}`);
    if (!nodes.length) {
      client.emitWithAck(State.finfish, '生成结束');
      return;
    }
    client.emitWithAck(State.progress, `边数量为: ${edges.length}`);
    if (!edges.length) {
      client.emitWithAck(State.finfish, `生成结束, 边节点数量为0`);
      return;
    }
    if (!nodes.length) {
      client.emitWithAck(State.finfish, '生成结束, 节点数量为0');
      return;
    }
    client.emitWithAck(State.progress, '标准化节点');
    const standardizationNodes =
      this.codeGenerateService.standardizationNode(nodes);
    client.emitWithAck(State.progress, '标准化边');
    const standardizationEdges = this.codeGenerateService.standardizationEdge(
      edges,
      standardizationNodes,
    );
    client.emitWithAck(State.progress, '顺序化节点');
    const sequence = this.codeGenerateService.sequencingNode(
      standardizationNodes,
      standardizationEdges,
      end,
      start,
    );
    client.emitWithAck(State.progress, 'AST构建');
    const ast = this.ast.build(sequence, standardizationNodes);
    if (!ast.children) {
      // transform success
      client.emitWithAck(State.finfish, 'AST转码成功');
      return;
    }
    client.emitWithAck(State.progress, 'AST转码');
    const code = ast.codeGen();
    client.emitWithAck(State.progress, 'AST转码成功');
    const hash = createHash('sha512').update(code).digest('hex').toString();
    const fileName = `${hash}-${new Date().getTime()}`;
    const content = ['import paddle', 'from paddle import *', code].join('\n');
    const publicPath = join(cwd(), 'public');
    writeFileSync(join(publicPath, fileName + '.py'), content);
    return client.emitWithAck(State.done, fileName);
  }
  async handleConnection(@ConnectedSocket() socket: Socket) {
    const token = socket.handshake.headers.authorization;
    if (!token || !(await this.redis.exists(token))) {
      socket.emit('unauth', '');
      socket.disconnect();
      return;
    }
    try {
      this.jwt.verifyAsync(socket.handshake.headers.authorization ?? '');
    } catch {
      socket.emit('unauth', '');
      socket.disconnect();
      return;
    }
  }
}
