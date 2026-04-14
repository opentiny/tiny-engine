import { parse } from '@babel/parser'
import traverseModule from '@babel/traverse'
import * as t from '@babel/types'

const traverse: any = (traverseModule as any)?.default ?? (traverseModule as any)

const JS_GLOBALS = new Set([
  'Math',
  'Number',
  'String',
  'Boolean',
  'Array',
  'Object',
  'Date',
  'JSON',
  'console',
  'Intl',
  'RegExp',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Promise',
  'Symbol',
  'BigInt',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  'encodeURI',
  'decodeURI',
  'encodeURIComponent',
  'decodeURIComponent',
  'undefined',
  'NaN',
  'Infinity',
  'window',
  'document',
  'localStorage',
  'sessionStorage',
  'navigator',
  'location',
  'history',
  'fetch',
  'URL',
  'URLSearchParams',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'alert'
])

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

function getObjectKeyName(node: any): string | null {
  if (t.isIdentifier(node)) return node.name
  if (t.isStringLiteral(node)) return node.value
  if (t.isNumericLiteral(node)) return String(node.value)
  return null
}

function getJSXAttributeName(node: any): string {
  if (t.isJSXIdentifier(node)) return node.name
  if (t.isJSXNamespacedName(node)) {
    const namespace = t.isJSXIdentifier(node.namespace) ? node.namespace.name : ''
    const name = t.isJSXIdentifier(node.name) ? node.name.name : ''
    return `${namespace}:${name}`
  }
  if (t.isJSXMemberExpression(node)) {
    const objectName = getJSXAttributeName(node.object)
    const propertyName = getJSXAttributeName(node.property)
    return [objectName, propertyName].filter(Boolean).join('.')
  }
  return ''
}

function getJSXTagName(node: any): string {
  if (t.isJSXIdentifier(node)) return node.name
  if (t.isJSXMemberExpression(node)) {
    const objectName = getJSXTagName(node.object)
    const propertyName = getJSXTagName(node.property)
    return [objectName, propertyName].filter(Boolean).join('.')
  }
  if (t.isJSXNamespacedName(node)) {
    return `${getJSXAttributeName(node.namespace)}:${getJSXAttributeName(node.name)}`
  }
  return 'div'
}

function getSource(node: any, source: string): string {
  if (!node) return ''
  const start = (node as any).start
  const end = (node as any).end
  if (typeof start === 'number' && typeof end === 'number') return source.slice(start, end)
  return ''
}

function unwrapExpression(node: any): any {
  if (t.isTSAsExpression(node)) return unwrapExpression(node.expression)
  if (t.isTSTypeAssertion(node)) return unwrapExpression(node.expression)
  if (t.isTSNonNullExpression(node)) return unwrapExpression(node.expression)
  if ((t as any).isParenthesizedExpression?.(node)) return unwrapExpression((node as any).expression)
  return node
}

function applyReplacements(code: string, replacements: Array<{ start: number; end: number; text: string }>) {
  return replacements
    .sort((a, b) => b.start - a.start || b.end - a.end)
    .reduce((output, item) => `${output.slice(0, item.start)}${item.text}${output.slice(item.end)}`, code)
}

function isFrameworkImportSource(source: string) {
  return ['vue', 'vue-i18n'].includes(source)
}

function sanitizeCodeFromNode(node: any, source: string): string {
  const raw = getSource(node, source)
  const baseStart = node?.start
  const baseEnd = node?.end
  if (!raw || typeof baseStart !== 'number' || typeof baseEnd !== 'number') return raw

  let wrappedNode: any
  if (t.isStatement(node)) {
    wrappedNode = node
  } else if (t.isExpression(node)) {
    wrappedNode = t.expressionStatement(node)
  } else {
    wrappedNode = t.functionDeclaration(t.identifier('__temp__'), [node as any], t.blockStatement([]))
  }
  const fileAst = t.file(t.program([wrappedNode]))
  const replacements: Array<{ start: number; end: number; text: string }> = []
  const seenRanges = new Set<string>()

  const pushReplacement = (start: number, end: number, text = '') => {
    if (start >= end) return
    const relativeStart = start - baseStart
    const relativeEnd = end - baseStart
    if (relativeStart < 0 || relativeEnd > raw.length) return
    const key = `${relativeStart}:${relativeEnd}:${text}`
    if (seenRanges.has(key)) return
    seenRanges.add(key)
    replacements.push({ start: relativeStart, end: relativeEnd, text })
  }

  traverse(fileAst as any, {
    TSTypeAnnotation(path: any) {
      pushReplacement(path.node.start, path.node.end)
    },
    TSTypeParameterInstantiation(path: any) {
      pushReplacement(path.node.start, path.node.end)
    },
    TSTypeParameterDeclaration(path: any) {
      pushReplacement(path.node.start, path.node.end)
    },
    TSAsExpression(path: any) {
      pushReplacement(path.node.expression.end, path.node.end)
    },
    TSTypeAssertion(path: any) {
      pushReplacement(path.node.start, path.node.expression.start)
    },
    TSNonNullExpression(path: any) {
      pushReplacement(path.node.expression.end, path.node.end)
    },
    TSInstantiationExpression(path: any) {
      pushReplacement(path.node.expression.end, path.node.end)
    },
    Identifier(path: any) {
      if (!path.node.optional) return
      const typeAnnotationStart = path.node.typeAnnotation?.start
      const optionalStart = path.node.start + String(path.node.name || '').length
      if (typeof typeAnnotationStart === 'number') {
        pushReplacement(optionalStart, typeAnnotationStart)
      } else {
        pushReplacement(optionalStart, optionalStart + 1)
      }
    },
    CallExpression(path: any) {
      const typeParameters = path.node.typeParameters || path.node.typeArguments
      if (typeParameters) pushReplacement(typeParameters.start, typeParameters.end)
    },
    NewExpression(path: any) {
      const typeParameters = path.node.typeParameters || path.node.typeArguments
      if (typeParameters) pushReplacement(typeParameters.start, typeParameters.end)
    }
  })

  return applyReplacements(raw, replacements)
}

function createExpressionValue(node: any, source?: string) {
  const value = source ? sanitizeCodeFromNode(node, source) : ''

  if (!value) return 'undefined'

  return {
    type: 'JSExpression',
    value
  }
}

function getNodeValue(node: any, source = ''): any {
  if (t.isStringLiteral(node)) return node.value
  if (t.isNumericLiteral(node)) return node.value
  if (t.isBooleanLiteral(node)) return node.value
  if (t.isNullLiteral(node)) return null
  if (t.isUnaryExpression(node) && node.operator === '-' && t.isNumericLiteral(node.argument)) {
    return -node.argument.value
  }
  if (t.isTemplateLiteral(node)) {
    if ((node.expressions?.length ?? 0) === 0) {
      return node.quasis.map((item: any) => item.value.cooked).join('')
    }

    return createExpressionValue(node, source)
  }
  if (t.isCallExpression(node)) {
    return createExpressionValue(node, source)
  }
  if (t.isObjectExpression(node)) {
    const obj: Record<string, any> = {}
    node.properties.forEach((prop: any) => {
      if (t.isObjectProperty(prop)) {
        let keyName: string | null = null
        if (t.isIdentifier(prop.key)) keyName = prop.key.name
        else if (t.isStringLiteral(prop.key)) keyName = prop.key.value
        else if (t.isNumericLiteral(prop.key)) keyName = String(prop.key.value)
        if (keyName) obj[keyName] = getNodeValue(prop.value as any, source)
      }
    })
    return obj
  }
  if (t.isArrayExpression(node)) {
    return node.elements.map((el: any) => (el ? getNodeValue(el, source) : null))
  }
  return 'undefined'
}

function getSlotParamNames(params: any[] = []) {
  const firstParam = params[0]
  if (t.isObjectPattern(firstParam)) {
    return firstParam.properties
      .map((item: any) => {
        if (t.isObjectProperty(item) && t.isIdentifier(item.value)) return item.value.name
        if (t.isRestElement(item) && t.isIdentifier(item.argument)) return item.argument.name
        return null
      })
      .filter(Boolean)
  }

  if (t.isIdentifier(firstParam)) {
    return [firstParam.name]
  }

  return []
}

