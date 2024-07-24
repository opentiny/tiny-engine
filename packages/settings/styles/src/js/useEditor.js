/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { reactive, watch } from 'vue'
import { useHistory, useCanvas } from '@opentiny/tiny-engine-controller'
import { obj2StyleStr, styleStrRemoveRoot } from './cssConvert'
import { CSS_TYPE } from './cssType'

export default ({ style, pageState }) => {
  const { addHistory } = useHistory()

  // 编辑器状态
  const editor = reactive({
    type: '',
    show: false,
    created: false,
    content: ''
  })

  // 关闭编辑器
  const close = () => {
    editor.show = false
  }

  // 打开编辑器
  const open = (type = CSS_TYPE.Style) => {
    if (!editor.created) {
      editor.created = true
    }

    editor.show = true
    editor.type = type

    if (type === CSS_TYPE.Style) {
      editor.content = obj2StyleStr(style.value)
    } else if (type === CSS_TYPE.Css) {
      editor.content = pageState.pageSchema.css || ''
    }
  }

  // 保存编辑器内容，并回写到 schema
  const save = (content) => {
    if (editor.type === CSS_TYPE.Style) {
      if (pageState.currentSchema?.props) {
        pageState.currentSchema.props.style = styleStrRemoveRoot(content)
        addHistory()
      }
    } else if (editor.type === CSS_TYPE.Css) {
      pageState.pageSchema.css = content
      const { setPageCss } = useCanvas().canvasApi.value

      setPageCss(content)
      addHistory()
    }
  }

  // 监听 style 对象的变化，更新编辑器内容
  watch(
    () => style.value,
    () => {
      if (editor.show && editor.type === CSS_TYPE.Style) {
        editor.content = obj2StyleStr(style.value)
      }
    }
  )

  return {
    editor,
    open,
    save,
    close
  }
}
