import { ref } from 'vue'
import { useCanvas, useMessage, useHistory, getOptions } from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'
import { getRect, querySelectById, POSITION, insertNode, selectNode, canvasState } from '../container'
import type { Node } from '../../../types'

interface SelectionState {
  id: string
  top?: number
  left?: number
  width?: number
  height?: number
  schema?: any
  parent?: {
    id: string
    children: Node[]
  }
}

// 初始化多选节点
const multiSelectedStates = ref<SelectionState[]>([])
// 存储定时器引用，用于取消定时任务
let selectionUpdateTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 创建TinyPopover组件结构
 * @param {Object} props 组件属性
 * @param {Node | Node[]} content 内容节点
 * @returns {Node} TinyPopover组件结构
 */
const createTinyPopoverSchema = (props: Record<string, any> = {}, content: Node | Node[]): Node => {
  const children = Array.isArray(content) ? content : [content]

  return {
    componentName: 'TinyPopover',
    id: utils.guid(),
    props: {
      width: 200,
      title: '弹框标题',
      trigger: 'manual',
      modelValue: true,
      ...props
    },
    children: [
      {
        componentName: 'Template',
        id: utils.guid(),
        props: {
          slot: 'reference'
        },
        children
      },
      {
        componentName: 'Template',
        id: utils.guid(),
        props: {
          slot: 'default'
        },
        children: [
          {
            componentName: 'div',
            id: utils.guid(),
            props: {
              placeholder: '提示内容'
            }
          }
        ]
      }
    ]
  }
}