function getReturnedJSXNode(node: any) {
  if (t.isArrowFunctionExpression(node)) {
    if (t.isBlockStatement(node.body)) {
      const returnStatement = node.body.body.find((item: any) => t.isReturnStatement(item) && item.argument)
      if (t.isReturnStatement(returnStatement) && returnStatement.argument) {
        return unwrapExpression(returnStatement.argument)
      }
      return null
    }

    return unwrapExpression(node.body)
  }

  if (t.isFunctionExpression(node)) {
    const returnStatement = node.body.body.find((item: any) => t.isReturnStatement(item) && item.argument)
    if (t.isReturnStatement(returnStatement) && returnStatement.argument) {
      return unwrapExpression(returnStatement.argument)
    }
    return null
  }

  return null
}

function isJSXSlotFunction(node: any) {
  if (!t.isArrowFunctionExpression(node) && !t.isFunctionExpression(node)) return false
  const returnedNode = getReturnedJSXNode(node)
  return t.isJSXElement(returnedNode) || t.isJSXFragment(returnedNode)
}

function getEventHandlerExpression(node: any, source: string) {
  const firstParam =
    node?.params?.[0] && t.isIdentifier(node.params[0])
      ? node.params[0].name
      : node?.params?.[0] && t.isRestElement(node.params[0]) && t.isIdentifier(node.params[0].argument)
      ? node.params[0].argument.name
      : null

  const resolveBodyExpression = (target: any) => {
    const unwrapped = unwrapExpression(target)
    if (t.isCallExpression(unwrapped)) return unwrapped
    if (t.isBlockStatement(unwrapped)) {
      const expressionStatement = unwrapped.body.find((item: any) => t.isExpressionStatement(item))
      if (
        t.isExpressionStatement(expressionStatement) &&
        t.isCallExpression(unwrapExpression(expressionStatement.expression))
      ) {
        return unwrapExpression(expressionStatement.expression)
      }
      const returnStatement = unwrapped.body.find((item: any) => t.isReturnStatement(item) && item.argument)
      if (
        t.isReturnStatement(returnStatement) &&
        returnStatement.argument &&
        t.isCallExpression(unwrapExpression(returnStatement.argument))
      ) {
        return unwrapExpression(returnStatement.argument)
      }
    }
    return null
  }

  const callExpression = resolveBodyExpression(node.body)
  if (!callExpression) return null

  const value = getSource(callExpression.callee, source)
  const params = callExpression.arguments
    .filter((arg: any, index: number) => {
      if (index !== 0 || !firstParam) return true
      return !(t.isIdentifier(arg) && arg.name === firstParam)
    })
    .map((arg: any) => getSource(arg, source))
    .filter(Boolean)

  if (!value) return null

  return {
    type: 'JSExpression',
    value,
    ...(params.length ? { params } : {})
  }
}

function getModelUpdateTarget(node: any, source: string) {
  const firstParam =
    node?.params?.[0] && t.isIdentifier(node.params[0])
      ? node.params[0].name
      : node?.params?.[0] && t.isRestElement(node.params[0]) && t.isIdentifier(node.params[0].argument)
      ? node.params[0].argument.name
      : null

  if (!firstParam) return null

  const resolveAssignment = (target: any): any => {
    const unwrapped = unwrapExpression(target)
    if (t.isAssignmentExpression(unwrapped)) return unwrapped
    if (t.isBlockStatement(unwrapped)) {
      const expressionStatement = unwrapped.body.find((item: any) => t.isExpressionStatement(item))
      if (
        t.isExpressionStatement(expressionStatement) &&
        t.isAssignmentExpression(unwrapExpression(expressionStatement.expression))
      ) {
        return unwrapExpression(expressionStatement.expression)
      }
    }
    return null
  }

  const assignmentExpression = resolveAssignment(node.body)
  if (!assignmentExpression) return null
  if (!t.isIdentifier(assignmentExpression.right) || assignmentExpression.right.name !== firstParam) return null

  return getSource(assignmentExpression.left, source)
}

function parseJSXExpressionValue(node: any, source: string) {
  const target = unwrapExpression(node)
  if (t.isStringLiteral(target)) return target.value
  if (t.isNumericLiteral(target)) return target.value
  if (t.isBooleanLiteral(target)) return target.value
  if (t.isNullLiteral(target)) return null

  return {
    type: 'JSExpression',
    value: getSource(target, source)
  }
}

function parseJSXAttributes(attributes: any[], source: string) {
  const props: Record<string, any> = {}
  const pendingModelTargets: Record<string, string> = {}

  attributes.forEach((attr: any) => {
    if (!t.isJSXAttribute(attr)) return
    let attrName = getJSXAttributeName(attr.name)
    if (!attrName) return
    if (attrName === 'class') attrName = 'className'

    if (attr.value === null) {
      props[attrName] = true
      return
    }

    if (t.isStringLiteral(attr.value)) {
      props[attrName] = attr.value.value
      return
    }

    if (!t.isJSXExpressionContainer(attr.value) || t.isJSXEmptyExpression(attr.value.expression)) {
      props[attrName] = ''
      return
    }

    const expression = unwrapExpression(attr.value.expression)

    if ((attrName === 'onUpdate:modelValue' || attrName === 'onUpdate') && t.isArrowFunctionExpression(expression)) {
      const modelTarget = getModelUpdateTarget(expression, source)
      if (modelTarget) {
        pendingModelTargets.modelValue = modelTarget
        return
      }
    }

    if (attrName.startsWith('on') && (t.isArrowFunctionExpression(expression) || t.isFunctionExpression(expression))) {
      const handler = getEventHandlerExpression(expression, source)
      if (handler) {
        props[attrName] = handler
        return
      }

      props[attrName] = {
        type: 'JSFunction',
        value: sanitizeCodeFromNode(expression, source)
      }
      return
    }

    props[attrName] = parseJSXExpressionValue(expression, source)
  })

  if (pendingModelTargets.modelValue && props.modelValue?.type === 'JSExpression') {
    props.modelValue = {
      ...props.modelValue,
      model: true
    }
  }

  return props
}

const jsxSchemaParser = {
  parseChild(node: any, source: string): any {
    if (t.isJSXText(node)) {
      const text = node.value.replace(/\s+/g, ' ').trim()
      return text || null
    }

    if (t.isJSXExpressionContainer(node)) {
      if (t.isJSXEmptyExpression(node.expression)) return null
      const expression = unwrapExpression(node.expression)
      if (t.isJSXElement(expression) || t.isJSXFragment(expression)) {
        return this.parseReturn(expression, source)
      }
      return {
        type: 'JSExpression',
        value: getSource(expression, source)
      }
    }

    if (t.isJSXElement(node) || t.isJSXFragment(node)) {
      return this.parseReturn(node, source)
    }

    return null
  },

  normalizeChildren(children: any[], source: string) {
    const normalizedChildren = children
      .flatMap((child: any) => {
        const parsed = this.parseChild(child, source)
        if (Array.isArray(parsed)) return parsed
        return parsed === null || parsed === undefined ? [] : [parsed]
      })
      .filter((item) => item !== null && item !== undefined && item !== '')

    if (!normalizedChildren.length) return []
    if (normalizedChildren.length === 1) {
      const [firstChild] = normalizedChildren
      if (typeof firstChild === 'string' || firstChild?.type === 'JSExpression') {
        return firstChild
      }
    }

    return normalizedChildren
  },

  parseElement(node: any, source: string): any {
    const schema: any = {
      componentName: getJSXTagName(node.openingElement.name),
      props: parseJSXAttributes(node.openingElement.attributes || [], source)
    }

    const normalizedChildren = this.normalizeChildren(node.children || [], source)
    if (Array.isArray(normalizedChildren)) {
      if (normalizedChildren.length) schema.children = normalizedChildren
    } else if (normalizedChildren !== undefined) {
      schema.children = normalizedChildren
    }

    return schema
  },

  parseReturn(node: any, source: string): any[] {
    const target = unwrapExpression(node)
    if (t.isJSXFragment(target)) {
      const normalizedChildren = this.normalizeChildren(target.children || [], source)
      if (Array.isArray(normalizedChildren)) {
        return normalizedChildren.flatMap((item: any) => (Array.isArray(item) ? item : [item]))
      }
      return normalizedChildren === null || normalizedChildren === undefined ? [] : [normalizedChildren]
    }
    if (t.isJSXElement(target)) {
      return [this.parseElement(target, source)]
    }
    return []
  }
}

