import type {
  DeleteOperation,
  MoveOperation,
  Node,
  NodeOperation,
  PageSchema,
  UpdateAttributesOperation,
  UpdateMethodsOperation,
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

  public insert(operation: NodeOperation): { current: Node; previous?: undefined } {
    const { parentId, newNodeData, position, referTargetNodeId } = operation
    // 父元素不存在，则默认为根节点
    const parentNode = parentId ? this.getYNode(parentId) : this.yMap

    if (!parentNode) {
      // eslint-disable-next-line no-console
      console.warn(`[Insert Operation] Parent node with ID "${parentId}" not found in schema. Aborting.`)
      return { current: newNodeData }
    }

    // 在一个事务中执行所有的 Yjs 修改，以保证原子性
    this.yDoc.transact(() => {
      // 获取或创建父节点的 'children' Y.Array
      let yChildren = parentNode.get('children') as Y.Array<Y.Map<any>>
      if (!yChildren) {
        yChildren = new Y.Array()
        parentNode.set('children', yChildren)
      }

      // 将纯净的、普通的 JavaScript 对象 newNodeData 转换为 Y.Map
      const yNewNode = new Y.Map()
      toYjs(yNewNode, newNodeData)

      // 查找参考节点在 'children' 数组中的索引
      const index = yChildren.toArray().findIndex((node) => node.get('id') === referTargetNodeId)

      // 根据 'position' 策略，将新节点插入到 'children' 数组的正确位置
      switch (position) {
        case 'before': {
          yChildren.insert(index === -1 ? 0 : index, [yNewNode])
          break
        }
        case 'out': {
          const referenceNode = this.getYNode(referTargetNodeId)
          if (referenceNode) {
            const childrenOfReference = referenceNode.get('children')
            // 如果被包裹的节点有子节点，需要将其子节点也一并带过来
            if (childrenOfReference instanceof Y.Array) {
              yNewNode.set('children', childrenOfReference.clone())
            }
            // 将被包裹的就节点标记为删除
            yChildren.get(index)?.set('_node_deleted', true)
            yChildren.insert(index, [yNewNode])
          }
          break
        }
        case 'replace': {
          if (index !== -1) {
            // 将被替换的旧节点标记为删除
            yChildren.get(index)?.set('_node_deleted', true)
            yChildren.insert(index, [yNewNode])
          }
          break
        }
        case 'bottom': {
          yChildren.insert(index + 1, [yNewNode])
          break
        }
        default: {
          yChildren.insert(index === -1 ? yChildren.length : index + 1, [yNewNode])
          break
        }
      }

      // 更新内部的 nodeId -> Y.Map 快速访问映射，以包含这个新节点
      this.setYNode(newNodeData, yNewNode)

      // 通过事件总线发布操作意图，获取或创建专门用于事件通信的 Y.Map
      const eventsMap = this.yDoc.getMap('__app_events__')

      const eventPayload = {
        op: 'insert',
        parentId,
        newNodeData,
        position,
        referTargetNodeId,
        timestamp: Date.now()
      }

      // 使用唯一 ID 发布事件，以便于追踪和删除
      const eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      eventsMap.set(eventId, eventPayload)
    }, 'local-insert-operation')

    return {
      current: newNodeData,
      previous: undefined
    }
  }

  // 处理节点的软删除操作
  // 它会在目标节点的 Y.Map 上设置 '_node_deleted: true' 标志，
  // 并通过 '事件总线' 发布一个 'delete' 操作意图。
  public remove(operation: DeleteOperation) {
    const { id } = operation

    // 找到要标记的节点
    const targetNode = this.getYNode(id)
    if (!targetNode) {
      // eslint-disable-next-line no-console
      console.warn(`[Soft Delete] Node with ID ${id} not found.`)
      return {}
    }

    // 将 Y.Map 转换回普通 JS 对象，以便在返回和事件负载中使用
    const previousNodeData = targetNode.toJSON() as Node

    // 开启事务保证原子性
    this.yDoc.transact(() => {
      // 在目标节点上设置软删除标志，防止幽灵事件
      targetNode.set('_node_deleted', true)

      // 获取事件总线
      const eventsMap = this.yDoc.getMap('__app_events__')

      // 准备事件负载
      const eventPayload = {
        op: 'delete',
        deletedNodeId: id,
        // TODO: 可以在负载中包含被删除前的数据，便于远程客户端做一些高级处理（如 "恢复" 功能）
        previousNodeData,
        timestamp: Date.now()
      }

      // 使用唯一 ID 发布事件
      const eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      eventsMap.set(eventId, eventPayload)
    }, 'local-delete-operation')

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

    let swapIndex = direction === 'up' ? targetIndex - 1 : targetIndex + 1

    // 判断 swapIndex 索引所在的节点是否是已删除节点
    while (swapIndex >= 0 && swapIndex < childrenArray.length) {
      const swapNode = childrenArray.get(swapIndex)
      const isDelete = swapNode.get('_node_deleted') === true || swapNode.get('_node_deleted') === 'true'

      if (!isDelete) {
        // 不是被删除节点，停止循环
        break
      }

      // 如果是被删除节点，则继续往前找或往后找
      swapIndex = direction === 'up' ? swapIndex - 1 : swapIndex + 1
    }

    if (swapIndex < 0 || swapIndex >= childrenArray.length) {
      // eslint-disable-next-line no-console
      console.warn(`[Move] No valid swap target found for direction: ${direction}`)
      return
    }

    // 调用交换函数
    this.swapYArrayElements(
      childrenArray,
      targetIndex,
      swapIndex,
      parentId,
      targetId,
      childrenArray.get(swapIndex).get('id'),
      direction
    )
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

  // 修改节点 Props
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

  // 添加 或 更新 methods
  public updatedMethods(operation: UpdateMethodsOperation) {
    if (operation.type === 'root') {
      const methods = operation.methods
      // 根节点直接设置 methods 不需要 id
      this.yMap.set('methods', methods)
    } else if (operation.type === 'node') {
      const { nodeId, methodsName, methods } = operation
      const node = this.getYNode(nodeId)
      if (node) {
        const nodeProps = node.get('props')
        nodeProps.set(methodsName, {
          ...methods,
          meta: { nodeId }
        })
      }
    } else if (operation.type === 'delete-method') {
      const { nodeId, methodsName } = operation
      const node = this.getYNode(nodeId)
      if (node) {
        const nodeProps = node.get('props')
        // 依旧软删除
        nodeProps.set(methodsName, {
          _methods_deleted: true,
          meta: { nodeId }
        })
        // 软删除后直接硬删除删除，保证 yMap 数据干净
        nodeProps.delete(methodsName)
      }
    }
  }

  // 更新节点属性
  public updatedAttributes(opertion: UpdateAttributesOperation) {
    const { type, nodeId } = opertion
    const targetNode = this.getYNode(nodeId)

    switch (type) {
      case 'condition': {
        targetNode?.set('condition', opertion.value)
        break
      }
      case 'loop': {
        targetNode?.set('loop', opertion.value)
        break
      }
      case 'loopArgs': {
        targetNode?.set('loopArgs', opertion.value)
        break
      }
      case 'clean': {
        this.yDoc.transact(() => {
          // 合并为一次操作
          targetNode?.delete('loop')
          targetNode?.delete('loopArgs')
        })
        break
      }
      default:
        break
    }
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
      nodeData.forEach((childData) => {
        if (!childData?.id) return

        let matchedYMap: Y.Map<any> | undefined

        // 遍历当前 Y.Array，找到 id 匹配的 Y.Map
        for (let i = 0; i < yNode.length; i++) {
          const childYMap = yNode.get(i)
          if (childYMap.get('id') === childData.id) {
            matchedYMap = childYMap
            break // 找到就退出循环
          }
        }

        if (!matchedYMap) return // 没找到就跳过

        this.yNodeMap.set(childData.id, matchedYMap)

        const grandChildren = matchedYMap.get('children') as Y.Array<Y.Map<any>>
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
  public getYNode(id: string | undefined): Y.Map<any> | undefined {
    if (!id) return undefined
    return this.yNodeMap.get(id)
  }

  // 交换 yArray 两个相邻子项的位置，并使用“事件总线”模式广播操作意图
  private swapYArrayElements(
    yarray: Y.Array<Y.Map<any>>,
    index1: number,
    index2: number,
    parentId: string | undefined,
    schemaId: string,
    swapId: string,
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
      swapId,
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
