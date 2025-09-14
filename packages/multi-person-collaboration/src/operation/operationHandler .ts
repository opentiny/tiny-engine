import type {
  DeleteOperation,
  MoveOperation,
  Node,
  NodeOperation,
  PageSchema,
  UpdatePropsOperation,
  UpdateStyleOperation
} from '../type'
import * as Y from 'yjs'
import { toYjs } from '../utils'
import { DocManager } from '../services/docManager'

export class OperationHandler {
  private yNodeMap = new Map<string, Y.Map<any>>() // 用于快速查找每个节点对应的 Y.Map 对象
  private yMap: Y.Map<any> // 代表整棵页面/文档的 根 Yjs 树
  private yDoc: Y.Doc
  private rootSchema: PageSchema

  constructor(rootSchema: PageSchema, yMap: Y.Map<any>, docName: string) {
    this.rootSchema = rootSchema
    // yMap 已在 SchemaManager 完成初始化，直接赋值即可
    this.yMap = yMap

    // 初始化 yNodeMap
    this.setYNode(rootSchema.children, this.yMap.get('children'))

    // 获得 yDoc 用于执行事务
    const docManager = DocManager.getInstance()
    this.yDoc = docManager.getOrCreateDoc(docName)
  }

  public insert(operation: NodeOperation) {
    const { parentId, newNodeData, position, referTargetNodeId } = operation
    const parentNode = this.getYNode(parentId)

    if (!parentNode) {
      return {}
    }

    let yChildren = parentNode.get('children') as Y.Array<Y.Map<any>>
    if (!yChildren) {
      yChildren = new Y.Array()
      parentNode.set('children', yChildren)
    }

    let referenceNode = null
    if (referTargetNodeId) {
      referenceNode = this.getYNode(referTargetNodeId)
      if (!referenceNode) {
        throw new Error(`Yjs Reference node with ID ${referTargetNodeId} not found`)
      }
    }

    // 查找参考节点
    let index = yChildren.toArray().findIndex((node) => node.get('id') === referTargetNodeId)

    // 转化为 YMap
    const yNode = new Y.Map<any>()
    const yNewNode = new Y.Map()

    yNode.set('newNode', yNewNode)

    toYjs(yNewNode, newNodeData)

    // 元信息，用于帮助接收 yMap 变动的客户端进行 UI 更新
    const yMetaMap = new Y.Map()
    yNode.set('meta', yMetaMap)

    yMetaMap.set('position', position)
    yMetaMap.set('referTargetNodeId', referTargetNodeId)
    yMetaMap.set('parentId', parentId)

    // 根据 position 插入
    switch (position) {
      case 'before':
        index = index === -1 ? 0 : index
        yChildren.insert(index, [yNode])
        break
      case 'out':
        if (referenceNode) {
          const childrenNode = Array.isArray(referenceNode) ? [...referenceNode] : [referenceNode]
          yNode.get('newNode').set('children', childrenNode)

          yChildren.get(index).set('_node_deleted', true)
          yChildren.insert(index, [yNode])
        }
        break
      case 'replace':
        if (index !== -1) {
          yChildren.get(index).set('_node_deleted', true)
          yChildren.insert(index, [yNode])
        }
        break
      case 'bottom':
        yChildren.insert(index + 1, [yNode])
        break
      default:
        index = index === -1 ? yChildren.length : index + 1
        yChildren.insert(index, [yNode])
        break
    }

    this.setYNode(newNodeData, yNewNode)

    return {
      current: newNodeData,
      previous: undefined
    }
  }

  // 软删除，不去直接删除存在的节点，
  // 设置 _node_deleted 属性来标记一些已经被删除节点
  public remove(operation: DeleteOperation) {
    // 获取 Y.Doc 实例，准备开启一个事务
    const { id } = operation

    // 找到要标记的节点
    const targetNode = this.getYNode(id)
    if (!targetNode) {
      // eslint-disable-next-line no-console
      console.warn(`[Soft Delete] Node with ID ${id} not found.`)
      return {}
    }

    targetNode.set('_node_deleted', true)

    return {
      current: undefined,
      previous: targetNode
    }
  }

  // 节点向上或者向下移动
  public move(operation: MoveOperation) {
    const { parentId, targetId, direction } = operation

    let childrenArray: Y.Array<Y.Map<any>> | undefined
    if (parentId) {
      const parentNode = this.getYNode(parentId)
      if (!parentNode) {
        // eslint-disable-next-line no-console
        console.error(`[Move] Parent node with ID ${parentId} not found.`)
        return
      }
      childrenArray = parentNode.get('children') as Y.Array<Y.Map<any>>
    } else {
      // 没有 parentId 则说明是在根元素下进行移动
      childrenArray = this.yMap.get('children')
    }

    if (!childrenArray || childrenArray.length < 2) return

    const targetIndex = childrenArray.toArray().findIndex((node) => node.get('id') === targetId)
    if (targetIndex === -1) return

    const swapIndex = direction === 'up' ? targetIndex - 1 : targetIndex + 1
    if (swapIndex < 0 || swapIndex >= childrenArray.length) return

    // 调用交换函数
    this.swapYArrayElements(childrenArray, targetIndex, swapIndex, parentId, targetId, direction)
  }

  // 修改节点样式
  public updatedStyle(operation: UpdateStyleOperation) {
    const { strStyle, nodeId, className } = operation
    // 添加样式
    this.yMap.set('css', strStyle)

    // 添加 class 类名
    const targetNode = this.getYNode(nodeId)
    targetNode?.get('props').set('className', `${className}_${nodeId}`)

    Object.assign(this.rootSchema, { css: strStyle })
  }

