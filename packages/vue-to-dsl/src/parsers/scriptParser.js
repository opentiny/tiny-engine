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

import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'

// 生命周期钩子列表
const LIFECYCLE_HOOKS = [
  'onMounted',
  'onUpdated',
  'onUnmounted',
  'onBeforeMount',
  'onBeforeUpdate',
  'onBeforeUnmount',
  'onActivated',
  'onDeactivated',
  'mounted',
  'updated',
  'unmounted',
  'beforeMount',
  'beforeUpdate',
  'beforeUnmount',
  'activated',
  'deactivated',
  'created',
  'beforeCreate',
  'destroyed',
  'beforeDestroy'
]

/**
 * 检查是否是Vue响应式API调用
 */
function isVueReactiveCall(node, apiName) {
  return t.isCallExpression(node) && t.isIdentifier(node.callee) && node.callee.name === apiName
}

/**
 * 检查是否是生命周期钩子
 */
function isLifecycleHook(name) {
  return LIFECYCLE_HOOKS.includes(name)
}

/**
 * 获取节点的简单值
 */
function getNodeValue(node) {
  if (t.isStringLiteral(node)) {
    return `"${node.value}"`
  } else if (t.isNumericLiteral(node)) {
    return node.value.toString()
  } else if (t.isBooleanLiteral(node)) {
    return node.value.toString()
  } else if (t.isNullLiteral(node)) {
    return 'null'
  } else if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
    const funcName = node.callee.name
    const args = node.arguments.map((arg) => getNodeValue(arg)).join(', ')
    return `${funcName}(${args})`
  } else if (t.isObjectExpression(node)) {
    return '{}'
  } else if (t.isArrayExpression(node)) {
    return '[]'
  }
  return 'undefined'
}

/**
 * 解析setup函数体
 */
function parseSetupFunctionBody(body, result) {
  if (!t.isBlockStatement(body)) return

  // 首先收集所有函数声明
  const declaredFunctions = new Set()
  body.body.forEach((statement) => {
    if (t.isFunctionDeclaration(statement) && statement.id) {
      declaredFunctions.add(statement.id.name)
    }
  })

  body.body.forEach((statement) => {
    if (t.isVariableDeclaration(statement)) {
      statement.declarations.forEach((declaration) => {
        if (t.isIdentifier(declaration.id) && declaration.init) {
          const name = declaration.id.name
          const initCode = getNodeValue(declaration.init)

          if (isVueReactiveCall(declaration.init, 'reactive')) {
            result.state[name] = { type: 'reactive', value: initCode }
          } else if (isVueReactiveCall(declaration.init, 'ref')) {
            result.state[name] = { type: 'ref', value: initCode }
          } else if (isVueReactiveCall(declaration.init, 'computed')) {
            result.computed[name] = { type: 'computed', value: initCode }
          } else if (t.isArrowFunctionExpression(declaration.init) || t.isFunctionExpression(declaration.init)) {
            // 箭头函数或函数表达式作为方法
            result.methods[name] = {
              type: 'function',
              value: `function ${name}() { /* function body */ }`
            }
          } else {
            result.state[name] = { type: 'normal', value: initCode }
          }
        }
      })
    } else if (t.isFunctionDeclaration(statement)) {
      const name = statement.id.name
      result.methods[name] = {
        type: 'function',
        value: `function ${name}() { /* function body */ }`
      }
    } else if (t.isExpressionStatement(statement) && t.isCallExpression(statement.expression)) {
      const call = statement.expression
      if (t.isIdentifier(call.callee) && isLifecycleHook(call.callee.name)) {
        result.lifecycle[call.callee.name] = {
          type: 'lifecycle',
          value: 'function() { /* lifecycle hook */ }'
        }
      }
    }

    // 查找return语句中的对象
    if (t.isReturnStatement(statement) && t.isObjectExpression(statement.argument)) {
      statement.argument.properties.forEach((prop) => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          const name = prop.key.name
          // 如果在return中但不在state/computed中，且是函数，则添加到methods
          if (!result.state[name] && !result.computed[name] && declaredFunctions.has(name)) {
            result.methods[name] = {
              type: 'function',
              value: `function ${name}() { /* function body */ }`
            }
          } else if (!result.state[name] && !result.methods[name] && !result.computed[name]) {
            // 如果是变量引用，可能是state
            if (result.state[name]) {
              // 已经在state中了，不需要重复添加
            } else {
              // 检查是否是函数引用
              result.methods[name] = {
                type: 'function',
                value: `function ${name}() { /* function body */ }`
              }
            }
          }
        }
      })
    }
  })
}

/**
 * 解析setup函数（ObjectProperty形式）
 */
function parseSetupFunction(prop, result) {
  if (t.isFunction(prop.value)) {
    parseSetupFunctionBody(prop.value.body, result)
  }
}

/**
 * 解析setup方法（ObjectMethod形式）
 */
function parseSetupMethod(method, result) {
  parseSetupFunctionBody(method.body, result)
}

/**
 * 简单解析Props
 */
function parsePropsSimple(node) {
  if (t.isArrayExpression(node)) {
    return node.elements
      .map((element) => {
        if (t.isStringLiteral(element)) {
          return { name: element.value, type: 'any' }
        }
        return null
      })
      .filter(Boolean)
  }
  return []
}

