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
import { useBroadcastChannel } from '@vueuse/core'
import { useCanvas, useHistory, useProperties as useProps } from '@opentiny/tiny-engine-controller'
import { formatString } from '@opentiny/tiny-engine-controller/js/ast'
import { constants, utils } from '@opentiny/tiny-engine-utils'
import { parser, stringify, getSelectorArr } from './parser'

const { BROADCAST_CHANNEL, EXPRESSION_TYPE } = constants
const { generateRandomLetters, parseExpression } = utils

const { data: schemaLength } = useBroadcastChannel({ name: BROADCAST_CHANNEL.SchemaLength })

const state = reactive({
  // 当前选中节点的  style，解析成对象返回
  style: {},
  // 编辑器显示的行内样式字符串
  styleContent: '',
  // 编辑器显示的全局样式字符串
  cssContent: '',
  pageCssObject: {},
  currentClassSelector: '',
  existClassSelectors: [],
  className: {
    classNameList: '',
    mouseState: ''
  },
  cssParseList: [],
  selectors: [],
  styleObject: {},
  currentClassNameList: [],
  currentIdList: [],
  selectorOptionLists: [],
  schemaUpdateKey: 0,
  inlineBtnText: '编辑行内样式',
  lineStyleDisable: true,
  propertiesList: '',
  bindModelValue: null
})

const getCurrentClassSelector = () => {
  let res = `${state.className.classNameList}`
  const mouseState = state.className.mouseState

  if (mouseState) {
    res += `:${mouseState}`
  }

  return res
}

// 根据当前选中的组件，随机生成一个 css 类名
export const genRandomClassNames = (componentName) => {
  return `.${componentName}-${generateRandomLetters(5)}`.toLowerCase()
}

const getPropsFromExpression = (propValue) => {
  let res = []

  try {
    const expressRes = parseExpression(propValue?.value)

    if (Array.isArray(expressRes)) {
      res = expressRes
        .map((item) => {
          if (typeof item === 'string') {
            return item
          }

          if (typeof item === 'object') {
            return Object.keys(item)
          }

          return null
        })
        .flat()
        .filter(Boolean)
    } else if (typeof expressRes === 'string' && expressRes) {
      res = [expressRes]
    }
  } catch (e) {
    // 不做处理
  }

  return res
}

const parseClassOrIdProps = (propValue) => {
  if (typeof propValue === 'string' && propValue) {
    return propValue.split(' ').filter(Boolean)
  }

  let res = []

  if (propValue?.type === EXPRESSION_TYPE.JS_EXPRESSION) {
    return getPropsFromExpression(propValue)
  }

  return res
}

const getClassNameAndIdList = (schema) => {
  let classNameList = []
  let idList = []

  if (!schema) {
    return {
      classNameList,
      idList
    }
  }

  const classNameStr = schema?.props?.className
  const idStr = schema?.props?.id

  classNameList = parseClassOrIdProps(classNameStr)
  idList = parseClassOrIdProps(idStr)

  return {
    classNameList,
    idList
  }
}

const { getPageSchema, getCurrentSchema, canvasApi } = useCanvas()
const { getSchema, propsUpdateKey } = useProps()
const { addHistory } = useHistory()

watch(
  () => [getCurrentSchema(), state.schemaUpdateKey, propsUpdateKey.value, canvasApi.value?.getSchema?.(), schemaLength],
  ([curSchema], [oldCurSchema] = []) => {
    let schema = getCurrentSchema()

    if (!schema || Object.keys(schema).length === 0) {
      schema = canvasApi.value?.getSchema?.()
    }

    if (!schema) {
      return
    }

    // 获取当前选中组件的类名以及 id 列表
    const { classNameList, idList } = getClassNameAndIdList(schema)

    state.currentClassNameList = classNameList.map((item) => `.${item}`)
    state.currentIdList = idList.map((item) => `#${item}`)

    // 变化了相当于重新选中了，需要重置当前选中的 className 以及样式面板的样式
    if (curSchema !== oldCurSchema) {
      state.className = {
        classNameList: '',
        mouseState: ''
      }
      state.style = {}
    }

    state.styleContent = formatString(`:root {\n ${schema?.props?.style || ''}\n}`, 'css')
  },
  {
    immediate: true,
    deep: true
  }
)

// 监听全局样式的变化，重新解析
watch(
  () => getPageSchema()?.css,
  (value) => {
    state.cssContent = value || ''

    // 解析css
    const { parseList, selectors, styleObject } = parser(value)

    state.cssParseList = parseList
    state.selectors = selectors
    state.styleObject = styleObject
  }
)