  // 修改节点属性
  public updatedProps(operation: UpdatePropsOperation) {
    const { newProps, nodeId, overwrite } = operation
    let node = this.getYNode(nodeId)

    if (!node) {
      node = this.yMap
    }

    const yNewProps = new Y.Map<any>() // 新的 props
    const propsMap = node.get('props') as Y.Map<any> // 旧的 props

    if (overwrite) {
      // 覆盖模式
      for (const [k, v] of Object.entries(newProps || {})) {
        yNewProps.set(k, v)
      }
    } else {
      // 先复制旧的
      if (propsMap) {
        propsMap.forEach((val, key) => {
          yNewProps.set(key, val)
        })
      }

      // 再合并新的
      for (const [k, v] of Object.entries(newProps) || {}) {
        yNewProps.set(k, v)
      }
    }

    // 元数据，用于补丁操作
    const meta = new Y.Map<any>()
    meta.set('nodeId', nodeId)
    meta.set('overwrite', overwrite)

    yNewProps.set('meta', meta)
    node.set('props', yNewProps)
  }

  // 重建整个映射（刷新后可以手动调用）
  public rebuildYNodeMap(rootSchema: PageSchema) {
    this.yNodeMap.clear()
    const yChildren = this.yMap.get('children') as Y.Array<Y.Map<any>>
    this.setYNode(rootSchema.children, yChildren)
  }

  // 获取或者创建 Y.Map 的映射
  private setYNode(nodeData: Node[] | Node | undefined, yNode: Y.Array<Y.Map<any>> | Y.Map<any>) {
    if (!nodeData) return
    // 情况 1：nodeData 是数组，yNodes 是 Y.Array，用于初始化
    if (Array.isArray(nodeData) && yNode instanceof Y.Array) {
      nodeData.forEach((childData, index) => {
        const childYMap = yNode.get(index)
        if (!childData?.id || !childYMap) return

        this.yNodeMap.set(childData.id, childYMap)

        const grandChildren = childYMap.get('children') as Y.Array<Y.Map<any>>
        if (childData.children && grandChildren) {
          this.setYNode(childData.children, grandChildren)
        }
      })
      return
    }

    // 情况 2：nodeData 是单个对象，yNode 是 Y.Map，用于添加新的节点
    if (!Array.isArray(nodeData) && nodeData.id && yNode instanceof Y.Map) {
      this.yNodeMap.set(nodeData.id, yNode)

      const childrenArray = yNode.get('children') as Y.Array<Y.Map<any>>
      if (nodeData.children && childrenArray) {
        this.setYNode(nodeData.children, childrenArray)
      }
    }
  }

  // 根据 id 获取 Y.Map 节点
  public getYNode(id: string): Y.Map<any> | undefined {
    return this.yNodeMap.get(id)
  }

  // 递归地从 yNodeMap 中删除一个节点及其所有后代节点。
  private recursivelyDeleteFromMap(nodeId: string): void {
    const nodeToDelete = this.getYNode(nodeId)

    if (nodeToDelete) {
      const children = nodeToDelete.get('children') as Y.Array<Y.Map<any>> | undefined
      if (children instanceof Y.Array) {
        children.toArray().forEach((child) => {
          if (child instanceof Y.Map) {
            const childId = child.get('id')
            if (childId) {
              this.recursivelyDeleteFromMap(childId)
            }
          }
        })
      }
    }

    // 最后，删除当前节点自身的引用
    this.yNodeMap.delete(nodeId)
  }

  // 交换 yArray 两个相邻子项的位置，并使用“事件总线”模式广播操作意图
  private swapYArrayElements(
    yarray: Y.Array<Y.Map<any>>,
    index1: number,
    index2: number,
    parentId: string | undefined,
    schemaId: string,
    direction: 'down' | 'up'
  ): void {
    if (index1 === index2 || index1 < 0 || index2 < 0 || index1 >= yarray.length || index2 >= yarray.length) {
      // eslint-disable-next-line no-console
      console.warn('Invalid or identical indices provided for swap. No action taken.')
      return
    }

    // 获取或创建专门用于事件通信的 Y.Map
    const eventsMap = this.yDoc.getMap('__app_events__')

    // 准备事件的“负载” (payload)，这是将被广播的数据
    const eventPayload = {
      op: 'move',
      direction,
      parentId,
      schemaId,
      targetIndex: index1,
      swapIndex: index2,
      timestamp: Date.now()
    }

    // 在同一个事务中，既执行数据交换，也发出事件
    this.yDoc.transact(() => {
      const i = Math.max(index1, index2)
      const j = Math.min(index1, index2)
      const elementI = yarray.get(i)
      const elementJ = yarray.get(j)

      // 类型安全的深拷贝函数
      const cloneYMap = (el: Y.Map<any>): Y.Map<any> => {
        const newMap = new Y.Map<any>()
        toYjs(newMap, el.toJSON())
        return newMap
      }

      const cloneI = cloneYMap(elementI)
      const cloneJ = cloneYMap(elementJ)

      yarray.delete(i, 1)
      yarray.delete(j, 1)

      yarray.insert(j, [cloneI])
      yarray.insert(i, [cloneJ])

      this.setYNode(this.rootSchema.children, this.yMap.get('children'))

      // 构建唯一 ID
      const eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      eventsMap.set(eventId, eventPayload)
    })
  }
}