export const useMultiSelect = () => {
  const isMouseDown = ref(false)

  /**
   * 取消待执行的选择更新
   */
  const cancelSelectionUpdate = (): void => {
    // 清除定时器
    if (selectionUpdateTimer !== null) {
      clearTimeout(selectionUpdateTimer)
      selectionUpdateTimer = null
    }
  }

  /**
   * 添加state到多选列表
   * @param {SelectionState} selectState
   * @param {boolean} isMultiple 是否多选
   * @returns {boolean} 添加成功返回true，否则返回false
   */
  const toggleMultiSelection = (selectState: SelectionState, isMultiple: boolean = false): boolean => {
    if (!selectState || typeof selectState !== 'object') {
      return false
    }

    // 用户进行了新的选择操作，取消之前的延时选择更新
    cancelSelectionUpdate()

    // 多选
    if (isMultiple) {
      const isExistNode = multiSelectedStates.value.some((state) => state.id === selectState.id)
      // 如果多选列表已经存在选中的state且鼠标抬起，则将选中的state移出多选列表
      if (isExistNode && !isMouseDown.value) {
        multiSelectedStates.value = multiSelectedStates.value.filter((state) => state.id !== selectState.id)
      } else {
        multiSelectedStates.value = multiSelectedStates.value.concat(selectState)
      }

      return !isExistNode
    }

    // 单选
    multiSelectedStates.value = [selectState]

    return true
  }

  const refreshSelectionState = (): SelectionState[] => {
    multiSelectedStates.value = multiSelectedStates.value
      .filter((state) => {
        // 先检查元素是否存在，如果不存在则从选择列表移除
        const element = querySelectById(state.id)
        return !!element
      })
      .map((state) => {
        const element = querySelectById(state.id)
        // 由于上面已经过滤，这里element一定存在
        const { top, left, width, height } = getRect(element!)

        return {
          ...state,
          top,
          left,
          width,
          height
        }
      })

    return multiSelectedStates.value
  }

  const clearMultiSelection = (): void => {
    multiSelectedStates.value = []
  }

  /**
   * 获取选中节点在父节点children中的索引位置
   * @param {children} children 父节点的children
   * @param {string[]} selectedIds 选中的节点ID列表
   * @returns {number[]} 排序后的索引数组
   */
  const getSelectedNodeIndices = (children: Node[], selectedIds: string[]): number[] => {
    return selectedIds
      .map((id) => children.findIndex((child: Node) => child.id === id))
      .filter((index) => index !== -1)
      .sort((a, b) => a - b)
  }

  /**
   * 判断选中的节点是否都是兄弟节点且是连续的
   * @returns {boolean} 如果所有选中节点都有相同的父节点且在父节点的children中是连续的，返回true；否则返回false
   */
  const areSiblingNodes = (): boolean => {
    if (multiSelectedStates.value.length <= 1) return false

    // 一次性获取所有选中节点及其父节点信息
    const canvas = useCanvas()
    const nodesWithParent = multiSelectedStates.value.map((node) => canvas.getNodeWithParentById(node.id) || {})

    // 检查所有节点是否都有父节点
    if (nodesWithParent.some((node) => !node.parent)) return false

    // 获取第一个父节点并检查所有节点是否有相同的父节点
    const firstParent = nodesWithParent[0].parent
    const parentId = firstParent.id

    if (nodesWithParent.some((node) => node.parent.id !== parentId)) return false

    // 获取并检查索引
    const selectedIds = multiSelectedStates.value.map((state) => state.id)
    const nodeIndices = getSelectedNodeIndices(firstParent.children, selectedIds)

    // 检查索引是否连续
    return nodeIndices.every((value, index) => value === nodeIndices[0] + index)
  }

  /**
   * 更新添加父级节点后的选中状态
   * @param {string[]} newParentIds 新创建的父容器ID数组
   */
  const updateSelectionAfterAddParent = (newParentIds: string[]): void => {
    // 触发更新，通知结构变更
    useMessage().publish({ topic: 'schemaChange', data: {} })

    // 清除原有选中状态
    clearMultiSelection()

    // 取消之前可能存在的定时器
    cancelSelectionUpdate()

    // 设置新的定时器并保存引用
    selectionUpdateTimer = setTimeout(() => {
      if (newParentIds.length > 0) {
        // 如果只有一个容器，直接选中
        if (newParentIds.length === 1) {
          const canvas = useCanvas()
          const nodeId = newParentIds[0]
          const nodeWithParent = canvas.getNodeWithParentById(nodeId)
          if (nodeWithParent) {
            canvas.setNode(nodeWithParent.node, nodeWithParent.parent)
          }
          selectNode(nodeId)
        } else {
          // 先收集所有有效的节点，确保DOM元素存在
          const validNodes: SelectionState[] = []

          newParentIds.forEach((id) => {
            // 先检查DOM元素是否存在
            const element = querySelectById(id)
            if (!element) return

            const canvas = useCanvas()
            const nodeWithParent = canvas.getNodeWithParentById(id)
            if (nodeWithParent) {
              const { top, left, width, height } = getRect(element)
              validNodes.push({
                id,
                top,
                left,
                width,
                height,
                schema: nodeWithParent.node,
                parent: nodeWithParent.parent
              })
            }
          })

          // 批量设置多选状态，避免一个一个添加造成的问题
          if (validNodes.length > 0) {
            // 先选中第一个
            toggleMultiSelection(validNodes[0], false)

            // 再添加其他的到多选状态
            for (let i = 1; i < validNodes.length; i++) {
              toggleMultiSelection(validNodes[i], true)
            }
          }
        }
      }
    }, 100)
  }

  /**
   * 获取组件基础样式的className
   * @returns {string} 组件基础样式类名
   */
  const getComponentBaseStyleClassName = () => {
    const materialsOptions = getOptions('engine.plugins.materials') || {}
    return materialsOptions.useBaseStyle && materialsOptions.componentBaseStyle?.className
      ? materialsOptions.componentBaseStyle.className
      : ''
  }

  /**
   * 为一组兄弟节点添加共同的父级
   * @param {string} componentName 父级组件名称
   * @param {Object} props 父级组件属性
   * @returns {boolean} 操作成功返回true，否则返回false
   */
  const groupAddParent = (componentName: string, props: Record<string, any> = {}): boolean => {
    if (!areSiblingNodes()) {
      return false
    }

    const firstState = multiSelectedStates.value[0]
    const { parent } = useCanvas().getNodeWithParentById(firstState.id) || {}

    if (!parent) {
      return false
    }

    // 收集所有选中的节点ID
    const selectedIds = multiSelectedStates.value.map((state) => state.id)

    // 找出所有选中节点在父节点children中的索引位置
    const indices = getSelectedNodeIndices(parent.children, selectedIds)

    if (indices.length === 0) return false

    // 获取第一个和最后一个选中节点的索引
    const firstIndex = indices[0]

    // 复制选中的节点（不从原来的位置移除）
    const selectedNodes = indices.map((index) => parent.children[index])

    // 创建新的包装组件
    let wrapSchema: Node = {
      componentName,
      id: utils.guid(),
      props: {
        ...props,
        // 如果是div且基础样式类名不为空，才添加className
        ...(componentName === 'div' && getComponentBaseStyleClassName()
          ? { className: getComponentBaseStyleClassName() }
          : {})
      },
      children: selectedNodes
    }

    // 特殊处理 TinyPopover 等组件
    if (componentName === 'TinyPopover') {
      wrapSchema = createTinyPopoverSchema(props, selectedNodes)
    }

    // 从后向前删除原来的节点，避免索引变化
    for (let i = indices.length - 1; i >= 0; i--) {
      parent.children.splice(indices[i], 1)
    }

    // 将新容器插入到第一个选中节点的位置
    parent.children.splice(firstIndex, 0, wrapSchema)

    // 先更新nodesMap中的节点关系
    const canvas = useCanvas()

    // 设置新创建的父节点
    canvas.setNode(wrapSchema, parent)

    // 为所有子节点更新父节点关系
    selectedNodes.forEach((node) => {
      canvas.setNode(node, wrapSchema)
    })

    // 更新canvasState，保证向左箭头显示
    Object.assign(canvasState, {
      current: wrapSchema,
      parent: parent
    })

    // 更新选中状态
    updateSelectionAfterAddParent([wrapSchema.id])

    useHistory().addHistory()
    return true
  }

  /**
   * 创建包装组件架构
   * @param {string} componentName 组件名称
   * @param {Object} props 组件属性
   * @param {Schema} childSchema 子组件架构
   * @returns {Schema} 包装组件架构
   */
  const createWrapperSchema = (componentName: string, props: Record<string, any> = {}, childSchema: Node): Node => {
    let wrapSchema: Node = {
      componentName,
      id: utils.guid(),
      props: {
        content: '提示信息',
        ...props,
        // 如果是div且基础样式类名不为空，才添加className
        ...(componentName === 'div' && getComponentBaseStyleClassName()
          ? { className: getComponentBaseStyleClassName() }
          : {})
      },
      children: [childSchema]
    }

    // 需要对popover特殊处理
    if (componentName === 'TinyPopover') {
      wrapSchema = createTinyPopoverSchema(props, childSchema)
    }

    return wrapSchema
  }

  /**
   * 批量为多个节点添加相同的父级
   * @param {string} componentName 父级组件名称
   * @param {Object} props 父级组件属性
   * @returns {boolean} 操作成功返回true，否则返回false
   */
  const batchAddParent = (componentName: string, props: Record<string, any> = {}): boolean => {
    if (multiSelectedStates.value.length === 0) {
      return false
    }

    // 记录创建的父容器ID，用于后续选中
    const newParentIds: string[] = []

    multiSelectedStates.value.forEach(({ schema, parent }) => {
      if (!schema || !parent) {
        return
      }

      const index = parent.children.findIndex((child) => child.id === schema.id)
      if (index === -1) {
        return
      }

      // 创建包装组件的模板，并确保有唯一ID
      const wrapSchema = createWrapperSchema(componentName, props, schema)
      wrapSchema.id = utils.guid()
      newParentIds.push(wrapSchema.id)

      // 记录当前节点
      const originalNode = schema

      // 使用insertNode将包装组件替换原节点
      insertNode(
        {
          node: originalNode,
          parent,
          data: wrapSchema
        },
        POSITION.REPLACE,
        false
      )
    })

    // 更新选中状态
    updateSelectionAfterAddParent(newParentIds)

    // 添加历史记录
    useHistory().addHistory()
    return true
  }

  return {
    multiSelectedStates,
    isMouseDown,
    toggleMultiSelection,
    refreshSelectionState,
    clearMultiSelection,
    areSiblingNodes,
    batchAddParent,
    groupAddParent
  }
}
