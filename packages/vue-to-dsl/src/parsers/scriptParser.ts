import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'
import * as t from '@babel/types'

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
  'beforeDestroy',
  'setup'
]

function isVueReactiveCall(node: any, apiName: string) {
  if (!t.isCallExpression(node)) return false
  // direct call: reactive()/ref()/computed()
  if (t.isIdentifier(node.callee) && node.callee.name === apiName) return true
  // member call: vue.reactive()/Vue.ref()/anything.ref()
  if (t.isMemberExpression(node.callee)) {
    const callee = node.callee
    const prop = callee.property
    if (t.isIdentifier(prop) && prop.name === apiName) return true
  }
  return false
}

function isLifecycleHook(name: string) {
  return LIFECYCLE_HOOKS.includes(name)
}

function getNodeValue(node: any): any {
  if (t.isStringLiteral(node)) return node.value
  if (t.isNumericLiteral(node)) return node.value
  if (t.isBooleanLiteral(node)) return node.value
  if (t.isNullLiteral(node)) return null
  if (t.isUnaryExpression(node) && node.operator === '-' && t.isNumericLiteral(node.argument)) {
    return -node.argument.value
  }
  if (t.isCallExpression(node)) {
    let calleeStr = ''
    if (t.isIdentifier(node.callee)) {
      calleeStr = node.callee.name
    } else if (t.isMemberExpression(node.callee)) {
      const obj = node.callee.object as any
      const prop = node.callee.property as any
      const objStr = t.isIdentifier(obj) ? obj.name : ''
      const propStr = t.isIdentifier(prop) ? prop.name : ''
      if (objStr && propStr) calleeStr = `${objStr}.${propStr}`
    }
    const args = node.arguments.map((arg: any) => getNodeValue(arg))
    if (calleeStr)
      return `${calleeStr}(${args.map((a: any) => (typeof a === 'string' ? `'${a}'` : String(a))).join(', ')})`
    return 'undefined'
  }
  if (t.isObjectExpression(node)) {
    const obj: Record<string, any> = {}
    node.properties.forEach((prop: any) => {
      if (t.isObjectProperty(prop)) {
        let keyName: string | null = null
        if (t.isIdentifier(prop.key)) keyName = prop.key.name
        else if (t.isStringLiteral(prop.key)) keyName = prop.key.value
        else if (t.isNumericLiteral(prop.key)) keyName = String(prop.key.value)
        if (keyName) obj[keyName] = getNodeValue(prop.value as any)
      }
    })
    return obj
  }
  if (t.isArrayExpression(node)) {
    return node.elements.map((el: any) => (el ? getNodeValue(el) : null))
  }
  return 'undefined'
}

function getSource(node: any, source: string): string {
  if (!node) return ''
  const start = (node as any).start
  const end = (node as any).end
  if (typeof start === 'number' && typeof end === 'number') return source.slice(start, end)
  return ''
}

function arrowToFunctionString(name: string, node: t.ArrowFunctionExpression, source: string) {
  const asyncStr = node.async ? 'async ' : ''
  const params = node.params.map((p) => getSource(p, source)).join(', ')
  if (t.isBlockStatement(node.body)) {
    const body = getSource(node.body, source)
    return `${asyncStr}function ${name}(${params}) ${body}`
  }
  const expr = getSource(node.body, source)
  return `${asyncStr}function ${name}(${params}) { return ${expr}; }`
}

function functionExpressionToNamedFunctionString(
  name: string,
  node: t.FunctionExpression | t.ObjectMethod,
  source: string
) {
  const asyncStr = (node as any).async ? 'async ' : ''
  const params = (node as any).params.map((p: any) => getSource(p, source)).join(', ')
  const body = getSource((node as any).body, source)
  return `${asyncStr}function ${name}(${params}) ${body}`
}

// ---- setup 专属逻辑的小分支封装（共享生命周期处理主干）----
const isSetupName = (name: string) => name === 'setup'

function setLifecycleEntry(result: any, name: string, code: string, opts: { noOverride?: boolean } = {}) {
  if (opts.noOverride && result.lifecycle[name]) return
  result.lifecycle[name] = { type: 'lifecycle', value: code || (name ? `function ${name}(){}` : 'function() {}') }
}

