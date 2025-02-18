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

import { computed } from 'vue'
import { constants } from '@opentiny/tiny-engine-utils'
import { useBlock } from '@opentiny/tiny-engine-meta-register'

const { SCHEMA_DATA_TYPE } = constants

// 给组件属性添加关联信息
const addPropertyLinks = ({ linked, propertyName, componentProperties }) => {
  for (let i = 0; i < componentProperties.length; i++) {
    const propertyList = componentProperties[i].content

    for (let j = 0; j < propertyList.length; j++) {
      const property = propertyList[j]

      if (property.property === propertyName) {
        Object.assign(property, {
          linked,
          widget: {
            props: {
              modelValue: {
                type: SCHEMA_DATA_TYPE.JSExpression,
                value: `this.props.${linked.blockProperty}`
              }
            }
          }
        })
      }
    }
  }
}

// 遍历区块属性，查找已关联的组件属性
const findLinked = ({ componentProperties, componentId, blockProperties }) => {
  for (let i = 0; i < blockProperties.length; i++) {
    const property = blockProperties[i]

    if (property.linked && componentId === property.linked.id) {
      addPropertyLinks({
        componentProperties,
        linked: { ...property.linked, blockProperty: property.property },
        defaultValue: property.defaultValue,
        propertyName: property.linked.property
      })
    }
  }
}

// 重置组件属性的关联信息
const resetLink = (properties) => {
  if (properties && Array.isArray(properties)) {
    properties.forEach((group) => {
      if (group?.content && Array.isArray(group.content)) {
        group.content.forEach((property) => {
          property.linked = null
        })
      }
    })
  }
}

const getProperty = ({ pageState }) => {
  const { getCurrentBlock, getBlockProperties } = useBlock()

  const properties = computed(() => {
    // 区块消费时区块属性有关联信息需要重置
    resetLink(pageState.properties)
    // 区块编辑态下设置组件关联信息
    if (pageState.isBlock && pageState.currentSchema?.id) {
      findLinked({
        componentProperties: pageState.properties,
        componentId: pageState.currentSchema.id,
        blockProperties: getBlockProperties(getCurrentBlock())
      })
    }

    return pageState.properties
  })

  return {
    properties
  }
}

export default () => ({ getProperty })
