import { ref } from 'vue'
import { useCanvas, useMessage } from '@opentiny/tiny-engine-meta-register'
import { getDocument, getRect, querySelectById, getController } from '../container'

interface Schema {
  id: string | null
  componentName: string
  props?: Record<string, any>
  children?: Schema[]
  parent?: {
    id: string
    children: Schema[]
  }
}

interface SelectionState {
  id: string
  top?: number
  left?: number
  width?: number
  height?: number
  schema?: Schema
  parent?: {
    id: string
    children: Schema[]
  }
}

// 初始化多选节点
const multiSelectedStates = ref<SelectionState[]>([])

export const useMultiSelect = () => {
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
      // 如果多选列表已经存在选中的state，则将选中的state移出多选列表
      if (isExistNode) {
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
   * 判断选中的节点是否都是兄弟节点且是连续的
   * @returns {boolean} 如果所有选中节点都有相同的父节点且在父节点的children中是连续的，返回true；否则返回false
   */
  const areSiblingNodes = (): boolean => {
    if (multiSelectedStates.value.length <= 1) return false

    // 获取第一个节点的父节点
    const firstNode = multiSelectedStates.value[0]
    const { parent: firstParent } = useCanvas().getNodeWithParentById(firstNode.id) || {}
    if (!firstParent) return false

    const parentId = firstParent.id

    // 检查所有节点是否有相同的父节点
    for (let i = 1; i < multiSelectedStates.value.length; i++) {
      const { parent } = useCanvas().getNodeWithParentById(multiSelectedStates.value[i].id) || {}
      if (!parent || parent.id !== parentId) {
        return false
      }
    }

    // 收集所有节点的索引
    const nodeIds = multiSelectedStates.value.map((node) => node.id)
    const nodeIndices = nodeIds
      .map((id) => firstParent.children.findIndex((child) => child.id === id))
      .sort((a, b) => a - b)

    // 检查是否是连续的兄弟节点
    const isConsecutive = nodeIndices.every((val, i, arr) => i === 0 || val === arr[i - 1] + 1)

    return isConsecutive
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
    const indices = selectedIds
      .map((id) => parent.children.findIndex((child: Schema) => child.id === id))
      .sort((a, b) => a - b)

    // 检查索引是否连续
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] !== indices[i - 1] + 1) {
        return false
      }
    }

    // 从父节点中移除这些节点
    const selectedNodes: Schema[] = []
    indices.reverse().forEach((index) => {
      selectedNodes.unshift(parent.children.splice(index, 1)[0])
    })

    // 创建新的包装组件
    const wrapSchema: Schema = {
      componentName,
      id: null,
      props: { ...props },
      children: selectedNodes
    }

    // 特殊处理popover等组件
    if (componentName === 'TinyPopover') {
      wrapSchema.props = {
        width: 200,
        title: '弹框标题',
        trigger: 'manual',
        modelValue: true
      }
      wrapSchema.children = [
        {
          componentName: 'Template',
          id: null,
          props: {
            slot: 'reference'
          },
          children: selectedNodes
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

    // 将包装组件插入到第一个被选中节点的位置
    parent.children.splice(indices[0], 0, wrapSchema)

    getController().addHistory()
    useMessage().publish({ topic: 'schemaChange', data: {} })
    setTimeout(() => {
      useCanvas().canvasApi.value?.updateRect?.()
    }, 0)

    return true
  }

  /**
   * 创建包装组件架构
   * @param {string} componentName 组件名称
   * @param {Object} props 组件属性
   * @param {Schema} childSchema 子组件架构
   * @returns {Schema} 包装组件架构
   */
  const createWrapperSchema = (componentName: string, props: Record<string, any> = {}, childSchema: Schema): Schema => {
    let wrapSchema: Schema = {
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
      wrapSchema = {
        componentName,
        id: null,
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
            children: [childSchema]
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

    // 对每个选中的节点分别添加父级
    let modified = false

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

      // 替换原节点
      parent.children.splice(index, 1, wrapSchema)
      modified = true
    })

    if (modified) {
      getController().addHistory()
      useMessage().publish({ topic: 'schemaChange', data: {} })
      setTimeout(() => {
        useCanvas().canvasApi.value?.updateRect?.()
      }, 0)

      return true
    }

    return false
  }

  return {
    multiSelectedStates,
    toggleMultiSelection,
    refreshSelectionState,
    clearMultiSelection,
    areSiblingNodes,
    batchAddParent,
    groupAddParent
  }
}