function parseJSXReturnToSchema(node: any, source: string): any[] {
  return jsxSchemaParser.parseReturn(node, source)
}

function getReturnedRenderNode(node: any) {
  if (t.isArrowFunctionExpression(node)) {
    if (t.isBlockStatement(node.body)) {
      const returnStatement = node.body.body.find((item: any) => t.isReturnStatement(item) && item.argument)
      if (t.isReturnStatement(returnStatement) && returnStatement.argument) {
        return unwrapExpression(returnStatement.argument)
      }
      return null
    }

    return unwrapExpression(node.body)
  }

  if (t.isFunctionExpression(node)) {
    const returnStatement = node.body.body.find((item: any) => t.isReturnStatement(item) && item.argument)
    if (t.isReturnStatement(returnStatement) && returnStatement.argument) {
      return unwrapExpression(returnStatement.argument)
    }
    return null
  }

  return null
}

function isHCallExpression(node: any) {
  const target = unwrapExpression(node)
  return t.isCallExpression(target) && t.isIdentifier(target.callee) && target.callee.name === 'h'
}

function parseHExpressionValue(node: any, source: string): any {
  const target = unwrapExpression(node)
  if (t.isStringLiteral(target)) return target.value
  if (t.isNumericLiteral(target)) return target.value
  if (t.isBooleanLiteral(target)) return target.value
  if (t.isNullLiteral(target)) return null

  return {
    type: 'JSExpression',
    value: getSource(target, source)
  }
}

function parseHPropsObject(node: any, source: string) {
  if (!t.isObjectExpression(node)) return {}

  const props: Record<string, any> = {}
  const pendingModelTargets: Record<string, string> = {}

  node.properties.forEach((property: any) => {
    if (!t.isObjectProperty(property)) return
    const keyName = getObjectKeyName(property.key)
    if (!keyName) return
    const attrName = keyName === 'class' ? 'className' : keyName
    const valueNode = unwrapExpression(property.value)

    if ((attrName === 'onUpdate:modelValue' || attrName === 'onUpdate') && t.isArrowFunctionExpression(valueNode)) {
      const modelTarget = getModelUpdateTarget(valueNode, source)
      if (modelTarget) {
        pendingModelTargets.modelValue = modelTarget
        return
      }
    }

    if (attrName.startsWith('on') && (t.isArrowFunctionExpression(valueNode) || t.isFunctionExpression(valueNode))) {
      const handler = getEventHandlerExpression(valueNode, source)
      if (handler) {
        props[attrName] = handler
        return
      }

      props[attrName] = {
        type: 'JSFunction',
        value: sanitizeCodeFromNode(valueNode, source)
      }
      return
    }

    props[attrName] = parseHExpressionValue(valueNode, source)
  })

  if (pendingModelTargets.modelValue && props.modelValue?.type === 'JSExpression') {
    props.modelValue = {
      ...props.modelValue,
      model: true
    }
  }

  return props
}

const hSchemaParser = {
  parseChildren(node: any, source: string): any {
    const target = unwrapExpression(node)

    if (t.isStringLiteral(target)) return target.value
    if (t.isTemplateLiteral(target) && target.expressions.length === 0) {
      return target.quasis.map((item: any) => item.value.cooked).join('')
    }
    if (t.isNumericLiteral(target) || t.isBooleanLiteral(target) || t.isNullLiteral(target)) {
      return parseHExpressionValue(target, source)
    }
    if (isHCallExpression(target)) {
      const parsed = this.parseCall(target, source)
      return parsed ? [parsed] : []
    }
    if (t.isArrayExpression(target)) {
      return target.elements
        .flatMap((item: any) => {
          if (!item) return []
          const parsed = this.parseChildren(item, source)
          return Array.isArray(parsed) ? parsed : parsed === null || parsed === undefined ? [] : [parsed]
        })
        .filter(Boolean)
    }
    if (t.isArrowFunctionExpression(target) || t.isFunctionExpression(target)) {
      const returnedNode = getReturnedRenderNode(target)
      if (!returnedNode) return null
      return this.parseChildren(returnedNode, source)
    }

    return {
      type: 'JSExpression',
      value: getSource(target, source)
    }
  },

  parseCall(node: any, source: string): any {
    const target = unwrapExpression(node)
    if (!t.isCallExpression(target) || !t.isIdentifier(target.callee) || target.callee.name !== 'h') return null

    const [componentArg, secondArg, thirdArg] = target.arguments
    if (!componentArg) return null

    let propsArg: any = null
    let childrenArg: any = null

    if (
      secondArg &&
      (t.isObjectExpression(unwrapExpression(secondArg)) ||
        t.isNullLiteral(unwrapExpression(secondArg)) ||
        t.isIdentifier(unwrapExpression(secondArg)))
    ) {
      propsArg = secondArg
      childrenArg = thirdArg
    } else {
      childrenArg = secondArg
    }

    const componentNode = unwrapExpression(componentArg)
    let componentName = 'div'
    if (t.isStringLiteral(componentNode)) {
      componentName = componentNode.value
    } else if (t.isIdentifier(componentNode)) {
      componentName = componentNode.name
    } else if (t.isMemberExpression(componentNode)) {
      componentName = getSource(componentNode, source)
    }

    const schema: any = {
      componentName,
      props:
        propsArg && !t.isNullLiteral(unwrapExpression(propsArg))
          ? parseHPropsObject(unwrapExpression(propsArg), source)
          : {}
    }

    if (childrenArg) {
      const parsedChildren = this.parseChildren(childrenArg, source)
      if (Array.isArray(parsedChildren)) {
        if (parsedChildren.length) schema.children = parsedChildren
      } else if (parsedChildren !== null && parsedChildren !== undefined && parsedChildren !== '') {
        schema.children = parsedChildren
      }
    }

    return schema
  }
}

function parseHCallToSchema(node: any, source: string): any {
  return hSchemaParser.parseCall(node, source)
}

function parseHSlotValue(node: any, source: string) {
  if (!t.isArrowFunctionExpression(node) && !t.isFunctionExpression(node)) return null

  const returnedNode = getReturnedRenderNode(node)
  if (!returnedNode) return null

  const parsedNode = parseHCallToSchema(returnedNode, source)
  if (!parsedNode) return null

  return {
    type: 'JSSlot',
    params: getSlotParamNames(node.params || []),
    value: [parsedNode]
  }
}

function parseJSSlotValue(node: any, result: any, source: string) {
  if (isJSXSlotFunction(node)) {
    const returnedNode = getReturnedJSXNode(node)
    const slotValue = parseJSXReturnToSchema(returnedNode, source)
    if (!slotValue.length) return null

    return {
      type: 'JSSlot',
      params: getSlotParamNames(node.params || []),
      value: slotValue
    }
  }

  return parseHSlotValue(node, source)
}

function ensureRuntimeAliasRegistry(result: any) {
  if (!result.runtimeAliases || typeof result.runtimeAliases !== 'object') {
    result.runtimeAliases = {
      router: [],
      route: [],
      nextTick: []
    }
  }

  return result.runtimeAliases
}

function addRuntimeAlias(result: any, target: 'router' | 'route' | 'nextTick', localName: string) {
  if (!localName) return

  const registry = ensureRuntimeAliasRegistry(result)
  const current = Array.isArray(registry[target]) ? registry[target] : []

  if (!current.includes(localName)) {
    registry[target] = [...current, localName]
  }
}

function getImportedLocalNames(result: any, source: string, imported: string) {
  const names = new Set<string>()

  ;(result?.imports || []).forEach((imp: any) => {
    if (imp?.source !== source) return
    ;(imp.specifiers || []).forEach((spec: any) => {
      if (spec?.imported === imported && spec?.local) {
        names.add(spec.local)
      }
    })
  })

  return names
}

function isImportedCallExpression(init: any, result: any, source: string, imported: string) {
  if (!t.isCallExpression(init) || !t.isIdentifier(init.callee)) return false

  return getImportedLocalNames(result, source, imported).has(init.callee.name)
}

