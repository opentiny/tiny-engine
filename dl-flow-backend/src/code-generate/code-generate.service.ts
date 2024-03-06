import { Injectable } from '@nestjs/common';
import { Cell, Edge } from './code-generate.schema';

export type StandardizationEdges = {
  [source: string]: Set<string>;
};

export type StandardizationNodes = {
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
  standardizationEdge(edges: Edge[], nodes: StandardizationNodes) {
    const obj: StandardizationEdges = {};
    for (const edge of edges) {
      const { source, target } = edge;
      // if (source.port === target.port) {
      //   throw new Error('source port和target port不能相同');
      // }
      if (obj[target.cell]) {
        obj[target.cell].add(source.cell);
      } else {
        obj[target.cell] = new Set([source.cell]);
      }
    }
    console.log(obj);
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
    debugger;
    const endNode = nodes[endId];
    const sequence: Cell[] = [endNode];
    const visitor = (id: string) => {
      if (!id || id === startId) {
        return;
      }
      const edgesArr = Array.from(edges[id] ?? []);
      for (const edge of edgesArr) {
        const connectedNode = nodes[edge];
        if (connectedNode) {
          sequence.unshift(connectedNode);
          if (connectedNode.shape.includes('group')) {
            for (const child of connectedNode.children) {
              visitor(child);
            }
          }
          visitor(connectedNode.id);
        }
      }
    };
    visitor(endId);
    console.log(nodes, edges);
    return sequence;
  }
}