function setMethodEntry(result: any, name: string, code: string) {
  result.methods[name] = { type: 'function', value: code || `function ${name}(){}` }
}

function routeFunctionLikeByName(result: any, name: string, code: string) {
  if (isSetupName(name)) setLifecycleEntry(result, name, code)
  else setMethodEntry(result, name, code)
}

// Helpers to reduce duplication when handling variable declarators in <script setup>
function addMethodFromFunctionLike(name: string, init: any, result: any, source: string): boolean {
  // Direct function-like: foo = () => {} | function() {}
  if (t.isArrowFunctionExpression(init)) {
    const code = arrowToFunctionString(name, init, source)
    routeFunctionLikeByName(result, name, code)
    return true
  }
  if (t.isFunctionExpression(init)) {
    const code = getSource(init, source)
    routeFunctionLikeByName(result, name, code)
    return true
  }

  // Wrapped function-like by helper: foo = wrap(() => {}) | wrap(function() {})
  // Only treat known wrapper identifier 'wrap' as method binder to avoid misclassifying calls like computed(() => {}).
  if (t.isCallExpression(init) && t.isIdentifier(init.callee) && init.callee.name === 'wrap') {
    const fnArg = init.arguments.find(
      (arg: any) => t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)
    ) as any
    if (fnArg) {
      if (t.isArrowFunctionExpression(fnArg)) {
        const code = arrowToFunctionString(name, fnArg, source)
        routeFunctionLikeByName(result, name, code)
        return true
      }
      if (t.isFunctionExpression(fnArg)) {
        const code = functionExpressionToNamedFunctionString(name, fnArg, source)
        routeFunctionLikeByName(result, name, code)
        return true
      }
    }
  }
  return false
}

function assignStateIfNamedState(name: string, init: any, result: any): boolean {
  if (name !== 'state') return false
  const initCode = getNodeValue(init)
  if (isVueReactiveCall(init, 'reactive')) {
    const firstArg = init.arguments && init.arguments[0]
    if (t.isObjectExpression(firstArg)) {
      firstArg.properties.forEach((prop: any) => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          const propName = prop.key.name
          const propValue = prop.value ? getNodeValue(prop.value) : undefined
          result.state[propName] = { type: 'reactive', value: propValue }
        }
      })
    } else {
      result.state[name] = { type: 'reactive', value: initCode }
    }
    return true
  }
  if (isVueReactiveCall(init, 'ref')) {
    result.state[name] = { type: 'ref', value: initCode }
    return true
  }
  // normal non-reactive assignment to state
  result.state[name] = { type: 'normal', value: initCode }
  return true
}

function assignComputedIfComputed(name: string, init: any, result: any, source: string): boolean {
  if (!isVueReactiveCall(init, 'computed')) return false
  const firstArg = (init.arguments && init.arguments[0]) as any
  let compCode = firstArg ? getSource(firstArg, source) : getNodeValue(init)
  if (firstArg) {
    if (t.isArrowFunctionExpression(firstArg)) compCode = arrowToFunctionString(name, firstArg, source)
    else if (t.isFunctionExpression(firstArg))
      compCode = functionExpressionToNamedFunctionString(name, firstArg, source)
  }
  result.computed[name] = { type: 'computed', value: compCode }
  return true
}

function handleVariableDeclarator(name: string, init: any, result: any, source: string) {
  // 1) function-like assignments become methods
  if (addMethodFromFunctionLike(name, init, result, source)) return
  // 2) state-only extraction
  if (assignStateIfNamedState(name, init, result)) return
  // 3) computed regardless of name
  if (assignComputedIfComputed(name, init, result, source)) return
  // 4) otherwise ignored for state (per requirement), no-op
}