function createScriptRewriteContext(result: any, localNames: string[] = []) {
  const stateEntries = result?.state || {}
  const propNames = new Set((result?.props || []).map((prop: any) => prop?.name).filter(Boolean))
  const stateNames = new Set(Object.keys(stateEntries))
  const refStateNames = new Set(
    Object.entries(stateEntries)
      .filter(([, value]: [string, any]) => value?.type === 'ref')
      .map(([name]) => name)
  )
  const methodNames = new Set(Object.keys(result?.methods || {}))
  const computedNames = new Set(Object.keys(result?.computed || {}))
  const runtimeAliases = result?.runtimeAliases || {}
  const routerNames = new Set(runtimeAliases.router || [])
  const routeNames = new Set(runtimeAliases.route || [])
  const nextTickNames = new Set([
    ...(runtimeAliases.nextTick || []),
    ...getImportedLocalNames(result, 'vue', 'nextTick')
  ])

  return {
    propNames,
    stateNames,
    refStateNames,
    methodNames,
    computedNames,
    routerNames,
    routeNames,
    nextTickNames,
    localNames: new Set(localNames.filter(Boolean))
  }
}

function resolveScriptIdentifierReplacement(name: string, context: any) {
  if (!name || name === 'this' || JS_GLOBALS.has(name)) return null
  if (context.localNames.has(name)) return null

  if (name === 'state') return 'this.state'
  if (name === 'props') return 'this.props'
  if (name === 'emit') return 'this.emit'
  if (name === 'stores') return 'this.stores'
  if (name === 'bridge') return 'this.bridge'
  if (name === 'dataSourceMap') return 'this.dataSourceMap'
  if (name === '$router') return 'this.router'
  if (name === '$route') return 'this.route'
  if (context.routerNames.has(name)) return 'this.router'
  if (context.routeNames.has(name)) return 'this.route'

  if (context.propNames.has(name)) return `this.props.${name}`
  if (context.stateNames.has(name)) return `this.state.${name}`
  if (context.methodNames.has(name)) return `this.${name}`
  if (context.computedNames.has(name)) return `this.state.${name}`

  return null
}

function rewriteScriptContextInCode(code: string, result: any, localNames: string[] = []) {
  if (!code) return code

  const context = createScriptRewriteContext(result, localNames)
  if (
    context.propNames.size === 0 &&
    context.stateNames.size === 0 &&
    context.methodNames.size === 0 &&
    context.computedNames.size === 0
  ) {
    return code
  }

  try {
    const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] as any })
    const replacements: Array<{ start: number; end: number; text: string }> = []
    const seenRanges = new Set<string>()
    const buildNextTickReplacement = (args: any[] = []) => {
      const callback = args[0]

      if (!callback) {
        return 'Promise.resolve()'
      }

      const callbackCode = sanitizeCodeFromNode(callback, code)
      const rewrittenCallback = rewriteScriptContextInCode(callbackCode, result, localNames)

      return `Promise.resolve().then(${rewrittenCallback})`
    }
    const isRewritableIdentifier = (path: any) => {
      if (path.isReferencedIdentifier()) return true

      return path.parentPath?.isAssignmentPattern?.() && path.parent?.right === path.node
    }

    const pushReplacement = (start: number, end: number, text: string) => {
      if (typeof start !== 'number' || typeof end !== 'number' || start >= end) return
      const key = `${start}:${end}:${text}`
      if (seenRanges.has(key)) return
      seenRanges.add(key)
      replacements.push({ start, end, text })
    }

    traverse(ast as any, {
      CallExpression(path: any) {
        const callee = path.node.callee
        const args = path.node.arguments || []

        if (t.isIdentifier(callee) && context.nextTickNames.has(callee.name)) {
          const binding = path.scope.getBinding(callee.name)
          if (!binding || binding.kind === 'module') {
            pushReplacement(path.node.start, path.node.end, buildNextTickReplacement(args))
            path.skip()
            return
          }
        }

        if (
          t.isMemberExpression(callee) &&
          !callee.computed &&
          t.isThisExpression(callee.object) &&
          t.isIdentifier(callee.property) &&
          callee.property.name === '$nextTick'
        ) {
          pushReplacement(path.node.start, path.node.end, buildNextTickReplacement(args))
          path.skip()
        }
      },
      MemberExpression(path: any) {
        if (
          !path.node.computed &&
          t.isThisExpression(path.node.object) &&
          t.isIdentifier(path.node.property) &&
          path.node.property.name === '$router'
        ) {
          pushReplacement(path.node.start, path.node.end, 'this.router')
          return
        }

        if (
          !path.node.computed &&
          t.isThisExpression(path.node.object) &&
          t.isIdentifier(path.node.property) &&
          path.node.property.name === '$route'
        ) {
          pushReplacement(path.node.start, path.node.end, 'this.route')
          return
        }

        if (path.node.computed) return

        const objectNode = path.node.object
        const propertyNode = path.node.property
        if (!t.isIdentifier(objectNode) || !t.isIdentifier(propertyNode)) return

        const refLikeName = objectNode.name
        const isRefLikeState = context.refStateNames.has(refLikeName)
        const isComputedRef = context.computedNames.has(refLikeName)
        if (!isRefLikeState && !isComputedRef) return
        if (propertyNode.name !== 'value') return

        const binding = path.scope.getBinding(refLikeName)
        if (binding && binding.kind !== 'module') return

        const replacement = `this.state.${refLikeName}`
        pushReplacement(path.node.start, path.node.end, replacement)
      },
      Identifier(path: any) {
        if (!isRewritableIdentifier(path)) return

        const { node, parent } = path
        const name = node.name
        const binding = path.scope.getBinding(name)
        if (binding && binding.kind !== 'module') return

        if (
          path.parentPath.isMemberExpression({ property: node }) &&
          parent &&
          parent.property === node &&
          !parent.computed
        ) {
          return
        }

        if (path.parentPath.isObjectProperty({ key: node }) && parent && parent.key === node && !parent.computed) {
          return
        }

        if (
          path.parentPath.isMemberExpression() &&
          path.parent.object === path.node &&
          !path.parent.computed &&
          t.isIdentifier(path.parent.property) &&
          path.parent.property.name === 'value' &&
          (context.refStateNames.has(name) || context.computedNames.has(name))
        ) {
          return
        }

        const replacement = resolveScriptIdentifierReplacement(name, context)
        if (!replacement || replacement === name) return

        if (path.parentPath.isObjectProperty() && parent?.shorthand && parent.value === node) {
          pushReplacement(path.parent.start, path.parent.end, `${name}: ${replacement}`)
          return
        }

        pushReplacement(path.node.start, path.node.end, replacement)
      }
    })

    return applyReplacements(code, replacements)
  } catch {
    return code
  }
}

function rewriteScriptContextInEntries(entries: Record<string, any>, result: any) {
  Object.keys(entries || {}).forEach((key) => {
    const entry = entries[key]
    if (!entry) return
    if (typeof entry === 'string') {
      entries[key] = rewriteScriptContextInCode(entry, result)
      return
    }
    if (typeof entry.value === 'string') {
      entry.value = rewriteScriptContextInCode(entry.value, result)
    }
  })
  return entries
}

function resolveStateRuntimeValue(value: any): any {
  if (Array.isArray(value)) {
    return value.map((item) => resolveStateRuntimeValue(item))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  if (value.type === 'JSExpression' || value.type === 'JSFunction' || value.type === 'JSSlot') {
    return undefined
  }

  if (Object.prototype.hasOwnProperty.call(value, 'type') && Object.prototype.hasOwnProperty.call(value, 'value')) {
    return resolveStateRuntimeValue(value.value)
  }

  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveStateRuntimeValue(item)]))
}

function createStateEvaluationContext(result: any) {
  const context: Record<string, any> = {}

  Object.entries(result?.state || {}).forEach(([key, entry]: [string, any]) => {
    const resolvedValue = resolveStateRuntimeValue(entry)

    if (entry?.type === 'ref') {
      context[key] = { value: resolvedValue }
      return
    }

    context[key] = resolvedValue
  })

  return context
}

