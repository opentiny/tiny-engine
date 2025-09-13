import * as Y from 'yjs'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { type NodeSchema, type Node, type PositionType, POSITION, type InsertOptions, type PageSchema } from '../type'
import { OperationHandler } from '../operation/operationHandler '

/**
 * NodeSchemaModel 类，用于将低代码 NodeSchema 映射到 Yjs 的 Y.Map
 * 封装了 NodeSchema 在 Yjs 中的操作逻辑
 */
export class NodeSchemaModel {
  private yMap: Y.Map<any>
  public operationHandler: OperationHandler

  constructor(yMap: Y.Map<any>, rootSchema: PageSchema, docName: string) {
    this.yMap = yMap
    this.operationHandler = new OperationHandler(rootSchema, yMap, docName)
  }

  // 从 Y.Map 获取 NodeSchema 数据
  public toJSON(): NodeSchema {
    return this.yMap.toJSON() as NodeSchema
  }

  // 拖拽行为产生的节点插入
  public insertNode({ parent, node, data }: InsertOptions, position: PositionType) {
    let insertPos
    let insertPosFinal

    if (!parent) {
      this.insert(useCanvas().pageState.pageSchema!.id as string, data, position)
    } else {
      switch (position) {
        case POSITION.TOP:
        case POSITION.LEFT:
          this.insert(parent.id || '', data, 'before', node.id)
          break
        case POSITION.BOTTOM:
        case POSITION.RIGHT:
          this.insert(parent.id || '', data, 'after', node.id)
          break
        case POSITION.IN:
          insertPos = ([POSITION.TOP, POSITION.LEFT] as string[]).includes(position) ? 'before' : 'after'
          this.insert(node.id || '', data, insertPos)
          break
        case POSITION.OUT:
          this.insert(parent.id || '', data, POSITION.OUT, node.id)
          break
        case POSITION.REPLACE:
          this.insert(parent.id || '', data, 'replace', node.id)
          break
        default:
          insertPosFinal = ([POSITION.TOP, POSITION.LEFT] as string[]).includes(position) ? 'before' : 'after'
          this.insert(node.id || '', data, insertPosFinal)
          break
      }
    }
  }

  // delete 操作
  public deleteNode(nodeId: string) {
    this.operationHandler.remove({
      id: nodeId
    })
  }

  // canvas 内，节点上下移动
  public moveNode(parentId: string, targetId: string, direction: 'up' | 'down') {
    this.operationHandler.move({ parentId, targetId, direction })
  }

  // canvas 内，更新节点样式
  public updatedNodeCss(strStyle: string, nodeId: string, className: string) {
    this.operationHandler.updatedStyle(strStyle, nodeId, className)
  }

  // insert 操作
  private insert(parentId: string, newNodeData: Node, position: string, referTargetNodeId?: string) {
    this.operationHandler.insert({
      type: 'insert',
      parentId,
      newNodeData,
      position,
      referTargetNodeId
    })
  }
}