function parseSetupFunctionBody(body: any, result: any, source: string) {
  if (!t.isBlockStatement(body)) return
  const declaredFunctions = new Set<string>()
  const functionBodies: Record<string, string> = {}

  body.body.forEach((statement: any) => {
    if (t.isFunctionDeclaration(statement) && statement.id) declaredFunctions.add(statement.id.name)
  })

  body.body.forEach((statement: any) => {
    if (t.isVariableDeclaration(statement)) {
      statement.declarations.forEach((declaration: any) => {
        if (t.isIdentifier(declaration.id) && declaration.init) {
          const name = declaration.id.name
          handleVariableDeclarator(name, declaration.init, result, source)
        }
      })
    } else if (t.isFunctionDeclaration(statement)) {
      const name = statement.id!.name
      const fnCode = getSource(statement, source)
      functionBodies[name] = fnCode
      routeFunctionLikeByName(result, name, fnCode)
    } else if (t.isExpressionStatement(statement) && t.isCallExpression(statement.expression)) {
      const call = statement.expression
      if (t.isIdentifier(call.callee) && isLifecycleHook(call.callee.name)) {
        const cb = call.arguments && (call.arguments[0] as any)
        let cbCode = 'function() { /* lifecycle hook */ }'
        if (cb) {
          if (t.isArrowFunctionExpression(cb)) cbCode = arrowToFunctionString(call.callee.name, cb, source)
          else if (t.isFunctionExpression(cb))
            cbCode = functionExpressionToNamedFunctionString(call.callee.name, cb, source)
        }
        setLifecycleEntry(result, call.callee.name, cbCode)
      }
    }

    if (t.isReturnStatement(statement) && t.isObjectExpression(statement.argument)) {
      statement.argument.properties.forEach((prop: any) => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          const name = prop.key.name
          if (!result.state[name] && !result.computed[name] && declaredFunctions.has(name)) {
            const bodyCode = functionBodies[name] || `function ${name}(){}`
            result.methods[name] = { type: 'function', value: bodyCode }
          } else if (!result.state[name] && !result.methods[name] && !result.computed[name]) {
            result.methods[name] = { type: 'function', value: `function ${name}(){}` }
          }
        }
      })
    }
  })
}

function parseSetupFunction(prop: any, result: any, source: string) {
  if ((t as any).isFunction(prop.value)) parseSetupFunctionBody((prop.value as any).body, result, source)
}

function parseSetupMethod(method: any, result: any, source: string) {
  parseSetupFunctionBody(method.body, result, source)
}

function parsePropsSimple(node: any) {
  if (t.isArrayExpression(node)) {
    return node.elements.map((e: any) => (t.isStringLiteral(e) ? { name: e.value, type: 'any' } : null)).filter(Boolean)
  }
  return []
}

function parseMethodsSimple(node: any, source: string) {
  if (!t.isObjectExpression(node)) return {}
  const methods: Record<string, any> = {}
  node.properties.forEach((prop: any) => {
    if (t.isObjectMethod(prop) && t.isIdentifier(prop.key)) {
      const name = prop.key.name
      const code = getSource(prop, source)
      methods[name] = { type: 'function', value: code || `function ${name}(){}` }
    } else if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
      const name = prop.key.name
      if (t.isFunctionExpression(prop.value)) {
        const code = getSource(prop.value, source)
        methods[name] = { type: 'function', value: code || `function ${name}(){}` }
      } else if (t.isArrowFunctionExpression(prop.value)) {
        const code = arrowToFunctionString(name, prop.value, source)
        methods[name] = { type: 'function', value: code }
      } else {
        methods[name] = { type: 'function', value: 'function() {}' }
      }
    }
  })
  return methods
}

function parseComputedSimple(node: any, source: string) {
  if (!t.isObjectExpression(node)) return {}
  const computed: Record<string, any> = {}
  node.properties.forEach((prop: any) => {
    if (t.isObjectMethod(prop) && t.isIdentifier(prop.key)) {
      const name = prop.key.name
      const code = functionExpressionToNamedFunctionString(name, prop as any, source)
      computed[name] = { type: 'computed', value: code || 'function() {}' }
    } else if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
      const name = prop.key.name
      if (t.isFunctionExpression(prop.value)) {
        const code = getSource(prop.value, source)
        computed[name] = { type: 'computed', value: code || 'function() {}' }
      } else if (t.isArrowFunctionExpression(prop.value)) {
        const code = arrowToFunctionString(name, prop.value, source)
        computed[name] = { type: 'computed', value: code }
      } else {
        computed[name] = { type: 'computed', value: 'function() {}' }
      }
    }
  })
  return computed
}