function createMethodEvaluationContext(result: any, stateContext: Record<string, any>) {
  const methodEntries = Object.entries(result?.methods || {})
  const context: Record<string, any> = {}
  const pendingMethods = new Map<string, string>()

  methodEntries.forEach(([key, entry]: [string, any]) => {
    const code = typeof entry === 'string' ? entry : entry?.value
    if (typeof code === 'string' && code.trim()) {
      pendingMethods.set(key, code)
    }
  })

  let changed = true
  while (pendingMethods.size > 0 && changed) {
    changed = false

    for (const [key, code] of Array.from(pendingMethods.entries())) {
      const runtimeContext = { ...stateContext, ...context }
      const argNames = Object.keys(runtimeContext)
      const argValues = Object.values(runtimeContext)

      try {
        const evaluator = new Function(...argNames, `"use strict"; return (${code});`)
        const methodValue = evaluator(...argValues)

        if (typeof methodValue === 'function') {
          context[key] = methodValue
          pendingMethods.delete(key)
          changed = true
        }
      } catch {
        // Skip methods whose dependencies are not ready yet; they can be retried in the next pass.
      }
    }
  }

  return context
}

function hasStateInitializerDependency(node: any, source: string, result: any) {
  const code = sanitizeCodeFromNode(node, source)
  const stateNames = new Set(Object.keys(result?.state || {}))
  const methodNames = new Set(Object.keys(result?.methods || {}))

  if (!code || (stateNames.size === 0 && methodNames.size === 0)) return false

  try {
    const ast = parse(`(${code})`, { sourceType: 'module', plugins: ['typescript', 'jsx'] as any })
    let hasDependency = false

    traverse(ast as any, {
      Identifier(path: any) {
        if (hasDependency || !path.isReferencedIdentifier()) return

        const { node, parent } = path
        const name = node?.name
        if (!name || (!stateNames.has(name) && !methodNames.has(name))) return

        const binding = path.scope.getBinding(name)
        if (binding && binding.kind !== 'module') return

        if (
          path.parentPath?.isMemberExpression({ property: node }) &&
          parent &&
          parent.property === node &&
          !parent.computed
        ) {
          return
        }

        if (path.parentPath?.isObjectProperty({ key: node }) && parent && parent.key === node && !parent.computed) {
          return
        }

        hasDependency = true
        path.stop()
      }
    })

    return hasDependency
  } catch {
    return false
  }
}

function tryEvaluateStateExpression(node: any, source: string, result: any) {
  const code = sanitizeCodeFromNode(node, source)
  if (!code) return { ok: false }
  if (!hasStateInitializerDependency(node, source, result)) return { ok: false }

  const stateContext = createStateEvaluationContext(result)
  const methodContext = createMethodEvaluationContext(result, stateContext)
  const context = { ...stateContext, ...methodContext }
  const argNames = Object.keys(context)
  const argValues = Object.values(context)

  try {
    const evaluator = new Function(...argNames, `"use strict"; return (${code});`)
    return {
      ok: true,
      value: evaluator(...argValues)
    }
  } catch {
    return { ok: false }
  }
}

function getStateInitializerFallbackValue(node: any, source: string) {
  const fallbackValue = getNodeValue(node, source)

  if (fallbackValue !== 'undefined') return fallbackValue
  if (!t.isExpression(node) || t.isIdentifier(node)) return fallbackValue

  return createExpressionValue(node, source)
}

function getStateInitializerValue(node: any, source: string, result: any): any {
  const evaluated = tryEvaluateStateExpression(node, source, result)
  if (evaluated.ok) return evaluated.value

  return getStateInitializerFallbackValue(node, source)
}

function rewriteNestedStateValue(value: any, result: any, localNames: string[] = [], rewriteExpressions = true): any {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteNestedStateValue(item, result, localNames, rewriteExpressions))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  if (value.type === 'JSExpression' && typeof value.value === 'string') {
    if (!rewriteExpressions) return value
    return {
      ...value,
      value: rewriteScriptContextInCode(value.value, result, localNames)
    }
  }

  if (value.type === 'JSFunction' && typeof value.value === 'string') {
    if (!rewriteExpressions) return value
    return {
      ...value,
      value: rewriteScriptContextInCode(value.value, result, localNames)
    }
  }

  if (value.type === 'JSSlot') {
    const slotParams = Array.isArray(value.params) ? value.params : []
    return {
      ...value,
      value: rewriteNestedStateValue(value.value || [], result, [...localNames, ...slotParams], true)
    }
  }

  const output: Record<string, any> = Array.isArray(value) ? [] : {}
  Object.keys(value).forEach((key) => {
    output[key] = rewriteNestedStateValue(value[key], result, localNames, rewriteExpressions)
  })
  return output
}

function rewriteScriptContextInResult(result: any) {
  result.state = rewriteNestedStateValue(result.state || {}, result, [], false)
  result.methods = rewriteScriptContextInEntries(result.methods || {}, result)
  result.computed = rewriteScriptContextInEntries(result.computed || {}, result)
  result.lifeCycles = rewriteScriptContextInEntries(result.lifeCycles || {}, result)
}

function addUsedUtilImport(collector: any[], item: any) {
  if (!Array.isArray(collector) || !item?.source || !item?.local) return
  const exists = collector.some(
    (entry) => entry?.source === item.source && entry?.imported === item.imported && entry?.local === item.local
  )
  if (!exists) collector.push(item)
}

function getImportedUtilsMap(imports: any[] = []) {
  const importedUtils = new Map<string, any>()

  imports.forEach((imp: any) => {
    if (!imp?.source || isFrameworkImportSource(imp.source) || /\.vue$/i.test(imp.source)) return
    ;(imp.specifiers || []).forEach((spec: any) => {
      if (!spec?.local) return
      importedUtils.set(spec.local, { ...spec, source: imp.source })
    })
  })

  return importedUtils
}

function rewriteImportedUtilsInCode(code: string, imports: any[] = [], usedImports: any[] = []) {
  const importedUtils = getImportedUtilsMap(imports)

  if (!code || importedUtils.size === 0) return code

  try {
    const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] as any })
    const replacements: Array<{ start: number; end: number; text: string }> = []
    const seenRanges = new Set<string>()

    const pushReplacement = (start: number, end: number, text: string) => {
      if (typeof start !== 'number' || typeof end !== 'number' || start >= end) return
      const key = `${start}:${end}:${text}`
      if (seenRanges.has(key)) return
      seenRanges.add(key)
      replacements.push({ start, end, text })
    }

    traverse(ast as any, {
      MemberExpression(path: any) {
        if (path.node.computed) return
        const objectNode = path.node.object
        const propertyNode = path.node.property
        if (!t.isIdentifier(objectNode) || !t.isIdentifier(propertyNode)) return

        const spec = importedUtils.get(objectNode.name)
        if (!spec || spec.kind !== 'namespace') return

        const binding = path.scope.getBinding(objectNode.name)
        if (binding && binding.kind !== 'module') return

        addUsedUtilImport(usedImports, {
          source: spec.source,
          imported: propertyNode.name,
          local: propertyNode.name,
          kind: 'named'
        })
        pushReplacement(path.node.start, path.node.end, `this.utils.${propertyNode.name}`)
      },
      Identifier(path: any) {
        const name = path.node?.name
        const spec = importedUtils.get(name)
        if (!name || !spec || !path.isReferencedIdentifier()) return

        const binding = path.scope.getBinding(name)
        if (binding && binding.kind !== 'module') return

        if (
          spec.kind === 'namespace' &&
          path.parentPath?.isMemberExpression() &&
          path.parent.object === path.node &&
          !path.parent.computed
        ) {
          return
        }

        addUsedUtilImport(usedImports, {
          source: spec.source,
          imported: spec.imported || 'default',
          local: spec.local,
          kind: spec.kind || 'named'
        })

        if (
          path.parentPath?.isObjectProperty() &&
          path.parent.shorthand &&
          path.parent.value === path.node &&
          path.parent.key === path.node
        ) {
          pushReplacement(path.parent.start, path.parent.end, `${name}: this.utils.${name}`)
          return
        }

        pushReplacement(path.node.start, path.node.end, `this.utils.${name}`)
      }
    })

    return applyReplacements(code, replacements)
  } catch {
    return code
  }
}