/**
 * 简单解析Methods
 */
function parseMethodsSimple(node) {
  if (t.isObjectExpression(node)) {
    const methods = {}
    node.properties.forEach((prop) => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        methods[prop.key.name] = {
          type: 'function',
          value: 'function() { /* method body */ }'
        }
      }
    })
    return methods
  }
  return {}
}

/**
 * 简单解析Computed
 */
function parseComputedSimple(node) {
  if (t.isObjectExpression(node)) {
    const computed = {}
    node.properties.forEach((prop) => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        computed[prop.key.name] = {
          type: 'computed',
          value: 'function() { /* computed body */ }'
        }
      }
    })
    return computed
  }
  return {}
}

/**
 * 解析Options对象
 */
function parseOptionsObject(objectExpression, result) {
  objectExpression.properties.forEach((prop) => {
    if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
      const key = prop.key.name

      switch (key) {
        case 'props':
          result.props = parsePropsSimple(prop.value)
          break
        case 'data':
          result.state = { data: 'function() { return {} }' }
          break
        case 'methods':
          result.methods = parseMethodsSimple(prop.value)
          break
        case 'computed':
          result.computed = parseComputedSimple(prop.value)
          break
        case 'setup':
          parseSetupFunction(prop, result)
          break
        default:
          if (isLifecycleHook(key)) {
            result.lifecycle[key] = {
              type: 'lifecycle',
              value: 'function() { /* lifecycle hook */ }'
            }
          }
      }
    } else if (t.isObjectMethod(prop) && t.isIdentifier(prop.key)) {
      const key = prop.key.name
      if (key === 'setup') {
        parseSetupMethod(prop, result)
      }
    }
  })
}

/**
 * 解析导入语句
 */
function parseImports(ast, result) {
  traverse(ast, {
    ImportDeclaration(path) {
      result.imports.push({
        source: path.node.source.value,
        specifiers: path.node.specifiers.map((spec) => ({
          local: spec.local.name,
          imported: spec.imported ? spec.imported.name : 'default'
        }))
      })
    }
  })
}

/**
 * 解析<script setup>脚本
 */
function parseSetupScript(ast, result) {
  traverse(ast, {
    VariableDeclaration(path) {
      path.node.declarations.forEach((declaration) => {
        if (t.isIdentifier(declaration.id) && declaration.init) {
          const name = declaration.id.name
          const initCode = getNodeValue(declaration.init)

          // 方法：箭头函数 / 函数表达式
          if (t.isArrowFunctionExpression(declaration.init) || t.isFunctionExpression(declaration.init)) {
            result.methods[name] = { type: 'function', value: `function ${name}() { /* function body */ }` }
            return
          }

          if (isVueReactiveCall(declaration.init, 'reactive')) {
            // 展开 reactive 对象的属性
            const firstArg = declaration.init.arguments && declaration.init.arguments[0]
            if (t.isObjectExpression(firstArg)) {
              firstArg.properties.forEach((prop) => {
                if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                  const propName = prop.key.name
                  const propValue = prop.value ? getNodeValue(prop.value) : 'undefined'
                  result.state[propName] = { type: 'reactive', value: propValue }
                }
              })
            } else {
              result.state[name] = { type: 'reactive', value: initCode }
            }
          } else if (isVueReactiveCall(declaration.init, 'ref')) {
            result.state[name] = { type: 'ref', value: initCode }
          } else if (isVueReactiveCall(declaration.init, 'computed')) {
            result.computed[name] = { type: 'computed', value: initCode }
          } else {
            result.state[name] = { type: 'normal', value: initCode }
          }
        }
      })
    },

    FunctionDeclaration(path) {
      const name = path.node.id.name
      result.methods[name] = {
        type: 'function',
        value: 'function() { /* function body */ }'
      }
    },

    CallExpression(path) {
      if (t.isIdentifier(path.node.callee)) {
        const name = path.node.callee.name
        if (isLifecycleHook(name)) {
          result.lifecycle[name] = {
            type: 'lifecycle',
            value: 'function() { /* lifecycle hook */ }'
          }
        }
      }
    }
  })
}

/**
 * 解析Options API脚本
 */
function parseOptionsAPI(ast, result) {
  traverse(ast, {
    ExportDefaultDeclaration(path) {
      if (t.isObjectExpression(path.node.declaration)) {
        parseOptionsObject(path.node.declaration, result)
      }
    }
  })
}

/**
 * 解析Vue脚本为DSL Schema
 * @param {string} script - 脚本字符串
 * @param {Object} options - 解析选项
 * @returns {Object} 脚本Schema
 */
export function parseScript(script, options = {}) {
  try {
    const ast = parse(script, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    })

    const result = {
      imports: [],
      props: [],
      emits: [],
      state: {},
      methods: {},
      computed: {},
      lifecycle: {}
    }

    // 解析imports
    parseImports(ast, result)

    // 尝试解析<script setup>
    if (options.isSetup) {
      parseSetupScript(ast, result)
    } else {
      // 解析Options API
      parseOptionsAPI(ast, result)
    }

    return result
  } catch (error) {
    return {
      imports: [],
      props: [],
      emits: [],
      state: {},
      methods: {},
      computed: {},
      lifecycle: {},
      error: error.message
    }
  }
}
