import { ref } from 'vue'
import { getDocument, getRect, querySelectById } from '../container'

export interface MultiSelectedState {
  id: string
  left: number
  height: number
  top: number
  width: number
  componentName: string
  doc: Document
  schema: any
  parent: any
  type?: string
}

// 初始化多选节点
const multiSelectedStates = ref<MultiSelectedState[]>([])

export const useMultiSelect = () => {
  /**
   * 添加state到多选列表
   * @param selectState
   * @param isMultiple 是否多选
   * @returns 添加成功返回true，否则返回false
   */
  const toggleMultiSelection = (selectState: MultiSelectedState, isMultiple = false) => {
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

  const refreshSelectionState = () => {
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

  const clearMultiSelection = () => {
    multiSelectedStates.value = []
  }

  return {
    multiSelectedStates,
    toggleMultiSelection,
    refreshSelectionState,
    clearMultiSelection
  }
}
