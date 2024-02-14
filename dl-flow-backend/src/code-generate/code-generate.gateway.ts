import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { CodeGenerateService } from './code-generate.service';
import { Cell, Edge, GenerateCodeDto } from './code-generate.schema';
import { Socket } from 'socket.io';
import { AST } from './ast.service';
import { ValidationPipe } from '@nestjs/common';

export enum State {
  err = 'err',
  finfish = 'finish',
  progress = 'progress',
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
  ) {}

  @SubscribeMessage('createCodeGenerate')
  create(
    @MessageBody(new ValidationPipe()) schema: GenerateCodeDto,
    @ConnectedSocket() client: Socket,
  ) {
    const {
      meta: { start, end },
      payload: { cells: cell, edges },
    } = schema;
    if (!cell) {
      client.emit(State.err, '创建结束, 因为没有节点');
      return;
    }
    if (!cell.length) {
      client.emit(State.finfish, '创建结束, 因为图为空');
      return;
    }
    try {
      client.emit(State.progress, '检查起始节点');
      this.codeGenerateService.checkStartNodes(cell, start);
      client.emit(State.progress, '检查起始节点通过');
      client.emit(State.progress, '检查结束节点');
      this.codeGenerateService.checkEndNode(cell, end);
      client.emit(State.progress, '检查结束节点通过');
    } catch (e) {
      const { message } = e as Error;
      client.emit(State.err, message);
      return;
    }
    client.emit(State.progress, '提取节点...');
    const nodes = this.codeGenerateService.extract<Cell>(cell, (cell: any) =>
      cell.shape.includes('node'),
    );
    client.emit(State.progress, `节点数量为: ${nodes.length}`);
    if (!nodes.length) {
      client.emit(State.finfish, '生成结束');
      return;
    }
    // const edges = this.codeGenerateService.extract<Edge>(
    //   cell,
    //   (cell: any) => cell.shape === 'dag-edge',
    // );
    client.emit(State.progress, `边数量为: ${edges.length}`);
    if (!edges.length) {
      client.emit(State.finfish, `生成结束, 边节点数量为0`);
      return;
    }
    if (!nodes.length) {
      client.emit(State.finfish, '生成结束, 节点数量为0');
      return;
    }
    client.emit(State.progress, '标准化边');
    const standardizationEdges =
      this.codeGenerateService.standardizationEdge(edges);
    client.emit(State.progress, '标准化节点');
    const standardizationNodes =
      this.codeGenerateService.standardizationNode(nodes);
    client.emit(State.progress, '顺序化节点');
    const sequence = this.codeGenerateService.sequencingNode(
      standardizationNodes,
      standardizationEdges,
      end,
      start,
    );
    client.emit(State.progress, 'AST构建');
    const ast = this.ast.build(sequence);
    if (!ast.children) {
      // transform success
      client.emit(State.finfish, 'AST转码成功');
      return;
    }
    client.emit(State.progress, 'AST转码');
    const code = ast.codeGen();
    client.emit(State.finfish, 'AST转码成功');
    client.emit(State.finfish, code);
    return code;
  }
}
