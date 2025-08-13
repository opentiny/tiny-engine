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

/**
 * 转换状态
 * @param {Object} state - 原始状态
 * @returns {Object} 转换后的状态
 */
function transformState(state) {
  const result = {}

  Object.keys(state).forEach((key) => {
    const stateItem = state[key]

    if (typeof stateItem === 'object' && stateItem.type) {
      switch (stateItem.type) {
        case 'reactive':
          result[key] = {
            type: 'JSExpression',
            value: stateItem.value
          }
          break
        case 'ref':
          result[key] = {
            type: 'JSExpression',
            value: stateItem.value
          }
          break
        default:
          result[key] = stateItem.value || stateItem
      }
    } else {
      result[key] = stateItem
    }
  })

  return result
}

/**
 * 转换方法
 * @param {Object} methods - 原始方法
 * @returns {Object} 转换后的方法
 */
function transformMethods(methods) {
  const result = {}

  Object.keys(methods).forEach((key) => {
    const method = methods[key]

    if (typeof method === 'object' && method.value) {
      result[key] = {
        type: 'JSFunction',
        value: method.value
      }
    } else if (typeof method === 'string') {
      result[key] = {
        type: 'JSFunction',
        value: method
      }
    } else {
      result[key] = {
        type: 'JSFunction',
        value: 'function() { /* method implementation */ }'
      }
    }
  })

  return result
}

/**
 * 转换计算属性
 * @param {Object} computed - 原始计算属性
 * @returns {Object} 转换后的计算属性
 */
function transformComputed(computed) {
  const result = {}

  Object.keys(computed).forEach((key) => {
    const computedItem = computed[key]

    if (typeof computedItem === 'object' && computedItem.value) {
      result[key] = {
        type: 'JSFunction',
        value: computedItem.value
      }
    } else if (typeof computedItem === 'string') {
      result[key] = {
        type: 'JSFunction',
        value: computedItem
      }
    } else {
      result[key] = {
        type: 'JSFunction',
        value: 'function() { /* computed getter */ }'
      }
    }
  })

  return result
}

/**
 * 转换生命周期
 * @param {Object} lifecycle - 原始生命周期
 * @returns {Object} 转换后的生命周期
 */
function transformLifecycle(lifecycle) {
  const result = {}

  Object.keys(lifecycle).forEach((key) => {
    const lifecycleItem = lifecycle[key]

    if (typeof lifecycleItem === 'object' && lifecycleItem.value) {
      result[key] = {
        type: 'JSFunction',
        value: lifecycleItem.value
      }
    } else if (typeof lifecycleItem === 'string') {
      result[key] = {
        type: 'JSFunction',
        value: lifecycleItem
      }
    } else {
      result[key] = {
        type: 'JSFunction',
        value: 'function() { /* lifecycle hook */ }'
      }
    }
  })

  return result
}

/**
 * 转换属性
 * @param {Array} props - 原始属性
 * @returns {Array} 转换后的属性
 */
function transformProps(props) {
  return props.map((prop) => {
    if (typeof prop === 'string') {
      return {
        name: prop,
        type: 'any',
        default: undefined
      }
    } else if (typeof prop === 'object') {
      return {
        name: prop.name || 'unknownProp',
        type: prop.type || 'any',
        default: prop.default,
        required: prop.required || false
      }
    }
    return prop
  })
}

/**
 * 生成DSL Schema
 * @param {Array} templateSchema - 模板Schema
 * @param {Object} scriptSchema - 脚本Schema
 * @param {Object} styleSchema - 样式Schema
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 生成的Schema
 */
export async function generateSchema(templateSchema, scriptSchema, styleSchema, options = {}) {
  try {
    const schema = {
      componentName: 'Page',
      fileName: options.fileName || 'UnnamedPage',
      path: options.path || '',
      meta: {
        title: options.title || 'Generated Page',
        description: options.description || 'Page generated from Vue SFC',
        generatedAt: new Date().toISOString(),
        generator: '@opentiny/tiny-engine-vue-to-dsl'
      }
    }

    // 合并脚本Schema
    if (scriptSchema) {
      if (scriptSchema.state) {
        schema.state = transformState(scriptSchema.state)
      }

      if (scriptSchema.methods) {
        schema.methods = transformMethods(scriptSchema.methods)
      }

      if (scriptSchema.computed) {
        schema.computed = transformComputed(scriptSchema.computed)
      }

      if (scriptSchema.lifecycle) {
        schema.lifecycle = transformLifecycle(scriptSchema.lifecycle)
      }

      if (scriptSchema.props && scriptSchema.props.length > 0) {
        schema.props = transformProps(scriptSchema.props)
      }
    }

    // 合并样式Schema
    if (styleSchema && styleSchema.css) {
      schema.css = styleSchema.css
    }

    // 合并模板Schema
    if (templateSchema && templateSchema.length > 0) {
      schema.children = templateSchema
    }

    return schema
  } catch (error) {
    throw new Error(`Schema generation failed: ${error.message}`)
  }
}

/**
 * 生成应用Schema
 * @param {Array} pageSchemas - 页面Schema数组
 * @param {Object} options - 选项
 * @returns {Object} 应用Schema
 */
export function generateAppSchema(pageSchemas, options = {}) {
  return {
    id: options.id || 'generated-app',
    name: options.name || 'Generated App',
    version: '1.0.0',
    description: options.description || 'App generated from Vue SFC files',
    meta: {
      generatedAt: new Date().toISOString(),
      generator: '@opentiny/tiny-engine-vue-to-dsl',
      sourceType: 'vue-sfc'
    },
    i18n: options.i18n || {
      en_US: {},
      zh_CN: {}
    },
    utils: options.utils || [],
    dataSource: options.dataSource || {
      list: []
    },
    globalState: options.globalState || [],
    pageSchema: pageSchemas || [],
    blockSchema: options.blockSchema || [],
    componentsMap: options.componentsMap || []
  }
}
