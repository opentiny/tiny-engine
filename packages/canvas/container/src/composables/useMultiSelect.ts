import { ref } from 'vue'
import { useCanvas, useMessage, useHistory } from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'
import { getDocument, getRect, querySelectById, POSITION, insertNode, selectNode } from '../container'
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
    id: props.id !== undefined ? props.id : null,
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
        id: null,
        props: {
          slot: 'reference'
        },
        children
      },
      {
        componentName: 'Template',
        id: null,
        props: {
          slot: 'default'
        },
        children: [
          {
            componentName: 'div',
            id: null,
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
   * 添加state到多选列表
   * @param {SelectionState} selectState
   * @param {boolean} isMultiple 是否多选
   * @returns {boolean} 添加成功返回true，否则返回false
   */
  const toggleMultiSelection = (selectState: SelectionState, isMultiple: boolean = false): boolean => {
    if (!selectState || typeof selectState !== 'object') {
      return false
    }

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
    multiSelectedStates.value = multiSelectedStates.value.map((state) => {
      const element = querySelectById(state.id) || getDocument().body
      const { top, left, width, height } = getRect(element)

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
      props: { ...props },
      children: selectedNodes
    }

    // 特殊处理 TinyPopover 等组件
    if (componentName === 'TinyPopover') {
      wrapSchema = createTinyPopoverSchema({ ...props, id: utils.guid() }, selectedNodes)
    }

    // 从后向前删除原来的节点，避免索引变化
    for (let i = indices.length - 1; i >= 0; i--) {
      parent.children.splice(indices[i], 1)
    }

    // 将新容器插入到第一个选中节点的位置
    parent.children.splice(firstIndex, 0, wrapSchema)

    // 触发更新，重新选中节点
    useMessage().publish({ topic: 'schemaChange', data: {} })

    setTimeout(() => {
      useCanvas().setNode(wrapSchema, parent)
      selectNode(wrapSchema.id)
    }, 0)

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
      id: null,
      props: {
        content: '提示信息',
        ...props
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

    multiSelectedStates.value.forEach(({ schema, parent }) => {
      if (!schema || !parent) {
        return
      }

      const index = parent.children.findIndex((child) => child.id === schema.id)
      if (index === -1) {
        return
      }

      // 创建包装组件的模板
      const wrapSchema = createWrapperSchema(componentName, props, schema)

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
