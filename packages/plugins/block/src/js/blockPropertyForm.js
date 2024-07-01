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

import { ref, computed, watch } from 'vue'
import { utils, constants } from '@opentiny/tiny-engine-utils'
import { useNotify } from '@opentiny/tiny-engine-meta-register'

import {
  META_TYPES,
  getEditProperty,
  META_COMPONENTS,
  getItemConfig,
  getArrayConfig,
  setArrayConfig,
  META_DEFAULT_VALUE,
  META_COMPONENTS_ENUM,
  saveArrayConfig,
  setEditProperty,
  setConfigItemVisible,
  META_COMPONENT_LIST,
  getConfigItemVisible
} from './blockSetting'

const { fun_ctor } = utils
const { SCHEMA_DATA_TYPE } = constants

export const typeList = Object.keys(META_TYPES).map((key) => ({ value: key, label: key }))

export const currentEditData = ref(null)

export const itemConfig = ref([])

export const arrayConfig = computed({
  get() {
    return getArrayConfig() || []
  },
  set(value) {
    setArrayConfig(value)
  }
})

export const showArrayItemConfig = ref(false)

export const initSubProperties = () => {
  const property = getEditProperty()

  if (property?.properties || !showArrayItemConfig.value) {
    return
  }

  property.properties = [
    {
      label: {
        zh_CN: '默认分组'
      },
      content: []
    }
  ]

  arrayConfig.value = property.properties[0].content
}

export const type = computed({
  get() {
    const property = getEditProperty()
    return property?.type || META_TYPES.string
  },
  set(value) {
    const property = getEditProperty()
    property.type = value
    property.defaultValue = META_DEFAULT_VALUE[value]
    property.widget = {
      component: META_COMPONENTS[value] || META_COMPONENTS[META_TYPES.string],
      props: {}
    }
  }
})

export const widgetComponent = computed({
  get() {
    const property = getEditProperty()
    return property?.widget?.component || 'InputConfigurator'
  },
  set(value) {
    const property = getEditProperty()
    property.widget = property.widget || {}
    property.widget.component = value
    showArrayItemConfig.value = type.value === META_TYPES.array && value === META_COMPONENTS_ENUM.ArrayItemConfigurator

    initSubProperties()
  }
})

export const showPropertyConfigItem = computed(() => getConfigItemVisible())

export const label = computed({
  get() {
    const property = getEditProperty()
    return property?.label?.text?.zh_CN || ''
  },
  set(value) {
    const property = getEditProperty()
    property.label.text.zh_CN = value
  }
})

export const propertyName = computed({
  get() {
    const property = getEditProperty()
    return property?.property || ''
  },
  set(value) {
    const property = getEditProperty()
    property.property = value
  }
})

export const getDefaultValue = (data) => {
  const type = currentEditData.value.type
  if (type === META_TYPES.string || type === META_TYPES.function) {
    return data
  }

  if (type === META_TYPES.boolean) {
    return Boolean(data)
  }

  if (type === META_TYPES.number) {
    return Number(data)
  }

  let newValue = data

  try {
    newValue = fun_ctor(`return ${newValue}`)()
  } catch (error) {
    useNotify({
      type: 'error',
      title: '默认值解析错误',
      message: error?.message || '默认值解析错误，请检查'
    })
  }

  if (type === META_TYPES.object && typeof newValue === 'object' && newValue !== null) {
    return newValue
  }

  if (type === META_TYPES.array && Array.isArray(newValue)) {
    return newValue
  }

  return ''
}

// 设置区块属性访问器
export const saveAccessor = (type, data) => {
  const property = getEditProperty()
  property.accessor = property.accessor || {}
  property.accessor[type] = {
    type: 'JSFunction',
    value: data.content
  }
}

export const handleConfigItemChange = (property, data) => {
  if (property === 'defaultValue') {
    currentEditData.value.defaultValue = getDefaultValue(data)
  } else if (property === 'props') {
    if (typeof data === 'object' && data !== null) {
      currentEditData.value.props = data
    }
  } else if (Object.prototype.hasOwnProperty.call(currentEditData.value, property)) {
    currentEditData.value[property] = data
  }

  if (property === 'type') {
    currentEditData.value.component = META_COMPONENTS[data]
    itemConfig.value = getItemConfig(currentEditData.value)
  }
}

export const handleAddItem = () => {
  arrayConfig.value.push({
    property: 'customProperty',
    type: 'string',
    component: 'InputConfigurator',
    props: {},
    defaultValue: '',
    description: ''
  })
}

export const del = (data) => {
  arrayConfig.value = arrayConfig.value.filter((item) => item !== data)
}

export const handleSaveWidgetProps = (data) => {
  const property = getEditProperty()
  if (!property.widget) {
    property.widget = {}
  }

  try {
    let propsValue = data.content
    if (typeof propsValue === 'string') {
      propsValue = JSON.parse(propsValue)
    }
    property.widget.props = propsValue
  } catch (error) {
    useNotify({
      type: 'error',
      message: `属性面板组件属性值设置有误: ${JSON.stringify(error)}，请检查是否为JSON类型`
    })
  }
}

export const updateDefaultValue = (value) => {
  const property = getEditProperty()
  let propertyValue = value

  // 如果不是字符串类型并且没有被转译过，支持在Monaco编辑器中写js语法，不再限制必须是json格式
  if (type.value !== META_TYPES.string && typeof value === 'string') {
    try {
      propertyValue = fun_ctor(`return ${value}`)()
    } catch (error) {
      propertyValue = value
      useNotify({
        type: 'warning',
        title: '默认值语法解析错误',
        message: error?.message || '默认值语法解析错误，请检查语法'
      })
    }

    // 此处如果是时间对象或者函数需要特殊处理
    if (propertyValue instanceof Date) {
      propertyValue = {
        type: SCHEMA_DATA_TYPE.JSExpression,
        value: value
      }
    } else if (propertyValue instanceof Function) {
      propertyValue = {
        type: SCHEMA_DATA_TYPE.JSFunction,
        value: value
      }
    }
  }

  property.defaultValue = propertyValue
}

export const handleChangeWidgetComponent = (value) => {
  widgetComponent.value = value
}

export const handleCancelEdit = () => {
  saveArrayConfig()
  setEditProperty(null)
}

export const handleEdit = (data) => {
  setConfigItemVisible(true)
  currentEditData.value = data
  itemConfig.value = getItemConfig(data)
}

export const changeType = (value) => {
  type.value = value
}

export const widgetComponentList = ref([])

watch(
  () => type.value,
  () => {
    const property = getEditProperty()

    widgetComponentList.value = (META_COMPONENT_LIST[(type.value || '').toLowerCase()] || []).map((item) => ({
      label: item,
      value: item
    }))

    showArrayItemConfig.value =
      type.value === META_TYPES.array && widgetComponent.value === META_COMPONENTS_ENUM.ArrayItemConfigurator

    if (property) {
      widgetComponent.value = property.widget.component
    }

    initSubProperties()
  },
  {
    immediate: true
  }
)

watch(
  () => getConfigItemVisible(),
  (visible) => {
    if (visible) {
      return
    }

    saveArrayConfig()
  }
)
