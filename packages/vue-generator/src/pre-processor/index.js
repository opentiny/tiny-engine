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

const text2Span = (schema) => {
  const { componentName, props = {} } = schema

  if (componentName === BUILTIN_COMPONENT_NAME.TEXT) {
    schema.componentName = 'span'

    if (props.text) {
      schema.children = props.text
      delete props.text
    }
  }

  return schema
}

const tinyIcon = (schema) => {
  const { componentName, props = {} } = schema

  if (componentName === BUILTIN_COMPONENT_NAME.ICON && props.name) {
    // 图标组件名，统一前缀为 TinyIcon，与从组件库引入的方法名 iconXxx 区分开
    const iconName = props.name.startsWith(TINY_ICON) ? props.name : `Tiny${props.name}`
    schema.componentName = iconName
    delete props.name
  }

  return schema
}

const tinyGrid = (schema) => {
  const { componentName, props = {} } = schema

  if (componentName === 'TinyGrid' && props.data && props.fetchData) {
    delete props.data
  }

  return schema
}

const collection2Div = (schema) => {
  const { componentName } = schema

  if (componentName === BUILTIN_COMPONENT_NAME.COLLECTION) {
    schema.componentName = 'div'
  }

  return schema
}

const component2Block = (schema) => {
  const { componentType, componentName, fileName } = schema

  if (componentType === BUILTIN_COMPONENT_NAME.BLOCK) {
    schema.fileName = componentName
    schema.componentName = BUILTIN_COMPONENT_NAME.BLOCK
  }

  if (componentName && componentName === fileName) {
    schema.componentName = BUILTIN_COMPONENT_NAME.BLOCK
  }

  return schema
}

const preProcess = (schema) => {
  const { children } = schema

  text2Span(schema)
  tinyIcon(schema)
  tinyGrid(schema)
  collection2Div(schema)
  component2Block(schema)

  if (Array.isArray(children)) {
    children.forEach(preProcess)
  }

  return schema
}

export { preProcess, tinyIcon }
