import { Injectable } from '@nestjs/common';
import { Cell, Edge } from './code-generate.schema';

type StandardizationEdges = {
  [source: string]: Set<string>;
};

type StandardizationNodes = {
  [id: string]: Cell;
};

@Injectable()
export class CodeGenerateService {
  checkStartNodes(cells: (Cell | Edge)[], startId: string) {
    const nodes = cells.filter(({ id }) => id === startId);
    if (!nodes.length) {
      throw new Error('找不到起始节点');
    }
  }
  checkEndNode(cells: (Cell | Edge)[], endId: string) {
    const nodes = cells.filter(({ id }) => id === endId);
    if (!nodes.length) {
      throw new Error('找不到结束节点');
    }
    if (nodes.length > 1) {
      throw new Error('结束节点数量大于1, 请考虑合并或修改网络结构');
    }
  }
  extract<R>(cell: (Cell | Edge)[], fn: (cell: Cell | Edge) => boolean) {
    return cell.filter(fn) as unknown as R[];
  }
  standardizationEdge(edges: Edge[]) {
    const obj: StandardizationEdges = {};
    for (const edge of edges) {
      if (obj[edge.source.cell]) {
        obj[edge.source.cell].add(edge.target.cell);
      } else {
        obj[edge.source.cell] = new Set([edge.target.cell]);
      }
      if (obj[edge.target.cell]) {
        obj[edge.target.cell].add(edge.source.cell);
      } else {
        obj[edge.target.cell] = new Set([edge.source.cell]);
      }
    }
    return obj;
  }
  standardizationNode(cells: Cell[]) {
    const obj: StandardizationNodes = {};
    for (const cell of cells) {
      obj[cell.id] = cell;
    }
    return obj;
  }
  getChildren(
    id: string,
    edge: StandardizationEdges,
    nodes: StandardizationNodes,
  ) {
    const childIds = edge[id];
    if (!childIds || !childIds.size) {
      return [];
    }
    const children = [];
    for (const childId of childIds) {
      const child = nodes[childId];
      children.push(child);
    }
  }
  /**
   *
   * 业务排序，start - end可能不一定是拓补上的有序。例如可能是
   * ```
   *      --------
   *      v       |
   *  ---------   |
   *  |  end  |   |
   *  ---------   |
   *              |
   *              |
   *              |
   *              |
   * -----------  |
   * |  start  |  |
   * -----------  |
   *      |       |
   *       -------
   * ```
   * 上图所示, 所以需要对节点进行排序。
   */
  sequencingNode(
    nodes: StandardizationNodes,
    edges: StandardizationEdges,
    endId: string,
    startId: string,
  ) {
    const endNode = nodes[endId];
    const startNode = nodes[startId];
    const sequence: Cell[] = [endNode];
    const visitor = (id: string) => {
      if (!id || id === startId) {
        return;
      }
      const edgesArr = Array.from(edges[id]);
      for (const edge of edgesArr) {
        const connectedNode = nodes[edge];
        if (connectedNode) {
          sequence.unshift(connectedNode);
        }
        visitor(connectedNode.id);
      }
    };
    sequence.unshift(startNode);
    return sequence;
  }
  codeGen(edge: StandardizationEdges, nodes: StandardizationNodes) {
    for (const [key, node] of Object.entries(nodes)) {
    }
  }
}