// 计算当前类名下拉列表
watch(
  () => [state.currentClassNameList, state.currentIdList, state.styleObject],
  () => {
    let list = []

    const classNameListOptions = state.currentClassNameList.map((item) => ({ label: item, value: item }))
    const idListOptions = state.currentIdList.map((item) => ({ label: item, value: item }))

    list = list.concat(classNameListOptions, idListOptions)

    Object.values(state.styleObject).forEach((value) => {
      const selectorArr = getSelectorArr(value.pureSelector)

      if (selectorArr.length <= 1) {
        return
      }

      const isComboSelector = selectorArr.every(
        (item) => state.currentClassNameList.includes(item) || state.currentIdList.includes(item)
      )

      if (isComboSelector) {
        list.push({ label: value.pureSelector, value: value.pureSelector })
      }
    })

    // 默认选择的类
    let defaultSelector = ''
    let defaultMouseState = ''
    const curClassName = state.className.classNameList

    if (list.find(({ value }) => value === curClassName)) {
      defaultSelector = curClassName
      defaultMouseState = state.className.mouseState
    } else if (list.length) {
      defaultSelector = list.at(-1).value
    }

    state.selectorOptionLists = list

    state.className = {
      classNameList: defaultSelector,
      mouseState: defaultMouseState
    }
  }
)

// 计算当前样式面板展示的样式
watch(
  () => state.className,
  () => {
    const { classNameList, mouseState } = state.className

    if (!classNameList) {
      return
    }

    const matchStyles = Object.values(state.styleObject).filter(
      (value) => value.pureSelector === classNameList && value.mouseState === mouseState
    )
    const style = matchStyles.length ? matchStyles[0].rules : {}
    state.style = style
  },
  {
    deep: true
  }
)

export const updateGlobalStyleStr = (styleStr) => {
  const pageSchema = getPageSchema()
  const { getSchema, setPageCss } = canvasApi.value

  pageSchema.css = styleStr
  getSchema().css = styleStr
  setPageCss(styleStr)
  state.schemaUpdateKey++
}

const updateGlobalStyle = (newSelector) => {
  let currentSelector = getCurrentClassSelector()

  const mouseState = state.className.mouseState

  if (newSelector) {
    currentSelector = newSelector

    if (mouseState) {
      currentSelector += `:${mouseState}`
    }
  }

  state.styleObject[currentSelector] = {
    ...(state.styleObject[currentSelector] || {}),
    rules: state.style
  }

  if (!Object.keys(state.style).length) {
    delete state.styleObject[currentSelector]
  }

  const styleStr = formatString(stringify(state.cssParseList, state.styleObject), 'css')

  updateGlobalStyleStr(styleStr)
}

// 更新 style 对象到 schema
const updateStyle = (properties) => {
  const { getSchema: getCanvasPageSchema, updateRect } = canvasApi.value
  const schema = getSchema() || getCanvasPageSchema()
  schema.props = schema.props || {}

  if (properties) {
    Object.entries(properties).forEach(([key, value]) => {
      state.style[key] = value
    })
  }

  const currentSelector = getCurrentClassSelector()
  let randomClassName = ''

  const classNames = schema.props.className || ''

  // 不存在选择器，需要生成一个随机类名，添加到当前选中组件中，然后写入到全局样式
  if (!currentSelector && typeof classNames === 'string') {
    randomClassName = genRandomClassNames(schema?.componentName || 'component')
    let newClassNames = randomClassName.slice(1)

    if (classNames) {
      newClassNames = `${classNames} ${newClassNames}`
    }

    schema.props.className = newClassNames
    state.className.classNameList = randomClassName
  }

  // 更新到全局样式
  updateGlobalStyle(randomClassName)

  addHistory()
  updateRect()
}

export default () => {
  return {
    state,
    updateStyle
  }
}

const getTextOfValue = (value) => {
  const basicValueMap = {
    auto: 'auto',
    none: 'none'
  }

  if (basicValueMap[value] || /^\d+(\.\d+)?%$/.test(value)) {
    return value
  }

  return String(Number.parseInt(value) || '')
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
export const useProperties = ({ names, parseNumber }) => {
  const properties = computed(() => {
    const newProperties = {}

    if (Array.isArray(names) && state.style) {
      names.forEach((name) => {
        const value = state.style[name]
        let text = value || ''

        if (parseNumber) {
          text = getTextOfValue(value)
        }

        newProperties[name] = {
          name, // 属性名
          text, // 界面显示的值
          value, // 属性原始值
          setting: Boolean(value) // 属性是否已设置值
        }
      })
    }

    return newProperties
  })

  const getProperty = (styleName) => properties.value[styleName]
  const getSettingFlag = (styleName) => Boolean(properties.value[styleName]?.setting)
  const getPropertyText = (styleName) => properties.value[styleName]?.text
  const getPropertyValue = (styleName) => properties.value[styleName]?.value

  return {
    properties,
    getProperty,
    getSettingFlag,
    getPropertyText,
    getPropertyValue
  }
}
