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

import { BUILTIN_COMPONENT_NAME, TINY_ICON } from '../constant'
import { addIconRecord, handleIconInProps } from '../utils'

function handleExprBinding(key, item, attrsArr) {
  const propValue = item.value.replace(/this\./g, '')

  if (item.model) {
    const modelArgs = item.model?.prop ? `:${item.model.prop}` : ''
    return attrsArr.push(`v-model${modelArgs}={${propValue}}`)
  }

  // JSX 中，为事件处理函数传递额外的参数时，需要使用内联箭头函数
  if (item.params?.length) {
    const extendParams = item.params.join(',')

    return attrsArr.push(`${key}={(...eventArgs) => ${propValue}(eventArgs, ${extendParams})}`)
  }

  return attrsArr.push(`${key}={${propValue}}`)
}

function handleBinding(props, attrsArr, description) {
  Object.entries(props).map(([key, item]) => {
    const propType = item?.type || 'literal'

    if (['JSExpression', 'JSFunction'].includes(propType)) {
      return handleExprBinding(key, item, attrsArr)
    }

    // 字面量
    if (propType === 'literal') {
      if (item?.componentName === BUILTIN_COMPONENT_NAME.ICON) {
        const iconName = handleIconInProps(description, item)

        return attrsArr.push(`${key}={${iconName}}`)
      }

      if (typeof item === 'string') return attrsArr.push(`${key}="${item}"`)
      if (typeof item === 'boolean') return attrsArr.push(item ? key : '')
    }

    if (propType === 'i18n') {
      return attrsArr.push(`${key}={t('${item.key}')}`)
    }

    return attrsArr.push(`${key}={${JSON.stringify(item)}}`)
  })
}

const generateJSXTemplate = (item, description) => {
  const result = []
  const { componentName, fileName, props = {}, children, condition } = item

  let component = ''
  if (componentName === BUILTIN_COMPONENT_NAME.BLOCK && fileName) {
    component = fileName
    description.blockSet.add(fileName)
  } else {
    component = componentName || item.component || 'div'
    description.componentSet.add(component)

    if (componentName?.startsWith(TINY_ICON)) {
      addIconRecord(description, componentName)
    }
  }

  const attrsArr = []

  // 处理 condition, 条件渲染
  if (condition) {
    const conditionValue = condition?.type ? condition.value.replace(/this\./g, '') : condition
    result.push(`{ ${conditionValue} && `)
  }

  result.push(`<${component} `)

  handleBinding(props, attrsArr, description)

  result.push(attrsArr.join(' '))

  // 处理 Void elements: 使用自闭合标签，如：<img />
  const VOID_ELEMENTS = ['img', 'input', 'br', 'hr', 'link']
  if (VOID_ELEMENTS.includes(component)) {
    result.push(' />')
  } else {
    result.push('>')

    if (Array.isArray(children)) {
      const subTemplate = children.map((child) => generateJSXTemplate(child, description)).join('')
      result.push(subTemplate)
    } else if (children?.type === 'JSExpression') {
      result.push(`{ ${children.value.replace(/this\./g, '')} }`)
    } else if (children?.type === 'i18n') {
      result.push(`{t('${children.key}')}`)
    } else {
      result.push(children || '')
    }

    result.push(`</${component}>`)
  }
  condition && result.push(' }')

  return result.join('')
}

export { generateJSXTemplate }
