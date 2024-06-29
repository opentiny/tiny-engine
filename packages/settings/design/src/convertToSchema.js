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

const fs = require('fs-extra')
const path = require('path')

const componentsName = 'carousel-item'
const propertiePath = path.join(__dirname, `./properties/${componentsName}.json`)
const schemaPath = path.join(__dirname, `./schema/${componentsName}.json`)
const data = fs.readJSONSync(propertiePath)
const properties = data.schema.properties || {}

const results = {
  properties: [
    {
      label: {
        zh_CN: '基础信息'
      },
      description: {
        zh_CN: '基础信息'
      },
      collapse: {
        number: 6,
        text: {
          zh_CN: '显示更多'
        }
      },
      content: []
    }
  ],
  events: {}
}

const widgetMap = {
  object: 'CodeConfigurator',
  array: 'CodeConfigurator',
  enum: 'SelectConfigurator',
  string: 'InputConfigurator',
  number: 'NumberConfigurator',
  boolean: 'SwitchConfigurator'
}

function getWidgetCompoent(value) {
  let componentType = ''
  if (Array.isArray(value.type)) {
    if (value.type.includes('object') || value.type.includes('array')) {
      componentType = 'object'
    } else if (value.type.includes('sting')) {
      componentType = 'string'
    } else {
      componentType = value.type[0]
    }
  } else {
    componentType = value.type
  }

  const props = {}
  if (value.enum) {
    props.options = []
    value.enum.forEach((item, index) => {
      props.options.push({
        label: value.enumNames[index],
        value: item
      })
    })
  }
  return {
    component: widgetMap[componentType],
    props: props
  }
}
Object.entries(properties).forEach(([key, value]) => {
  if (!key.includes('#')) {
    const obj = {
      property: key.replace(/\$/g, ''),
      label: {
        text: {
          zh_CN: value.title || ''
        }
      },
      required: true,
      readOnly: false,
      disabled: false,
      cols: 12,
      widget: getWidgetCompoent(value),
      description: {
        zh_CN: ''
      }
    }
    results.properties[0].content.push(obj)
  }
})

fs.writeJSONSync(schemaPath, results)
