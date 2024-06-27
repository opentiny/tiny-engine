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

import { reactive } from 'vue'
import meta from '../properties'
import schemas from '../schemas'

const genTreeData = (properties, keys = []) => {
  const treeData = []

  Object.entries(properties).forEach(([propertyName, property]) => {
    if (property?.properties) {
      const currentKeys = Array.from(keys)
      currentKeys.push(propertyName)

      const node = {
        label: propertyName,
        key: currentKeys.join('.'),
        properties: property.properties
      }

      const children = genTreeData(property.properties, currentKeys)

      if (children.length > 0) {
        node.children = children
      }

      treeData.push(node)
    }
  })

  return treeData
}

const findParent = (element, match) => {
  if (element.content?.includes(match)) {
    return element
  } else if (element.content?.length) {
    let i
    let result = null
    for (i = 0; result === null && i < element.content.length; i++) {
      result = findParent(element.content[i], match)
    }
    return result
  }
  return null
}

const store = reactive({
  componentList: genTreeData(meta),
  currentKeys: [],
  currentComponent: '',
  currentSchema: [],
  childrenSchema: [],
  currentProperties: {},
  currentProperty: {
    widget: 'InputConfigurator',
    device: []
  },
  currentGroup: null,
  property: null,
  lang: 'zh_CN',
  metaData: '',
  configGroupKey: 0,
  currentSubConfig: null,
  // 当前编辑的分组信息
  currentEditGroupInfo: null
})

export const META_COMPONENTS = {
  CodeConfigurator: 'CodeConfigurator',
  ArrayItemConfigurator: 'ArrayItemConfigurator',
  InputConfigurator: 'InputConfigurator',
  SelectConfigurator: 'SelectConfigurator',
  I18nConfigurator: 'I18nConfigurator',
  CheckBoxConfigurator: 'CheckBoxConfigurator',
  ColorConfigurator: 'ColorConfigurator',
  DatePickerConfigurator: 'DatePickerConfigurator',
  RadioConfigurator: 'RadioConfigurator',
  RadioConfiguratorGroup: 'RadioGroupConfigurator',
  NumberConfigurator: 'NumberConfigurator',
  JsSlotConfigurator: 'JsSlotConfigurator',
  SwitchConfigurator: 'SwitchConfigurator'
}

export const META_TYPES_ENUM = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  object: 'object',
  array: 'array',
  function: 'function'
}

export const META_TYPES_OPTIONS = Object.entries(META_TYPES_ENUM).map(([key, value]) => ({ label: key, value }))

// 数据类型对应的默认 meta component
export const META_DEFAULT_COMPONENT = {
  [META_TYPES_ENUM.array]: META_COMPONENTS.CodeConfigurator,
  [META_TYPES_ENUM.string]: META_COMPONENTS.InputConfigurator,
  [META_TYPES_ENUM.number]: META_COMPONENTS.NumberConfigurator,
  [META_TYPES_ENUM.object]: META_COMPONENTS.CodeConfigurator,
  [META_TYPES_ENUM.boolean]: META_COMPONENTS.SwitchConfigurator,
  [META_TYPES_ENUM.function]: META_COMPONENTS.CodeConfigurator
}

export const META_DEFAULT_VALUE = {
  [META_TYPES_ENUM.array]: [],
  [META_TYPES_ENUM.string]: '',
  [META_TYPES_ENUM.number]: 0,
  [META_TYPES_ENUM.object]: {},
  [META_TYPES_ENUM.boolean]: false,
  [META_TYPES_ENUM.function]: 'function value() {}'
}

export const DEFAULT_PROPERTY = {
  property: 'customProperty',
  type: META_TYPES_ENUM.string,
  defaultValue: META_DEFAULT_VALUE[META_TYPES_ENUM.string],
  label: {
    text: {
      zh_CN: ''
    }
  },
  cols: 12,
  rules: [],
  accessor: {}, // 区块属性访问器
  hidden: false,
  required: true,
  readOnly: false,
  disabled: false,
  widget: {
    component: META_COMPONENTS[META_TYPES_ENUM.string],
    props: {}
  }
}

export const DEFAULT_INIT_PROPERTIES = [
  {
    label: {
      zh_CN: '默认分组'
    },
    content: []
  }
]

export const removeGroup = (group) => {
  if (!group) {
    return
  }

  const index = store.currentSchema.indexOf(group)

  if (index > -1) {
    store.currentSchema.splice(index, 1)
    store.currentEditGroupInfo = null
    store.currentProperty = null
  }
}

export const addGroup = (index) => {
  const length = store.currentSchema.length

  const group = {
    name: String(length),
    label: {
      zh_CN: `分组${length + 1}`
    },
    content: [],
    description: {
      zh_CN: ''
    }
  }
  store.currentSchema.splice(index, 0, group)

  return group
}

export const addProperty = (group, prop, index = 0) => {
  const typeMap = {
    string: 'InputConfigurator',
    boolean: 'SwitchConfigurator',
    number: 'NumberConfigurator',
    array: 'InputConfigurator',
    object: 'InputConfigurator'
  }
  const meta = store?.currentProperties[prop]
  const newProperty = {
    property: prop,
    label: {
      text: {
        zh_CN: prop
      }
    },
    required: true,
    readOnly: false,
    disabled: false,
    cols: 12,
    labelPosition: 'left',
    type: 'string',
    widget: {
      component: typeMap[meta?.type || 'string'],
      props: {}
    }
  }
  group.content.splice(index, 0, newProperty)
}

export const removeProperty = () => {
  const group = store.currentGroup
  const property = store.currentProperty

  if (!group || !property) {
    return
  }

  const index = group.content.indexOf(property)

  if (index > -1) {
    group.content.splice(index, 1)
    store.currentProperty = null
  }
}

export const setCurrentGroup = (group) => {
  store.currentGroup = group
}

/**
 * 设置当前选中属性，同时将property 更新为当前属性的元数据
 * @param {*} property
 */
export const setCurrentProperty = (property) => {
  if (property === store.currentProperty) {
    return
  }

  store.currentEditGroupInfo = null
  store.property = store.currentProperties[property.property]
  store.currentProperty = property
  setCurrentGroup(findParent({ content: store.currentSchema }, property))
}

export const getSchemaByComponetName = (name) => {
  schemas[name] = schemas[name] || {
    component: 'text',
    icon: 'IconText',
    schema: {
      properties: [],
      events: {},
      shortcuts: {},
      contentMenu: {}
    }
  }
  return schemas[name].schema.properties
}

export const drawItems = () => {
  const { items, properties } = store.property
  store.currentProperties = items?.properties || properties
  store.currentProperty.schema = store.currentProperty.schema || []
  store.currentSchema = store.currentProperty.schema
}

window.store = store
window.schemas = schemas
export default store
