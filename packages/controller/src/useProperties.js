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

import { toRaw, nextTick, shallowReactive, ref } from 'vue'
import { constants } from '@opentiny/tiny-engine-utils'
import useCanvas from './useCanvas'
import useResource from './useResource'
import useTranslate from './useTranslate'

const { COMPONENT_NAME } = constants
const propsUpdateKey = ref(0)

const otherBaseKey = {
  className: {
    property: 'className',
    type: 'string',
    defaultValue: '',
    label: {
      text: {
        zh_CN: '样式类'
      }
    },
    cols: 12,
    rules: [],
    widget: {
      component: 'MetaInput',
      props: {}
    }
  },
  id: {
    property: 'id',
    type: 'string',
    defaultValue: '',
    label: {
      text: {
        zh_CN: '元素id值'
      }
    },
    cols: 12,
    rules: [],
    widget: {
      component: 'MetaInput',
      props: {}
    }
  },
  ref: {
    property: 'ref',
    type: 'string',
    defaultValue: '',
    label: {
      text: {
        zh_CN: 'ref引用类'
      }
    },
    cols: 12,
    rules: [],
    widget: {
      component: 'MetaInput',
      props: {}
    }
  }
}

const patchOtherName = (content = []) => {
  const otherName = ['ref', 'className', 'id']
  otherName.forEach((e) => {
    if (!content.find(({ property }) => property === e)) {
      content.unshift(JSON.parse(JSON.stringify(otherBaseKey[e])))
    }
  })
}

const getSlotSwitch = (properties, slots = {}) => {
  if (Object.keys(slots).length) {
    properties.push({
      label: {
        zh_CN: '插槽信息'
      },
      description: {
        zh_CN: '插槽信息'
      },
      content: [
        {
          property: 'slots',
          labelPosition: 'none',
          bindState: false,
          widget: {
            component: 'MetaSlot',
            props: {
              slots
            }
          },
          description: {
            zh_CN: '插槽开关'
          }
        }
      ]
    })
  }
}

/**
 * 合并元数据与pageSchema中的实际属性
 * @param {*} pageProps 实际节点属性
 * @param {*} groups 组件元数据
 * @returns
 */
const mergeProps = (pageProps = {}, groups = []) => {
  const group = groups.map(({ content = [], ...group }) => {
    return {
      ...group,
      content: (content || []).map(({ widget, ...prop }) => {
        const { props, ...meta } = widget
        const modelValue = pageProps[prop.property] === undefined ? prop.defaultValue : pageProps[prop.property]

        return {
          ...prop,
          widget: { ...meta, props: { ...props, modelValue } }
        }
      })
    }
  })

  return group
}

const translateProp = (value) => {
  if (value?.type === 'i18n') {
    return useTranslate().translate(value)
  }

  return value
}

/**
 * 生成属性面版渲染数据
 * @param {*} instance 画布上当前选中节点信息
 */

const properties = shallowReactive({
  schema: null,
  parent: null
})

const isPageOrBlock = (schema) => [COMPONENT_NAME.Block, COMPONENT_NAME.Page].includes(schema?.componentName)

const getProps = (schema, parent) => {
  // 1 现在选中的节点和当前节点一样，不需要重新计算, 2 默认进来由于scheme和properities.schema相等，因此判断如果是“页面或者区块”需要进入if判断
  if (schema && (properties.schema !== schema || isPageOrBlock(schema))) {
    const { props, componentName } = schema
    // 若选中的是page或者 blcok，没有对应schema，ComponentName 给 div 设置根节点属性
    const {
      schema: metaSchema,
      content,
      properties
    } = useResource().getMaterial(isPageOrBlock(schema) ? 'div' : componentName)
    const schemaProps = properties || metaSchema?.properties || content?.schema?.properties || []
    const propGroups = [...schemaProps]

    patchOtherName(propGroups[0]?.content)
    getSlotSwitch(propGroups, metaSchema?.slots)
    useCanvas().pageState.properties = mergeProps(toRaw(props), propGroups)
  } else if (!schema) {
    useCanvas().pageState.properties = {}
  }

  properties.schema = schema
  properties.parent = parent
}

const setProp = (name, value, type) => {
  if (!properties.schema) {
    return
  }

  properties.schema.props = properties.schema.props || {}

  if ((value === '' && type !== 'String') || value === undefined || value === null) {
    delete properties.schema.props[name]
  } else {
    properties.schema.props[name] = value
  }

  // 没有父级，或者不在节点上面，要更新内容。就用setState
  const { getNode, setState, updateRect } = useCanvas().canvasApi.value || {}
  getNode(properties.schema.id, true)?.parent || setState(useCanvas().getPageSchema().state)
  propsUpdateKey.value++

  // 更新根节点props不用updateRect
  if (!properties.schema.id) {
    return
  }

  nextTick(updateRect)
}

const getProp = (key) => {
  return (properties.schema.props || {})[key]
}

const delProp = (name) => {
  const props = properties.schema.props || {}
  delete props[name]
  propsUpdateKey.value++
}

const setProps = (schema) => {
  Object.entries(schema.props || {}).map(([key, value]) => setProp(key, value))
}

export default function () {
  return {
    getProps,
    getProp,
    setProps,
    mergeProps,
    delProp,
    setProp,
    translateProp,
    getSchema(parent) {
      return parent ? properties : properties.schema
    },
    propsUpdateKey
  }
}
