import { reactive, computed, toRaw } from 'vue'
import type { ComputedRef } from 'vue'
import type { PositionType } from '../container'
import { useMultiSelect } from './useMultiSelect'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import { NODE_TAG, NODE_UID } from '../../../common'
import {
  lineState,
  querySelectById,
  removeNode,
  getController,
  getElement,
  getConfigure,
  allowInsert,
  POSITION,
  insertNode,
  syncNodeScroll,
  dragState,
  initialDragState,
  isAncestor,
  getDocument
} from '../container'

interface Position {
  x: number
  y: number
}

interface Offset {
  offsetX: number
  offsetY: number
  initialX: number
  initialY: number
}

interface NodeSchema {
  id: string
  componentName: string
  children?: NodeSchema[]
  [key: string]: any
}

interface MultiDragState {
  keydown: boolean
  draging: boolean
  dragStarted: boolean
  initialMousePos: Position | null
  nodes: NodeSchema[]
  offsets: Map<string, Offset>
  mouse: Position | null
  position: PositionType | null
  targetNodeId: string | null
}

interface SelectState {
  id: string
  componentName: string
  schema: NodeSchema
  top?: number
  left?: number
  width?: number
  height?: number
  doc?: Document
  [key: string]: any
}

interface InsertOperation {
  sourceId: string
  targetNodeData: {
    parent: NodeSchema | null
    node: NodeSchema
    data: NodeSchema
  }
  position: PositionType
}

const initialMultiDragState: MultiDragState = {
  keydown: false,
  draging: false,
  dragStarted: false, // 标记是否已经开始拖拽
  initialMousePos: null, // 初始鼠标位置
  nodes: [], // 存储被拖拽的多个节点信息
  offsets: new Map<string, Offset>(), // 存储每个节点的偏移量
  mouse: null, // 鼠标位置
  position: null, // 放置位置
  targetNodeId: null // 当前点击的节点ID
}

// 拖拽阈值，鼠标移动超过这个距离才会触发拖拽
const DRAG_THRESHOLD = 5