function parseOptionsObject(objectExpression: any, result: any, source: string) {
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
          result.methods = parseMethodsSimple(prop.value, source)
          break
        case 'computed':
          result.computed = parseComputedSimple(prop.value, source)
          break
        case 'setup':
          // 解析 setup 函数体提取内部方法/状态
          parseSetupFunction(prop, result, source)
          // 同时将 setup 作为生命周期输出
          {
            const val: any = (prop as any).value
            if (t.isFunctionExpression(val)) {
              const code = functionExpressionToNamedFunctionString('setup', val, source)
              setLifecycleEntry(result, 'setup', code)
            } else if (t.isArrowFunctionExpression(val)) {
              const code = arrowToFunctionString('setup', val, source)
              setLifecycleEntry(result, 'setup', code)
            }
          }
          break
        default:
          if (isLifecycleHook(key)) {
            const val: any = (prop as any).value
            if (t.isFunctionExpression(val)) {
              const code = functionExpressionToNamedFunctionString(key, val, source)
              setLifecycleEntry(result, key, code || 'function() {}')
            } else if (t.isArrowFunctionExpression(val)) {
              const code = arrowToFunctionString(key, val, source)
              setLifecycleEntry(result, key, code)
            } else {
              setLifecycleEntry(result, key, 'function() { /* lifecycle hook */ }')
            }
          }
      }
    } else if (t.isObjectMethod(prop) && t.isIdentifier(prop.key)) {
      const key = prop.key.name
      if (key === 'setup') {
        // 输出 setup 生命周期，并解析其函数体
        const code = functionExpressionToNamedFunctionString('setup', prop, source)
        setLifecycleEntry(result, 'setup', code)
        parseSetupMethod(prop, result, source)
      } else if (isLifecycleHook(key)) {
        const code = functionExpressionToNamedFunctionString(key, prop, source)
        setLifecycleEntry(result, key, code)
      }
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
          imported: (spec as any).imported ? (spec as any).imported.name : 'default'
        }))
      })
    }
  })
}

function parseSetupScript(ast: any, result: any, source: string) {
  traverse(ast as any, {
    VariableDeclaration(path: any) {
      path.node.declarations.forEach((declaration: any) => {
        if (t.isIdentifier(declaration.id) && declaration.init) {
          const name = declaration.id.name
          handleVariableDeclarator(name, declaration.init, result, source)
        }
      })
    },
    FunctionDeclaration(path: any) {
      const name = path.node.id.name
      const code = getSource(path.node, source)
      routeFunctionLikeByName(result, name, code)
    },
    CallExpression(path: any) {
      const callee = path.node.callee
      let hookName: string | null = null
      if (t.isIdentifier(callee)) hookName = callee.name
      else if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) hookName = callee.property.name

      if (hookName && isLifecycleHook(hookName)) {
        // 避免 obj.setup() 这类成员调用被误判为生命周期
        if (hookName === 'setup' && !t.isIdentifier(callee)) return
        const cb = path.node.arguments && (path.node.arguments[0] as any)
        let cbCode = 'function() { /* lifecycle hook */ }'
        if (cb) {
          if (t.isArrowFunctionExpression(cb)) cbCode = arrowToFunctionString(hookName, cb, source)
          else if (t.isFunctionExpression(cb)) cbCode = functionExpressionToNamedFunctionString(hookName, cb, source)
        }
        // 若已捕获 setup 的函数体，则不要被调用形式覆盖
        if (hookName === 'setup') setLifecycleEntry(result, hookName, cbCode, { noOverride: true })
        else setLifecycleEntry(result, hookName, cbCode)
      }
    }
  })
}

function parseOptionsAPI(ast: any, result: any, source: string) {
  traverse(ast as any, {
    ExportDefaultDeclaration(path: any) {
      if (t.isObjectExpression(path.node.declaration)) parseOptionsObject(path.node.declaration, result, source)
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
    if (options.isSetup) parseSetupScript(ast, result, script)
    else parseOptionsAPI(ast, result, script)
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