function rewriteImportedUtilsInEntries(entries: Record<string, any>, imports: any[] = [], usedImports: any[] = []) {
  Object.keys(entries || {}).forEach((key) => {
    const entry = entries[key]
    if (!entry) return
    if (typeof entry === 'string') {
      entries[key] = rewriteImportedUtilsInCode(entry, imports, usedImports)
      return
    }
    if (typeof entry.value === 'string') {
      entry.value = rewriteImportedUtilsInCode(entry.value, imports, usedImports)
    }
  })
  return entries
}

function rewriteImportedUtilsInResult(result: any) {
  const imports = result?.imports || []
  result.usedUtilsImports = []
  result.methods = rewriteImportedUtilsInEntries(result.methods || {}, imports, result.usedUtilsImports)
  result.computed = rewriteImportedUtilsInEntries(result.computed || {}, imports, result.usedUtilsImports)
  result.lifeCycles = rewriteImportedUtilsInEntries(result.lifeCycles || {}, imports, result.usedUtilsImports)
}

function functionParamToCode(node: any, source: string): string {
  if (t.isAssignmentPattern(node)) {
    return `${functionParamToCode(node.left, source)} = ${sanitizeCodeFromNode(node.right, source)}`
  }

  if (t.isRestElement(node)) {
    return `...${functionParamToCode(node.argument, source)}`
  }

  return sanitizeCodeFromNode(node, source)
}

function arrowToFunctionString(name: string, node: any, source: string) {
  const asyncStr = node.async ? 'async ' : ''
  const params = node.params.map((p) => functionParamToCode(p, source)).join(', ')
  if (t.isBlockStatement(node.body)) {
    const body = sanitizeCodeFromNode(node.body, source)
    return `${asyncStr}function ${name}(${params}) ${body}`
  }
  const expr = sanitizeCodeFromNode(node.body, source)
  return `${asyncStr}function ${name}(${params}) { return ${expr}; }`
}

function functionExpressionToNamedFunctionString(name: string, node: any, source: string) {
  const asyncStr = (node as any).async ? 'async ' : ''
  const params = (node as any).params.map((p: any) => functionParamToCode(p, source)).join(', ')
  const body = sanitizeCodeFromNode((node as any).body, source)
  return `${asyncStr}function ${name}(${params}) ${body}`
}

function functionDeclarationToNamedFunctionString(name: string, node: any, source: string) {
  const asyncStr = node.async ? 'async ' : ''
  const params = node.params.map((p) => functionParamToCode(p, source)).join(', ')
  const body = sanitizeCodeFromNode(node.body, source)
  return `${asyncStr}function ${name}(${params}) ${body}`
}

// ---- setup 专属逻辑的小分支封装（共享生命周期处理主干）----
const isSetupName = (name: string) => name === 'setup'

