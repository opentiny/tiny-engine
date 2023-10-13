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

import { computed, reactive, watch } from 'vue'
import { useCanvas, useHistory, useProperties as useProps } from '@opentiny/tiny-engine-controller'
import { camelize } from '@opentiny/tiny-engine-controller/utils'
import { obj2StyleStr } from '@opentiny/tiny-engine-common/js/css'
import { styleStr2Obj, styleStrRemoveRoot } from './cssConvert'
import { updateRect, getSchema as getCanvasPageSchema } from '@opentiny/tiny-engine-canvas'

const getStyleObj = (styleStr) => {
  let obj = {}

  if (typeof styleStr === 'string') {
    obj = styleStr2Obj(styleStr)
  }

  return obj
}

export default () => {
  const { getPageSchema, getCurrentSchema } = useCanvas()
  const { getSchema } = useProps()
  const { addHistory } = useHistory()

  const state = reactive({
    // 当前选中节点的 style，解析成对象返回
    style: {},
    // 编辑器显示的行内样式字符串
    styleContent: '',
    // 编辑器显示的全局样式字符串
    cssContent: ''
  })

  watch(
    () => getPageSchema()?.css,
    (value) => {
      state.cssContent = value || ''
    }
  )

  const setStyle = (styleString) => {
    state.style = styleStr2Obj(styleString)
  }

  watch(
    [() => getCurrentSchema(), () => getCanvasPageSchema()],
    () => {
      const schema = getCurrentSchema() || getCanvasPageSchema()
      const styleString = schema?.props?.style
      state.styleContent = obj2StyleStr(getStyleObj(styleString))
      setStyle(styleString)
    },
    {
      immediate: true
    }
  )

  // 更新 style 对象到 schema
  const updateStyle = (properties) => {
    const schema = getSchema() || getCanvasPageSchema()
    schema.props = schema.props || {}

    if (properties) {
      Object.entries(properties).forEach(([key, value]) => {
        state.style[camelize(key)] = value
      })
    }

    state.styleContent = obj2StyleStr(state.style)
    const newStyleStr = styleStrRemoveRoot(state.styleContent)

    if (newStyleStr) {
      schema.props.style = styleStrRemoveRoot(state.styleContent)
    } else {
      delete schema.props.style
    }

    addHistory()
    updateRect()
  }

  return {
    state,
    setStyle,
    updateStyle
  }
}

/**
 * 根据 style 对象生成样式属性对象 properties
 * styleName: {
 *   name,    // 属性名
 *   text,    // 界面显示的值
 *   value,   // 属性原始值
 *   setting  // 属性是否已设置值
 * }
 */
export const useProperties = ({ props, names, parseNumber }) => {
  const properties = computed(() => {
    const properties = {}
    if (Array.isArray(names) && props.style) {
      names.forEach((name) => {
        name = camelize(name)
        const value = props.style[name]
        let text = value || ''

        if (parseNumber) {
          if (value === 'auto') {
            text = 'auto'
          } else if (value === 'none') {
            text = 'none'
          } else if (/^\d+(\.\d+)?%$/.test(value)) {
            text = value
          } else {
            text = String(Number.parseInt(value) || '')
          }
        }

        properties[name] = {
          name, // 属性名
          text, // 界面显示的值
          value, // 属性原始值
          setting: Boolean(value) // 属性是否已设置值
        }
      })
    }

    return reactive(properties)
  })

  const getProperty = (styleName) => properties.value[camelize(styleName)]
  const getSettingFlag = (styleName) => Boolean(properties.value[camelize(styleName)]?.setting)
  const getPropertyText = (styleName) => properties.value[camelize(styleName)]?.text
  const getPropertyValue = (styleName) => properties.value[camelize(styleName)]?.value

  return {
    properties,
    getProperty,
    getSettingFlag,
    getPropertyText,
    getPropertyValue
  }
}
