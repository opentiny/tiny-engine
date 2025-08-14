import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'
import * as t from '@babel/types'

// Work around ESM/CJS interop: in ts-node/esm, @babel/traverse may be a namespace with default export
const traverse: any = (traverseModule as any)?.default ?? (traverseModule as any)

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

function isVueReactiveCall(node: any, apiName: string) {
  return t.isCallExpression(node) && t.isIdentifier(node.callee) && node.callee.name === apiName
}

function isLifecycleHook(name: string) {
  return LIFECYCLE_HOOKS.includes(name)
}

function getNodeValue(node: any): string {
  if (t.isStringLiteral(node)) return `"${node.value}"`
  if (t.isNumericLiteral(node)) return node.value.toString()
  if (t.isBooleanLiteral(node)) return node.value.toString()
  if (t.isNullLiteral(node)) return 'null'
  if (t.isCallExpression(node) && t.isIdentifier(node.callee)) {
    const funcName = node.callee.name
    const args = node.arguments.map((arg: any) => getNodeValue(arg)).join(', ')
    return `${funcName}(${args})`
  }
  if (t.isObjectExpression(node)) return '{}'
  if (t.isArrayExpression(node)) return '[]'
  return 'undefined'
}

function parseSetupFunctionBody(body: any, result: any) {
  if (!t.isBlockStatement(body)) return
  const declaredFunctions = new Set<string>()
  body.body.forEach((statement: any) => {
    if (t.isFunctionDeclaration(statement) && statement.id) declaredFunctions.add(statement.id.name)
  })
  body.body.forEach((statement: any) => {
    if (t.isVariableDeclaration(statement)) {
      statement.declarations.forEach((declaration: any) => {
        if (t.isIdentifier(declaration.id) && declaration.init) {
          const name = declaration.id.name
          const initCode = getNodeValue(declaration.init)
          if (t.isArrowFunctionExpression(declaration.init) || t.isFunctionExpression(declaration.init)) {
            result.methods[name] = { type: 'function', value: `function ${name}() { /* function body */ }` }
            return
          }
          if (isVueReactiveCall(declaration.init, 'reactive')) {
            const firstArg = declaration.init.arguments && declaration.init.arguments[0]
            if (t.isObjectExpression(firstArg)) {
              firstArg.properties.forEach((prop: any) => {
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
    } else if (t.isFunctionDeclaration(statement)) {
      const name = statement.id!.name
      result.methods[name] = { type: 'function', value: `function ${name}() { /* function body */ }` }
    } else if (t.isExpressionStatement(statement) && t.isCallExpression(statement.expression)) {
      const call = statement.expression
      if (t.isIdentifier(call.callee) && isLifecycleHook(call.callee.name)) {
        result.lifecycle[call.callee.name] = { type: 'lifecycle', value: 'function() { /* lifecycle hook */ }' }
      }
    }
    if (t.isReturnStatement(statement) && t.isObjectExpression(statement.argument)) {
      statement.argument.properties.forEach((prop: any) => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          const name = prop.key.name
          if (!result.state[name] && !result.computed[name] && declaredFunctions.has(name)) {
            result.methods[name] = { type: 'function', value: `function ${name}() { /* function body */ }` }
          } else if (!result.state[name] && !result.methods[name] && !result.computed[name]) {
            result.methods[name] = { type: 'function', value: `function ${name}() { /* function body */ }` }
          }
        }
      })
    }
  })
}

function parseSetupFunction(prop: any, result: any) {
  if ((t as any).isFunction(prop.value)) parseSetupFunctionBody((prop.value as any).body, result)
}

function parseSetupMethod(method: any, result: any) {
  parseSetupFunctionBody(method.body, result)
}

function parsePropsSimple(node: any) {
  if (t.isArrayExpression(node)) {
    return node.elements
      .map((element: any) => (t.isStringLiteral(element) ? { name: element.value, type: 'any' } : null))
      .filter(Boolean)
  }
  return []
}

function parseMethodsSimple(node: any) {
  if (t.isObjectExpression(node)) {
    const methods: Record<string, any> = {}
    node.properties.forEach((prop: any) => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        methods[prop.key.name] = { type: 'function', value: 'function() { /* method body */ }' }
      }
    })
    return methods
  }
  return {}
}

function parseComputedSimple(node: any) {
  if (t.isObjectExpression(node)) {
    const computed: Record<string, any> = {}
    node.properties.forEach((prop: any) => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        computed[prop.key.name] = { type: 'computed', value: 'function() { /* computed body */ }' }
      }
    })
    return computed
  }
  return {}
}

function parseOptionsObject(objectExpression: any, result: any) {
  objectExpression.properties.forEach((prop: any) => {
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
            result.lifecycle[key] = { type: 'lifecycle', value: 'function() { /* lifecycle hook */ }' }
          }
      }
    } else if (t.isObjectMethod(prop) && t.isIdentifier(prop.key)) {
      const key = prop.key.name
      if (key === 'setup') parseSetupMethod(prop, result)
    }
  })
}

function parseImports(ast: any, result: any) {
  traverse(ast as any, {
    ImportDeclaration(path: any) {
      result.imports.push({
        source: path.node.source.value,
        specifiers: path.node.specifiers.map((spec: any) => ({
          local: spec.local.name,
          imported: spec.imported ? spec.imported.name : 'default'
        }))
      })
    }
  })
}

function parseSetupScript(ast: any, result: any) {
  traverse(ast as any, {
    VariableDeclaration(path: any) {
      path.node.declarations.forEach((declaration: any) => {
        if (t.isIdentifier(declaration.id) && declaration.init) {
          const name = declaration.id.name
          const initCode = getNodeValue(declaration.init)
          if (t.isArrowFunctionExpression(declaration.init) || t.isFunctionExpression(declaration.init)) {
            result.methods[name] = { type: 'function', value: `function ${name}() { /* function body */ }` }
            return
          }
          if (isVueReactiveCall(declaration.init, 'reactive')) {
            const firstArg = declaration.init.arguments && declaration.init.arguments[0]
            if (t.isObjectExpression(firstArg)) {
              firstArg.properties.forEach((prop: any) => {
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
    FunctionDeclaration(path: any) {
      const name = path.node.id.name
      result.methods[name] = { type: 'function', value: 'function() { /* function body */ }' }
    },
    CallExpression(path: any) {
      if (t.isIdentifier(path.node.callee)) {
        const name = path.node.callee.name
        if (isLifecycleHook(name)) {
          result.lifecycle[name] = { type: 'lifecycle', value: 'function() { /* lifecycle hook */ }' }
        }
      }
    }
  })
}

function parseOptionsAPI(ast: any, result: any) {
  traverse(ast as any, {
    ExportDefaultDeclaration(path: any) {
      if (t.isObjectExpression(path.node.declaration)) parseOptionsObject(path.node.declaration, result)
    }
  })
}

export function parseScript(script: string, options: any = {}) {
  try {
    const ast = parse(script, { sourceType: 'module', plugins: ['typescript', 'jsx'] as any })
    const result = {
      imports: [] as any[],
      props: [] as any[],
      emits: [] as any[],
      state: {} as any,
      methods: {} as any,
      computed: {} as any,
      lifecycle: {} as any
    }
    parseImports(ast, result)
    if (options.isSetup) parseSetupScript(ast, result)
    else parseOptionsAPI(ast, result)
    return result
  } catch (error: any) {
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