export const useMultiDrag = () => {
  const multiDragState = reactive<MultiDragState>({ ...initialMultiDragState })
  const { multiSelectedStates } = useMultiSelect()
  const multiStateLength = computed<number>(() => (multiSelectedStates.value as SelectState[]).length)

  // 准备拖拽 - 仅记录初始状态，不立即开始拖拽
  const startMultiDrag = (event: MouseEvent, element: HTMLElement): boolean => {
    if (multiStateLength.value <= 1) return false

    // 检查点击的元素是否是已选中的节点之一
    const clickedNodeId = element?.getAttribute(NODE_UID)
    if (!clickedNodeId || !(multiSelectedStates.value as SelectState[]).some((state) => state.id === clickedNodeId)) {
      return false
    }

    const { clientX, clientY } = event
    multiDragState.keydown = true
    multiDragState.dragStarted = false
    multiDragState.draging = false
    multiDragState.initialMousePos = { x: clientX, y: clientY }
    multiDragState.targetNodeId = clickedNodeId
    multiDragState.nodes = toRaw(multiSelectedStates.value as SelectState[]).map((state) => state.schema)

    // 计算每个节点相对于鼠标的偏移量
    ;(multiSelectedStates.value as SelectState[]).forEach((state) => {
      const elem = querySelectById(state.id)
      if (elem) {
        const { x, y } = elem.getBoundingClientRect()
        multiDragState.offsets.set(state.id, {
          offsetX: clientX - x,
          offsetY: clientY - y,
          initialX: x,
          initialY: y
        })
      }
    })

    return true
  }

  // 计算放置位置
  const calculateDropPosition = (
    event: MouseEvent,
    rect: DOMRect,
    configure: { isContainer?: boolean } | null
  ): PositionType => {
    const { clientX: mouseX, clientY: mouseY } = event
    // 参考单选节点的实现，使用更精确的计算方式
    const yAbs = Math.min(20, rect.height / 3)
    const xAbs = Math.min(20, rect.width / 3)

    // 优先判断是否在边缘区域
    if (mouseY < rect.top + yAbs) {
      return POSITION.TOP
    } else if (mouseY > rect.bottom - yAbs) {
      return POSITION.BOTTOM
    } else if (mouseX < rect.left + xAbs) {
      return POSITION.LEFT
    } else if (mouseX > rect.right - xAbs) {
      return POSITION.RIGHT
    } else if (configure?.isContainer) {
      // 如果是容器，且鼠标在中间区域，则放置到容器内
      return POSITION.IN
    }

    // 默认放置到底部
    return POSITION.BOTTOM
  }

  // 计算鼠标移动距离
  const calculateDistance = (pos1: Position | null, pos2: Position | null): number => {
    if (!pos1 || !pos2) return 0
    const dx = pos1.x - pos2.x
    const dy = pos1.y - pos2.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  // 检查是否允许放置
  const checkAllowInsert = (
    configure: { isContainer?: boolean } | null,
    nodes: NodeSchema[],
    targetId: string,
    position: PositionType
  ): boolean => {
    // 如果没有配置，不允许放置
    if (!configure) return false

    // 获取目标节点的信息
    const { parent: targetParent } = useCanvas().getNodeWithParentById(targetId) || {}
    const targetParentId = targetParent?.id

    // 如果目标是body，特殊处理
    if (targetId === 'body') {
      // 对于body，允许放置到内部、上方和下方
      if (position !== POSITION.IN && position !== POSITION.TOP && position !== POSITION.BOTTOM) {
        // 强制将position设置为IN，因为body只能放置到内部、上方或下方
        lineState.position = POSITION.IN
      }

      // 检查所有节点是否都允许放置到body内
      for (const node of nodes) {
        if (!allowInsert({ isContainer: true }, node)) {
          return false
        }
      }
      return true
    }

    // 如果目标节点的父节点是body，特殊处理
    if (targetParentId === 'body') {
      // 允许在body的直接子节点前后放置
      if (position === POSITION.TOP || position === POSITION.BOTTOM) {
        // 检查所有节点是否都允许放置到body内
        for (const node of nodes) {
          if (!allowInsert({ isContainer: true }, node)) {
            return false
          }
        }
        return true
      }
    }

    // 检查所有节点是否都允许放置
    for (const node of nodes) {
      // 如果是放置到容器内，检查节点是否是目标节点的祖先
      if (position === POSITION.IN && isAncestor(node.id, targetId)) {
        return false
      }

      // 如果是放置到节点前后，检查节点是否是目标节点的父节点
      if (
        (position === POSITION.TOP ||
          position === POSITION.BOTTOM ||
          position === POSITION.LEFT ||
          position === POSITION.RIGHT) &&
        node.id === targetParentId
      ) {
        return false
      }

      // 检查节点是否允许放置到目标位置
      if (position === POSITION.IN) {
        // 放置到容器内需要检查容器的配置
        if (!allowInsert(configure, node)) {
          return false
        }
      } else {
        // 放置到节点前后需要检查父节点的配置
        const parentConfigure = targetParent ? getConfigure(targetParent.componentName) : { isContainer: true }
        if (!allowInsert(parentConfigure, node)) {
          return false
        }
      }
    }

    return true
  }

  // 初始化拖拽状态
  const initDragState = (currentMousePos: Position): boolean => {
    if (!multiDragState.dragStarted) {
      const distance = calculateDistance(multiDragState.initialMousePos, currentMousePos)

      // 如果移动距离小于阈值，不触发拖拽
      if (distance < DRAG_THRESHOLD) {
        return false // 不启动拖拽
      }

      // 超过阈值，标记拖拽已开始
      multiDragState.dragStarted = true

      // 清除单选拖动状态，防止单选拖动的虚影显示
      Object.assign(dragState, initialDragState)
    }

    if (!multiDragState.draging && multiDragState.dragStarted) {
      multiDragState.draging = true
    }

    return multiDragState.draging
  }

  // 处理 body 元素的放置逻辑
  const handleBodyPlacement = (event: MouseEvent, body: HTMLElement): boolean => {
    // 获取body中的所有顶级节点
    const { getSchema } = useCanvas()
    const bodySchema = getSchema()
    const bodyChildren = bodySchema.children || []

    // 如果body中没有子节点，直接放置到body内部
    if (bodyChildren.length === 0) {
      const bodyRect = body.getBoundingClientRect()
      Object.assign(lineState, {
        id: 'body',
        top: bodyRect.top,
        left: bodyRect.left,
        width: bodyRect.width,
        height: bodyRect.height,
        position: POSITION.IN,
        forbidden: false,
        configure: { isContainer: true }
      })
      return true
    }

    // 如果body中有子节点，需要判断放置位置
    const { clientY } = event
    let closestNode: HTMLElement | null = null
    let closestDistance = Infinity
    let position: PositionType = POSITION.IN // 默认放置到body内部

    // 遍历body的直接子节点，找到最接近鼠标位置的节点
    for (const childSchema of bodyChildren) {
      const childElement = querySelectById(childSchema.id)
      if (!childElement) continue

      const childRect = childElement.getBoundingClientRect()
      const childMiddle = childRect.top + childRect.height / 2

      // 计算鼠标与节点中点的距离
      const distance = Math.abs(clientY - childMiddle)

      if (distance < closestDistance) {
        closestDistance = distance
        closestNode = childElement

        // 判断放置位置：在节点上方还是下方
        position = clientY < childMiddle ? POSITION.TOP : POSITION.BOTTOM
      }
    }

    // 如果找到了最近的节点
    if (closestNode) {
      const nodeId = closestNode.getAttribute(NODE_UID)
      const componentName = closestNode.getAttribute(NODE_TAG)
      const configure = getConfigure(componentName)
      const rect = closestNode.getBoundingClientRect()

      // 检查是否允许放置
      const isForbidden = !checkAllowInsert(configure, multiDragState.nodes, nodeId!, position)

      // 更新lineState
      Object.assign(lineState, {
        id: nodeId,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        position: position,
        forbidden: isForbidden,
        configure
      })
    } else {
      // 如果没有找到合适的节点，放置到body内部
      const bodyRect = body.getBoundingClientRect()
      Object.assign(lineState, {
        id: 'body',
        top: bodyRect.top,
        left: bodyRect.left,
        width: bodyRect.width,
        height: bodyRect.height,
        position: POSITION.IN,
        forbidden: false,
        configure: { isContainer: true }
      })
    }

    return true
  }

  // 处理自身节点的拖拽
  const handleSelfNodeDrag = (targetId: string, rect: DOMRect, configure: any, position: PositionType): boolean => {
    // 获取目标节点的父节点和兄弟节点
    const { getNodeWithParentById } = useCanvas()
    const { parent } = getNodeWithParentById(targetId) || {}

    if (!parent) {
      lineState.forbidden = true
      return true
    }

    // 根据放置位置调整目标节点
    const children = parent.children || []
    const targetIndex = children.findIndex((child: NodeSchema) => child.id === targetId)

    // 如果是放置到节点下方，使用下一个兄弟节点作为目标
    if ((position === POSITION.BOTTOM || position === POSITION.RIGHT) && targetIndex < children.length - 1) {
      const nextSibling = children[targetIndex + 1]
      if (nextSibling && !multiDragState.nodes.some((node) => node.id === nextSibling.id)) {
        // 使用下一个兄弟节点作为目标
        const nextElement = querySelectById(nextSibling.id)
        if (nextElement) {
          const nextRect = nextElement.getBoundingClientRect()
          const nextComponentName = nextElement.getAttribute(NODE_TAG)
          const nextConfigure = getConfigure(nextComponentName)

          // 更新lineState
          Object.assign(lineState, {
            id: nextSibling.id,
            top: nextRect.top,
            left: nextRect.left,
            width: nextRect.width,
            height: nextRect.height,
            position: POSITION.TOP, // 放置到下一个节点的上方
            forbidden: !checkAllowInsert(nextConfigure, multiDragState.nodes, nextSibling.id, POSITION.TOP),
            configure: nextConfigure
          })

          return true
        }
      }
    }

    // 如果是放置到节点上方，或者是最后一个节点的下方
    if (
      position === POSITION.TOP ||
      position === POSITION.LEFT ||
      (position === POSITION.BOTTOM && targetIndex === children.length - 1) ||
      (position === POSITION.RIGHT && targetIndex === children.length - 1)
    ) {
      // 检查是否允许放置
      const isForbidden = !checkAllowInsert(configure, multiDragState.nodes, targetId, position)

      // 更新lineState
      Object.assign(lineState, {
        id: targetId,
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        position: position,
        forbidden: isForbidden,
        configure
      })

      return true
    }

    // 默认情况下，禁止放置
    lineState.forbidden = true
    return true
  }

  // 处理容器内放置
  const handleContainerPlacement = (targetId: string, rect: DOMRect, configure: any, isForbidden: boolean): boolean => {
    const { getNodeWithParentById, getSchema } = useCanvas()
    const { node } = targetId === 'body' ? { node: getSchema() } : getNodeWithParentById(targetId) || {}
    const children = node?.children || []

    // 如果容器有子节点，考虑放置到最后一个子节点后面
    if (children.length > 0) {
      const lastChild = children[children.length - 1]
      // 如果最后一个子节点不是被拖拽的节点之一
      if (!multiDragState.nodes.some((node) => node.id === lastChild.id)) {
        const childElement = querySelectById(lastChild.id)
        if (childElement) {
          const childRect = childElement.getBoundingClientRect()

          // 更新lineState，显示在最后一个子节点下方
          Object.assign(lineState, {
            id: targetId, // 保持目标是容器
            top: childRect.top,
            left: childRect.left,
            width: childRect.width,
            height: childRect.height,
            position: POSITION.IN, // 仍然表示放置到容器内
            forbidden: isForbidden,
            configure
          })

          return true
        }
      }
    }

    // 更新lineState
    Object.assign(lineState, {
      id: targetId,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      position: POSITION.IN,
      forbidden: isForbidden,
      configure
    })

    return true
  }

  // 更新线框提示状态
  const updateLineFeedback = (targetId: string, rect: DOMRect, configure: any, position: PositionType): void => {
    // 检查是否允许放置
    const isForbidden = !checkAllowInsert(configure, multiDragState.nodes, targetId, position)

    // 特殊处理容器内放置
    if (position === POSITION.IN && configure?.isContainer) {
      handleContainerPlacement(targetId, rect, configure, isForbidden)
      return
    }

    // 更新lineState
    Object.assign(lineState, {
      id: targetId,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      position,
      forbidden: isForbidden,
      configure
    })
  }

  // 拖拽移动
  const moveMultiDrag = (event: MouseEvent): boolean => {
    if (!multiDragState.keydown || multiStateLength.value <= 1) return false

    const { clientX, clientY } = event
    const currentMousePos: Position = { x: clientX, y: clientY }

    // 更新鼠标位置
    multiDragState.mouse = currentMousePos

    // 初始化拖拽状态，检查是否应该开始拖拽
    if (!initDragState(currentMousePos)) {
      return true // 返回true表示已处理，但不启动拖拽
    }

    const targetElement = getElement(event.target as HTMLElement)

    // 特殊处理：如果没有找到目标元素，检查是否是body元素或其直接子元素
    if (!targetElement) {
      const doc = getDocument()
      const body = doc.body

      // 如果鼠标在body区域内，则视为拖拽到body
      if (
        event.target === body ||
        (event.target as HTMLElement).parentElement === body ||
        event.target === doc.documentElement
      ) {
        return handleBodyPlacement(event, body)
      }

      // 其他情况，设置为禁止放置
      lineState.position = ''
      lineState.forbidden = true
      return true
    }

    // 获取目标元素信息
    const componentName = targetElement.getAttribute(NODE_TAG)
    const configure = getConfigure(componentName)
    const rect = targetElement.getBoundingClientRect()
    const targetId = targetElement.getAttribute(NODE_UID) || 'body'

    // 计算放置位置
    const position = calculateDropPosition(event, rect, configure)

    // 检查是否是拖拽自身节点
    const isDraggingSelf = multiDragState.nodes.some((node) => node.id === targetId)

    // 如果是拖拽到自身节点，需要特殊处理
    if (isDraggingSelf && position !== POSITION.IN) {
      return handleSelfNodeDrag(targetId, rect, configure, position)
    }

    // 更新线框提示状态
    updateLineFeedback(targetId, rect, configure, position)

    return true
  }

  // 检查是否应该处理拖拽
  const shouldProcessDrag = (): boolean => {
    // 检查是否处于多选状态
    if (multiStateLength.value <= 1) {
      // 重置状态但不做其他处理
      Object.assign(multiDragState, initialMultiDragState)
      return false
    }

    // 检查是否按下了鼠标但没有拖拽
    if (!multiDragState.draging && !multiDragState.dragStarted && multiDragState.keydown) {
      // 鼠标按下但没有拖拽，重置状态
      Object.assign(multiDragState, initialMultiDragState)
      return true // 返回true表示已处理
    }

    // 只有真正开始拖拽后才处理放置逻辑
    if (!multiDragState.draging || !multiDragState.dragStarted) {
      // 重置状态
      Object.assign(multiDragState, initialMultiDragState)
      return false
    }

    return true
  }

  // 获取目标节点信息
  const getTargetNodeInfo = (targetId: string) => {
    const { getNodeWithParentById, getSchema } = useCanvas()
    const { node: targetNode, parent: targetParent } = getNodeWithParentById(targetId) || {}
    const isBodyTarget = targetId === 'body'

    // 如果目标是body，使用页面schema作为目标节点
    const finalTargetNode = isBodyTarget ? getSchema() : targetNode
    const finalTargetParent = isBodyTarget ? null : targetParent

    return {
      targetNode,
      targetParent,
      isBodyTarget,
      finalTargetNode,
      finalTargetParent
    }
  }

  // 收集拖拽操作
  const collectDragOperations = (targetInfo: any, position: PositionType | null): InsertOperation[] => {
    const { finalTargetNode, finalTargetParent } = targetInfo
    const targetId = lineState.id as string
    const operations: InsertOperation[] = []

    // 收集要移动的节点ID，用于后续检查
    const movingNodeIds = multiDragState.nodes.map((node) => node.id)

    // 按照拖拽顺序依次插入节点
    multiDragState.nodes.forEach((node) => {
      const sourceId = node.id
      const { node: sourceNode, parent: sourceParent } = useCanvas().getNodeWithParentById(sourceId) || {}

      // 跳过目标节点自身
      if (sourceId === targetId) {
        return
      }

      // 如果源节点的父节点是目标节点，且放置位置是IN，则跳过（避免循环引用）
      if (position === POSITION.IN && sourceParent?.id === targetId) {
        return
      }

      // 如果目标节点的父节点是正在移动的节点之一，且不是放置到容器内，则跳过
      if (position !== POSITION.IN && finalTargetParent && movingNodeIds.includes(finalTargetParent.id)) {
        return
      }

      // 准备插入数据
      const insertData = { ...sourceNode }
      const targetNodeData = {
        parent: toRaw(finalTargetParent),
        node: toRaw(finalTargetNode),
        data: { ...insertData, children: insertData.children || [] }
      }

      // 记录操作
      operations.push({
        sourceId,
        targetNodeData,
        position: position as PositionType
      })
    })

    return operations
  }

  // 计算节点之间的相对位置
  const calculateRelativePositions = (nodeIds: string[]): Map<string, { top: number; left: number }> => {
    const positions = new Map<string, { top: number; left: number }>()

    // 获取所有节点的初始位置
    nodeIds.forEach((id) => {
      const elem = querySelectById(id)
      if (elem) {
        const rect = elem.getBoundingClientRect()
        positions.set(id, {
          top: rect.top,
          left: rect.left
        })
      }
    })

    return positions
  }

  // 按相对位置排序操作，并根据拖拽方向调整插入顺序
  const sortOperationsByPosition = (
    operations: InsertOperation[],
    positions: Map<string, { top: number; left: number }>,
    position: PositionType
  ): InsertOperation[] => {
    // 根据节点的原始位置进行排序
    const sortedOperations = [...operations].sort((a, b) => {
      const posA = positions.get(a.sourceId)
      const posB = positions.get(b.sourceId)

      if (!posA || !posB) return 0

      // 先按垂直位置排序
      if (Math.abs(posA.top - posB.top) > 5) {
        return posA.top - posB.top
      }

      // 如果垂直位置接近，则按水平位置排序
      return posA.left - posB.left
    })

    // 获取拖拽的目标位置，根据位置调整插入顺序
    if (position === POSITION.BOTTOM || position === POSITION.RIGHT) {
      return sortedOperations.reverse()
    } else if (position === POSITION.IN) {
      return sortedOperations
    } else {
      return sortedOperations
    }
  }

  // 将节点插入到目标位置
  const insertNodeToTarget = (op: InsertOperation, isBodyTarget: boolean, targetId: string) => {
    // 对于body特殊处理
    if (isBodyTarget) {
      // 需要构建正确的目标节点数据
      const { getNodeWithParentById } = useCanvas()
      const { node: targetChildNode, parent: targetChildParent } = getNodeWithParentById(targetId) || {}

      if (targetChildNode && targetChildParent) {
        const targetNodeData = {
          parent: toRaw(targetChildParent),
          node: toRaw(targetChildNode),
          data: op.targetNodeData.data
        }

        // 使用正确的位置和目标节点插入
        insertNode(targetNodeData, op.position, false)
        return
      }

      // 如果没有特定位置或找不到目标子节点，则默认插入到body内部
      insertNode({ node: useCanvas().getSchema(), data: op.targetNodeData.data }, POSITION.IN, false)
    } else {
      insertNode(op.targetNodeData, op.position, false)
    }
  }

  // 更新多选状态
  const updateMultiSelectionAfterDrag = (operations: InsertOperation[]) => {
    // 延迟执行，确保DOM已更新
    setTimeout(() => {
      // 重建多选状态
      const newMultiSelection: SelectState[] = []

      // 收集所有操作后的节点ID
      const newNodeIds = operations.map((op) => op.targetNodeData.data.id)

      // 构建新的多选状态
      newNodeIds.forEach((nodeId) => {
        const element = querySelectById(nodeId)
        if (element) {
          const { node } = useCanvas().getNodeWithParentById(nodeId) || {}
          if (!node) return

          const state: SelectState = {
            id: nodeId,
            componentName: element.getAttribute(NODE_TAG) || '',
            schema: node
          }

          const rect = element.getBoundingClientRect()
          Object.assign(state, {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            doc: getDocument()
          })

          newMultiSelection.push(state)
        }
      })

      // 同步节点滚动位置
      syncNodeScroll()
    }, 100)
  }

  // 执行拖拽操作
  const executeDragOperations = (operations: InsertOperation[], targetInfo: any) => {
    const { isBodyTarget } = targetInfo
    const targetId = lineState.id as string
    const position = lineState.position as PositionType

    const nodeIds = operations.map((op) => op.sourceId)

    // 计算节点的初始相对位置
    const positions = calculateRelativePositions(nodeIds)

    // 按照原始相对位置排序操作，并根据拖拽方向调整顺序
    const sortedOperations = sortOperationsByPosition(operations, positions, position)

    // 先移除所有源节点
    operations.forEach((op) => {
      removeNode(op.sourceId)
    })

    // 处理页面底部和容器的情况
    if (isBodyTarget && position === POSITION.BOTTOM) {
      // 放置到页面底部，始终保持从上到下的顺序
      const reorderedOperations = [...sortedOperations].reverse()
      reorderedOperations.forEach((op) => {
        insertNodeToTarget(op, isBodyTarget, targetId)
      })
    } else if (position === POSITION.IN) {
      // 放置到容器内部，应该保持原始从上到下的顺序
      sortedOperations.forEach((op) => {
        insertNodeToTarget(op, isBodyTarget, targetId)
      })
    } else {
      // 其他情况按照排序后的顺序插入
      sortedOperations.forEach((op) => {
        insertNodeToTarget(op, isBodyTarget, targetId)
      })
    }

    // 更新画布历史
    getController().addHistory()

    // 更新多选状态
    updateMultiSelectionAfterDrag(sortedOperations)
  }

  // 清理拖拽状态
  const cleanupDragState = () => {
    // 清理拖拽状态，但保留多选状态
    Object.assign(multiDragState, {
      ...initialMultiDragState,
      nodes: []
    })
  }

  // 结束拖拽
  const endMultiDrag = (): boolean => {
    // 检查是否处于多选状态或是否真正开始拖拽
    if (!shouldProcessDrag()) {
      return false
    }

    const { position, forbidden, id: targetId } = lineState

    // 如果目标位置不允许放置或没有目标ID，直接返回
    if (forbidden || !targetId) {
      cleanupDragState()
      return true
    }

    // 获取目标节点信息
    const targetInfo = getTargetNodeInfo(targetId)
    if (!targetInfo.finalTargetNode) {
      cleanupDragState()
      return true
    }

    // 收集拖拽操作
    const operations = collectDragOperations(targetInfo, position as PositionType)

    // 执行拖拽操作并更新选择状态
    if (operations.length > 0) {
      executeDragOperations(operations, targetInfo)
    }

    // 清理拖拽状态
    cleanupDragState()

    return true
  }

  // 判断是否处于多选拖拽状态
  const isMultiDragging = computed(() => {
    return multiDragState.draging && multiDragState.dragStarted && multiStateLength.value > 1
  })

  // 获取多选拖拽的位置描述
  const getMultiDragPositionText: ComputedRef<string> = computed(() => {
    if (!isMultiDragging.value) return ''

    const { position, forbidden, id } = lineState

    // 获取目标节点的组件名称，用于更详细的提示
    let targetComponentName = ''
    if (id && id !== 'body') {
      const targetElement = querySelectById(id)
      if (targetElement) {
        targetComponentName = targetElement.getAttribute(NODE_TAG) || ''
      }
    } else if (id === 'body') {
      targetComponentName = '页面'
    }

    if (forbidden) {
      return `当前位置不允许放置 (${targetComponentName || '目标节点'})`
    }

    switch (position) {
      case POSITION.TOP:
        return `放置到 ${targetComponentName || '目标节点'} 上方`
      case POSITION.BOTTOM:
        return `放置到 ${targetComponentName || '目标节点'} 下方`
      case POSITION.LEFT:
        return `放置到 ${targetComponentName || '目标节点'} 左侧`
      case POSITION.RIGHT:
        return `放置到 ${targetComponentName || '目标节点'} 右侧`
      case POSITION.IN:
        return `放置到 ${targetComponentName || '容器'} 内部`
      default:
        return ''
    }
  })

  return {
    multiDragState,
    getMultiDragPositionText,
    startMultiDrag,
    moveMultiDrag,
    endMultiDrag,
    cleanupDragState,
    isMultiDragging
  }
}
