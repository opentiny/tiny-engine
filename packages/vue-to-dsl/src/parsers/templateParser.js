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

import { parse } from '@vue/compiler-dom'

/**
 * 获取组件名称
 * @param {string} tag - 标签名
 * @param {Object} options - 选项
 * @returns {string} 组件名
 */
function getComponentName(tag, options) {
  // 如果有组件映射，使用映射后的名称
  if (options.componentMap && options.componentMap[tag]) {
    return options.componentMap[tag]
  }

  // 处理HTML标签
  const htmlTags = [
    'div',
    'span',
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'button',
    'input',
    'form',
    'table',
    'tr',
    'td',
    'th',
    'thead',
    'tbody',
    'section',
    'article',
    'header',
    'footer',
    'nav',
    'aside',
    'main'
  ]

  if (htmlTags.includes(tag.toLowerCase())) {
    return tag.toLowerCase()
  }

  // 组件名首字母大写
  return tag.charAt(0).toUpperCase() + tag.slice(1)
}

/**
 * 解析节点属性
 * @param {Array} props - 属性数组
 * @param {Object} _options - 选项
 * @returns {Object} 属性对象
 */
function parseNodeProps(props, _options) {
  const result = {}

  props.forEach((prop) => {
    if (prop.type === 6) {
      // 静态属性
      result[prop.name] = prop.value ? prop.value.content : true
    } else if (prop.type === 7) {
      // 指令
      // 在parseDirectives中处理
    }
  })

  return result
}

/**
 * 解析指令
 * @param {Object} node - AST节点
 * @param {Object} schema - Schema对象
 * @param {Object} _options - 选项
 */
function parseDirectives(node, schema, _options) {
  if (!node.props) return

  node.props.forEach((prop) => {
    if (prop.type !== 7) return // 只处理指令

    const directiveName = prop.name

    switch (directiveName) {
      case 'if':
        schema.condition = prop.exp ? prop.exp.content : 'true'
        break

      case 'for':
        if (prop.exp) {
          schema.loop = prop.exp.content
        }
        break

      case 'show':
        schema.props['v-show'] = prop.exp ? prop.exp.content : 'true'
        break

      case 'model':
        schema.props['v-model'] = prop.exp ? prop.exp.content : ''
        break

      case 'on': {
        // 事件处理
        const eventName = prop.arg ? prop.arg.content : 'click'
        schema.props[`@${eventName}`] = prop.exp ? prop.exp.content : ''
        break
      }

      case 'bind': {
        // 属性绑定
        const attrName = prop.arg ? prop.arg.content : 'value'
        schema.props[`:${attrName}`] = prop.exp ? prop.exp.content : ''
        break
      }

      case 'slot': {
        // 插槽
        const slotName = prop.arg ? prop.arg.content : 'default'
        schema.slot = slotName
        break
      }

      default:
        // 其他指令
        schema.props[`v-${directiveName}`] = prop.exp ? prop.exp.content : 'true'
    }
  })
}

/**
 * 解析文本节点
 * @param {Object} node - 文本节点
 * @param {Object} _options - 选项
 * @returns {Object|string} 文本Schema
 */
function parseTextNode(node, _options) {
  if (!node.content || !node.content.trim()) {
    return null
  }

  return {
    componentName: 'Text',
    props: {
      text: node.content.trim()
    }
  }
}

/**
 * 解析插值节点
 * @param {Object} node - 插值节点
 * @param {Object} _options - 选项
 * @returns {Object} 插值Schema
 */
function parseInterpolationNode(node, _options) {
  return {
    componentName: 'Text',
    props: {
      text: {
        type: 'JSExpression',
        value: node.content ? node.content.content : ''
      }
    }
  }
}

/**
 * 解析模板节点
 * @param {Object} node - AST节点
 * @param {Object} options - 解析选项
 * @returns {Object} 节点Schema
 */
function parseTemplateNode(node, options) {
  if (node.type !== 1) {
    // 只处理元素节点
    return null
  }

  const schema = {
    componentName: getComponentName(node.tag, options),
    props: {},
    children: []
  }

  // 解析属性
  if (node.props && node.props.length > 0) {
    schema.props = parseNodeProps(node.props, options)
  }

  // 解析指令
  parseDirectives(node, schema, options)

  // 解析子节点
  if (node.children && node.children.length > 0) {
    schema.children = node.children
      .map((child) => {
        if (child.type === 1) {
          // 元素节点
          return parseTemplateNode(child, options)
        } else if (child.type === 2) {
          // 文本节点
          return parseTextNode(child, options)
        } else if (child.type === 5) {
          // 插值节点
          return parseInterpolationNode(child, options)
        }
        return null
      })
      .filter(Boolean)
  }

  return schema
}

/**
 * 解析Vue模板为DSL Schema
 * @param {string} template - 模板字符串
 * @param {Object} options - 解析选项
 * @returns {Array} 模板Schema数组
 */
export function parseTemplate(template, options = {}) {
  try {
    const ast = parse(template)

    if (!ast || !ast.children) {
      return []
    }

    return ast.children
      .filter((node) => node.type === 1) // Element nodes
      .map((node) => parseTemplateNode(node, options))
      .filter(Boolean)
  } catch (error) {
    throw new Error(`Template parsing failed: ${error.message}`)
  }
}