function setLifecycleEntry(result: any, name: string, code: string, opts: { noOverride?: boolean } = {}) {
  if (opts.noOverride && result.lifeCycles[name]) return
  result.lifeCycles[name] = { type: 'lifecycle', value: code || (name ? `function ${name}(){}` : 'function() {}') }
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
    const code = functionExpressionToNamedFunctionString(name, init, source)
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

function extractObjectValue(node: any, source: string, result: any): any {
  if (t.isIdentifier(node)) {
    const knownState = result?.state?.[node.name]
    if (knownState && typeof knownState === 'object' && 'value' in knownState) {
      return knownState.value
    }
    return getNodeValue(node, source)
  }
  if (t.isObjectExpression(node)) {
    const obj: Record<string, any> = {}
    node.properties.forEach((prop: any) => {
      if (t.isObjectProperty(prop)) {
        const keyName = getObjectKeyName(prop.key)
        if (!keyName) return

        const slotValue = parseJSSlotValue(prop.value, result, source)
        if (slotValue) {
          obj[keyName] = slotValue
          return
        }

        obj[keyName] = extractObjectValue(prop.value, source, result)
      }
    })
    return obj
  }
  if (t.isArrayExpression(node)) {
    return node.elements.map((item: any) => (item ? extractObjectValue(item, source, result) : null))
  }
  return getStateInitializerValue(node, source, result)
}

function assignStateIfNamedState(name: string, init: any, result: any, source: string): boolean {
  if (name !== 'state') return false

  if (isVueReactiveCall(init, 'reactive')) {
    const firstArg = init.arguments && init.arguments[0]
    if (t.isObjectExpression(firstArg)) {
      const stateValue = extractObjectValue(firstArg, source, result)
      Object.entries(stateValue).forEach(([key, value]) => {
        result.state[key] = { type: 'reactive', value }
      })
    } else {
      const value = firstArg ? getStateInitializerValue(firstArg, source, result) : getNodeValue(init, source)
      result.state[name] = { type: 'reactive', value }
    }
    return true
  }

  if (isVueReactiveCall(init, 'ref')) {
    const firstArg = init.arguments && init.arguments[0]
    const value = firstArg ? getStateInitializerValue(firstArg, source, result) : undefined
    result.state[name] = { type: 'ref', value }
    return true
  }

  // normal non-reactive assignment to state
  const initCode = getStateInitializerValue(init, source, result)
  result.state[name] = { type: 'normal', value: initCode }
  return true
}

function assignComputedIfComputed(name: string, init: any, result: any, source: string): boolean {
  if (!isVueReactiveCall(init, 'computed')) return false

  const firstArg = (init.arguments && init.arguments[0]) as any
  let compCode = firstArg ? sanitizeCodeFromNode(firstArg, source) : getNodeValue(init, source)

  if (firstArg) {
    if (t.isArrowFunctionExpression(firstArg)) {
      compCode = arrowToFunctionString(name, firstArg, source)
    } else if (t.isFunctionExpression(firstArg)) {
      compCode = functionExpressionToNamedFunctionString(name, firstArg, source)
    } else if (t.isObjectExpression(firstArg)) {
      // Handle computed({ get: () => {}, set: (val) => {} })
      const getterProp = firstArg.properties.find(
        (prop: any) => t.isObjectProperty(prop) && t.isIdentifier(prop.key) && prop.key.name === 'get'
      ) as any
      if (
        getterProp &&
        getterProp.value &&
        (t.isArrowFunctionExpression(getterProp.value) || t.isFunctionExpression(getterProp.value))
      ) {
        compCode = t.isArrowFunctionExpression(getterProp.value)
          ? arrowToFunctionString(name, getterProp.value, source)
          : functionExpressionToNamedFunctionString(name, getterProp.value, source)
      } else {
        compCode = sanitizeCodeFromNode(firstArg, source)
      }
    }
  }

  result.computed[name] = { type: 'computed', value: compCode }
  return true
}

function handleVariableDeclarator(name: string, init: any, result: any, source: string) {
  // 1) function-like assignments become methods
  if (addMethodFromFunctionLike(name, init, result, source)) return

  // 1.5) runtime composables should map to lowcode runtime instead of normal state
  if (isImportedCallExpression(init, result, 'vue-router', 'useRouter')) {
    addRuntimeAlias(result, 'router', name)
    return
  }

  if (isImportedCallExpression(init, result, 'vue-router', 'useRoute')) {
    addRuntimeAlias(result, 'route', name)
    return
  }

  // 2) Check for reactive/ref calls regardless of variable name
  if (isVueReactiveCall(init, 'reactive')) {
    const firstArg = init.arguments && init.arguments[0]
    if (t.isObjectExpression(firstArg)) {
      const stateValue = extractObjectValue(firstArg, source, result)
      // For 'state' named variable, expand properties into result.state
      // For other variables, store as a single state item with the variable name as key
      if (name === 'state') {
        Object.entries(stateValue).forEach(([key, value]) => {
          result.state[key] = { type: 'reactive', value }
        })
      } else {
        // Store the entire object under the variable name
        result.state[name] = { type: 'reactive', value: stateValue }
      }
    } else {
      const stateValue = firstArg ? getStateInitializerValue(firstArg, source, result) : getNodeValue(init, source)
      result.state[name] = { type: 'reactive', value: stateValue }
    }
    return
  }

  if (isVueReactiveCall(init, 'ref')) {
    const firstArg = init.arguments && init.arguments[0]
    const value = firstArg ? getStateInitializerValue(firstArg, source, result) : undefined
    result.state[name] = { type: 'ref', value }
    return
  }

  // 3) state-only extraction (for backward compatibility with 'state' variable)
  if (assignStateIfNamedState(name, init, result, source)) return

  // 4) computed regardless of name
  if (assignComputedIfComputed(name, init, result, source)) return

  // 5) handle non-reactive data (plain variables with initial values)
  if (init) {
    const value =
      t.isObjectExpression(init) || t.isArrayExpression(init) || isJSXSlotFunction(init)
        ? extractObjectValue(init, source, result)
        : getStateInitializerValue(init, source, result)
    result.state[name] = { type: 'normal', value }
    return
  }
}

function parseSetupFunctionBody(body: any, result: any, source: string) {
  if (!t.isBlockStatement(body)) return
  const declaredFunctions = new Set<string>()
  const functionBodies: Record<string, string> = {}

  body.body.forEach((statement: any) => {
    if (t.isFunctionDeclaration(statement) && statement.id) {
      const name = statement.id.name
      const fnCode = functionDeclarationToNamedFunctionString(name, statement, source)
      declaredFunctions.add(name)
      functionBodies[name] = fnCode
      routeFunctionLikeByName(result, name, fnCode)
    }
  })

  body.body.forEach((statement: any) => {
    if (t.isVariableDeclaration(statement)) {
      statement.declarations.forEach((declaration: any) => {
        if (t.isIdentifier(declaration.id) && declaration.init) {
          const name = declaration.id.name
          handleVariableDeclarator(name, declaration.init, result, source)
        }
      })
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

function getTSTypeName(node: any): string {
  if (!node) return 'any'
  if (t.isTSStringKeyword(node)) return 'string'
  if (t.isTSNumberKeyword(node)) return 'number'
  if (t.isTSBooleanKeyword(node)) return 'boolean'
  if (t.isTSAnyKeyword(node)) return 'any'
  if (t.isTSUnknownKeyword(node)) return 'unknown'
  if (t.isTSArrayType(node)) return 'array'
  if (t.isTSTypeLiteral(node)) return 'object'
  if (t.isTSUnionType(node)) return node.types.map((item: any) => getTSTypeName(item)).join(' | ')
  if (t.isTSTupleType(node)) return 'array'
  if (t.isTSLiteralType(node)) {
    const literal = node.literal
    if (t.isStringLiteral(literal)) return 'string'
    if (t.isNumericLiteral(literal)) return 'number'
    if (t.isBooleanLiteral(literal)) return 'boolean'
  }
  if (t.isTSTypeReference(node)) {
    if (t.isIdentifier(node.typeName)) return node.typeName.name
    if (t.isTSQualifiedName(node.typeName)) return node.typeName.right.name
  }
  return 'any'
}

function resolveTSTypeNode(node: any, typeDecls: Map<string, any>) {
  if (!node) return null
  if (t.isTSTypeReference(node) && t.isIdentifier(node.typeName)) {
    return typeDecls.get(node.typeName.name) || node
  }
  return node
}

function parsePropsFromTypeNode(node: any, typeDecls: Map<string, any> = new Map()) {
  const resolvedNode = resolveTSTypeNode(node, typeDecls)
  if (!resolvedNode || !t.isTSTypeLiteral(resolvedNode)) return []

  return resolvedNode.members
    .map((member: any) => {
      if (!t.isTSPropertySignature(member) || !member.key) return null
      const name = getObjectKeyName(member.key)
      if (!name) return null

      return {
        name,
        type: getTSTypeName(member.typeAnnotation?.typeAnnotation),
        required: !member.optional
      }
    })
    .filter(Boolean)
}

function parseEmitsFromTypeNode(node: any, typeDecls: Map<string, any> = new Map()) {
  const resolvedNode = resolveTSTypeNode(node, typeDecls)
  if (!resolvedNode) return []

  if (t.isTSTypeLiteral(resolvedNode)) {
    return resolvedNode.members
      .map((member: any) => {
        if (t.isTSPropertySignature(member) && member.key) {
          return getObjectKeyName(member.key)
        }

        if (t.isTSCallSignatureDeclaration(member)) {
          const firstParam = member.parameters?.[0]
          const paramTypeAnnotation =
            t.isIdentifier(firstParam) && t.isTSTypeAnnotation(firstParam.typeAnnotation)
              ? firstParam.typeAnnotation.typeAnnotation
              : null

          if (
            t.isIdentifier(firstParam) &&
            paramTypeAnnotation &&
            t.isTSLiteralType(paramTypeAnnotation) &&
            t.isStringLiteral(paramTypeAnnotation.literal)
          ) {
            return paramTypeAnnotation.literal.value
          }
        }

        return null
      })
      .filter(Boolean)
  }

  return []
}

function parsePropsSimple(node: any, source = '') {
  if (t.isArrayExpression(node)) {
    return node.elements.map((e: any) => (t.isStringLiteral(e) ? { name: e.value, type: 'any' } : null)).filter(Boolean)
  }
  // 处理对象形式的 props: { title: { type: String, default: '标题一' }, count: Number }
  if (t.isObjectExpression(node)) {
    return node.properties
      .map((prop: any) => {
        if (!t.isObjectProperty(prop) || !t.isIdentifier(prop.key)) return null
        const name = prop.key.name
        // 简写形式: title: String
        if (t.isIdentifier(prop.value)) {
          return { name, type: prop.value.name?.toLowerCase() || 'any' }
        }
        // 对象形式: title: { type: String, default: '标题一' }
        if (t.isObjectExpression(prop.value)) {
          const propDef: any = { name, type: 'any' }
          prop.value.properties.forEach((p: any) => {
            if (!t.isObjectProperty(p) || !t.isIdentifier(p.key)) return
            const key = p.key.name
            if (key === 'type') {
              if (t.isIdentifier(p.value)) propDef.type = p.value.name.toLowerCase()
            } else if (key === 'default') {
              propDef.default = getNodeValue(p.value, source)
            } else if (key === 'required') {
              propDef.required = getNodeValue(p.value, source)
            }
          })
          return propDef
        }
        return { name, type: 'any' }
      })
      .filter(Boolean)
  }
  return []
}

function applyWithDefaultsToProps(props: any[], defaultsNode: any, source = '') {
  if (!Array.isArray(props) || !t.isObjectExpression(defaultsNode)) return props

  const defaultsMap = new Map<string, any>()
  defaultsNode.properties.forEach((prop: any) => {
    if (!t.isObjectProperty(prop)) return
    const keyName = getObjectKeyName(prop.key)
    if (!keyName) return

    defaultsMap.set(keyName, getNodeValue(prop.value, source))
  })

  if (!defaultsMap.size) return props

  return props.map((prop: any) => {
    if (!prop?.name || !defaultsMap.has(prop.name)) return prop

    return {
      ...prop,
      default: defaultsMap.get(prop.name),
      required: false
    }
  })
}

function extractDefinePropsCall(node: any) {
  if (!t.isCallExpression(node)) return null

  if (t.isIdentifier(node.callee) && node.callee.name === 'defineProps') {
    return {
      definePropsCall: node,
      defaultsNode: null
    }
  }

  if (t.isIdentifier(node.callee) && node.callee.name === 'withDefaults') {
    const definePropsCall = node.arguments?.[0]
    const defaultsNode = node.arguments?.[1]

    if (
      t.isCallExpression(definePropsCall) &&
      t.isIdentifier(definePropsCall.callee) &&
      definePropsCall.callee.name === 'defineProps'
    ) {
      return {
        definePropsCall,
        defaultsNode: defaultsNode || null
      }
    }
  }

  return null
}

function parseSetupDefineProps(node: any, source: string, typeDecls: Map<string, any> = new Map()) {
  const extracted = extractDefinePropsCall(node)
  if (!extracted) return null

  const { definePropsCall, defaultsNode } = extracted
  const typeParameters = definePropsCall.typeParameters || definePropsCall.typeArguments
  let props = []

  const arg = definePropsCall.arguments?.[0]
  if (arg) {
    props = parsePropsSimple(arg, source)
  } else if (typeParameters?.params?.[0]) {
    props = parsePropsFromTypeNode(typeParameters.params[0], typeDecls)
  }

  return applyWithDefaultsToProps(props, defaultsNode, source)
}

function parseMethodsSimple(node: any, source: string) {
  if (!t.isObjectExpression(node)) return {}
  const methods: Record<string, any> = {}
  node.properties.forEach((prop: any) => {
    if (t.isObjectMethod(prop) && t.isIdentifier(prop.key)) {
      const name = prop.key.name
      const code = functionExpressionToNamedFunctionString(name, prop as any, source)
      methods[name] = { type: 'function', value: code || `function ${name}(){}` }
    } else if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
      const name = prop.key.name
      if (t.isFunctionExpression(prop.value)) {
        const code = functionExpressionToNamedFunctionString(name, prop.value, source)
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
        const code = functionExpressionToNamedFunctionString(name, prop.value, source)
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

function getReturnedObjectExpressionFromFunction(node: any) {
  if (!node) return null

  if (t.isArrowFunctionExpression(node) && !t.isBlockStatement(node.body)) {
    const body = unwrapExpression(node.body)
    return t.isObjectExpression(body) ? body : null
  }

  const body = (node as any).body
  if (!t.isBlockStatement(body)) return null

  let returnArgument = null
  for (const statement of body.body) {
    if (t.isReturnStatement(statement) && statement.argument) {
      returnArgument = statement.argument
      break
    }
  }

  if (!returnArgument) return null

  const returned = unwrapExpression(returnArgument)
  return t.isObjectExpression(returned) ? returned : null
}

function parseOptionsData(node: any, result: any, source: string) {
  const returnedObject = getReturnedObjectExpressionFromFunction(node)

  if (returnedObject) {
    const stateValue = extractObjectValue(returnedObject, source, result)
    Object.entries(stateValue || {}).forEach(([key, value]) => {
      result.state[key] = { type: 'reactive', value }
    })
    return
  }

  result.state = { data: 'function() { return {} }' }
}

function parseOptionsObject(objectExpression: any, result: any, source: string) {
  objectExpression.properties.forEach((prop: any) => {
    if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
      const key = prop.key.name
      switch (key) {
        case 'props':
          result.props = parsePropsSimple(prop.value, source)
          break
        case 'data':
          parseOptionsData(prop.value, result, source)
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
      if (key === 'data') {
        parseOptionsData(prop, result, source)
      } else if (key === 'setup') {
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
        specifiers: path.node.specifiers.map((spec: any) => {
          if (t.isImportSpecifier(spec)) {
            return {
              local: spec.local.name,
              imported: t.isIdentifier(spec.imported) ? spec.imported.name : spec.imported.value,
              kind: 'named'
            }
          }

          if (t.isImportNamespaceSpecifier(spec)) {
            return {
              local: spec.local.name,
              imported: '*',
              kind: 'namespace'
            }
          }

          return {
            local: spec.local.name,
            imported: 'default',
            kind: 'default'
          }
        })
      })
    }
  })
}

function parseSetupScript(ast: any, result: any, source: string) {
  const programBody = ast?.program?.body || []
  const typeDecls = new Map<string, any>()

  programBody.forEach((statement: any) => {
    if (t.isTSTypeAliasDeclaration(statement)) {
      typeDecls.set(statement.id.name, statement.typeAnnotation)
      return
    }

    if (t.isTSInterfaceDeclaration(statement)) {
      typeDecls.set(statement.id.name, t.tsTypeLiteral(statement.body.body))
    }
  })

  programBody.forEach((statement: any) => {
    if (!t.isFunctionDeclaration(statement) || !statement.id) return

    const name = statement.id.name
    const code = functionDeclarationToNamedFunctionString(name, statement, source)
    routeFunctionLikeByName(result, name, code)
  })

  programBody.forEach((statement: any) => {
    if (t.isVariableDeclaration(statement)) {
      statement.declarations.forEach((declaration: any) => {
        if (!t.isIdentifier(declaration.id) || !declaration.init) return

        const name = declaration.id.name
        const typeParameters = declaration.init.typeParameters || declaration.init.typeArguments
        const parsedProps = parseSetupDefineProps(declaration.init, source, typeDecls)
        if (parsedProps) {
          result.props = parsedProps
          return
        }
        // 处理 const props = defineProps({...}) 或 const props = defineProps([...])
        if (
          t.isCallExpression(declaration.init) &&
          t.isIdentifier(declaration.init.callee) &&
          declaration.init.callee.name === 'defineProps'
        ) {
          const arg = declaration.init.arguments[0]
          if (arg) {
            result.props = parsePropsSimple(arg, source)
          } else if (typeParameters?.params?.[0]) {
            result.props = parsePropsFromTypeNode(typeParameters.params[0], typeDecls)
          }
          return
        }

        if (
          t.isCallExpression(declaration.init) &&
          t.isIdentifier(declaration.init.callee) &&
          declaration.init.callee.name === 'defineEmits'
        ) {
          const arg = declaration.init.arguments[0]
          if (t.isArrayExpression(arg)) {
            result.emits = arg.elements
              .map((item: any) => (t.isStringLiteral(item) ? item.value : null))
              .filter(Boolean)
          } else if (typeParameters?.params?.[0]) {
            result.emits = parseEmitsFromTypeNode(typeParameters.params[0], typeDecls)
          }
          return
        }

        handleVariableDeclarator(name, declaration.init, result, source)
      })
      return
    }

    if (t.isExpressionStatement(statement) && t.isCallExpression(statement.expression)) {
      const expr = statement.expression
      const parsedProps = parseSetupDefineProps(expr, source, typeDecls)
      if (parsedProps) {
        result.props = parsedProps
        return
      }

      // 处理无赋值的 defineProps({...}) 调用
      if (t.isIdentifier(expr.callee) && expr.callee.name === 'defineProps') {
        const arg = expr.arguments[0]
        if (arg) {
          result.props = parsePropsSimple(arg, source)
        } else {
          const typeParameters = expr.typeParameters || expr.typeArguments
          if (typeParameters?.params?.[0]) {
            result.props = parsePropsFromTypeNode(typeParameters.params[0], typeDecls)
          }
        }
        return
      }

      if (t.isIdentifier(expr.callee) && expr.callee.name === 'defineEmits') {
        const arg = expr.arguments[0]
        if (t.isArrayExpression(arg)) {
          result.emits = arg.elements.map((item: any) => (t.isStringLiteral(item) ? item.value : null)).filter(Boolean)
        } else {
          const typeParameters = expr.typeParameters || expr.typeArguments
          if (typeParameters?.params?.[0]) {
            result.emits = parseEmitsFromTypeNode(typeParameters.params[0], typeDecls)
          }
        }
        return
      }

      const callee = expr.callee
      let hookName: string | null = null
      if (t.isIdentifier(callee)) hookName = callee.name
      else if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) hookName = callee.property.name

      if (hookName && isLifecycleHook(hookName)) {
        // 避免 obj.setup() 这类成员调用被误判为生命周期
        if (hookName === 'setup' && !t.isIdentifier(callee)) return
        const cb = expr.arguments && (expr.arguments[0] as any)
        let cbCode = 'function() { /* lifecycle hook */ }'
        if (cb) {
          if (t.isArrowFunctionExpression(cb)) cbCode = arrowToFunctionString(hookName, cb, source)
          else if (t.isFunctionExpression(cb)) cbCode = functionExpressionToNamedFunctionString(hookName, cb, source)
        }
        // 若已捕获 setup 的函数体，则不要被调用形式覆盖
        if (hookName === 'setup') setLifecycleEntry(result, hookName, cbCode, { noOverride: true })
        else setLifecycleEntry(result, hookName, cbCode)
      }
      return
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
      usedUtilsImports: [] as any[],
      runtimeAliases: {
        router: [] as string[],
        route: [] as string[],
        nextTick: [] as string[]
      },
      props: [] as any[],
      emits: [] as any[],
      state: {} as any,
      methods: {} as any,
      computed: {} as any,
      lifeCycles: {} as any
    }
    parseImports(ast, result)
    if (options.isSetup) parseSetupScript(ast, result, script)
    else parseOptionsAPI(ast, result, script)
    rewriteScriptContextInResult(result)
    rewriteImportedUtilsInResult(result)
    return result
  } catch (error: any) {
    return {
      imports: [],
      usedUtilsImports: [],
      props: [],
      emits: [],
      state: {},
      methods: {},
      computed: {},
      lifeCycles: {},
      error: error.message
    }
  }
}
