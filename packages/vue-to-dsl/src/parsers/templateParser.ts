import { parse } from '@vue/compiler-dom'
import { parse as babelParse } from '@babel/parser'
import traverseModule from '@babel/traverse'

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
  'Infinity'
])

function getTemplateContext(options: any = {}, loopVariables: string[] = []) {
  const propNames = new Set((options.props || []).map((prop: any) => prop?.name).filter(Boolean))
  const stateNames = new Set(Object.keys(options.state || {}))
  const methodNames = new Set(Object.keys(options.methods || {}))
  const computedNames = new Set(Object.keys(options.computed || {}))
  const localNames = new Set((loopVariables || []).filter(Boolean))

  return { propNames, stateNames, methodNames, computedNames, localNames }
}

function resolveIdentifierReplacement(name: string, context: any) {
  if (!name || name === 'this') return null
  if (JS_GLOBALS.has(name)) return null
  if (context.localNames.has(name)) return null

  if (name === 'state') return 'this.state'
  if (name === 'props') return 'this.props'
  if (context.propNames.has(name)) return `this.props.${name}`
  if (context.stateNames.has(name)) return `this.state.${name}`
  if (context.methodNames.has(name) || context.computedNames.has(name)) return `this.${name}`

  return `this.state.${name}`
}

function ensureThisPrefix(exp: string, options: any = {}, loopVariables: string[] = []) {
  const v = String(exp || '').trim()
  if (!v) return v
  if (v.startsWith('this.')) return v

  const context = getTemplateContext(options, loopVariables)

  try {
    const ast: any = babelParse(`(${v})`, { sourceType: 'module', plugins: ['typescript', 'jsx'] })
    const replacements: Array<{ start: number; end: number; text: string }> = []
    const replacedRanges = new Set<string>()

    traverse(ast, {
      Identifier(path: any) {
        if (!path.isReferencedIdentifier()) return

        const { node, parent } = path
        const name = node.name

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

        if (path.scope.hasBinding(name)) return

        const replacement = resolveIdentifierReplacement(name, context)
        if (!replacement || replacement === name) return

        if (path.parentPath.isObjectProperty() && parent?.shorthand && parent.value === node) {
          const start = parent.start - 1
          const end = parent.end - 1
          const rangeKey = `${start}:${end}`
          if (replacedRanges.has(rangeKey)) return
          replacedRanges.add(rangeKey)
          replacements.push({ start, end, text: `${name}: ${replacement}` })
          return
        }

        const start = node.start - 1
        const end = node.end - 1
        const rangeKey = `${start}:${end}`
        if (replacedRanges.has(rangeKey)) return
        replacedRanges.add(rangeKey)
        replacements.push({ start, end, text: replacement })
      }
    })

    if (replacements.length === 0) return v

    return replacements
      .sort((a, b) => b.start - a.start)
      .reduce((code, item) => `${code.slice(0, item.start)}${item.text}${code.slice(item.end)}`, v)
  } catch (_error) {
    const loopVarPattern = loopVariables.length > 0 ? new RegExp(`^(?:${loopVariables.join('|')})(?:\\.|\\[|$)`) : null
    if (loopVarPattern && loopVarPattern.test(v)) return v
    if (/^[A-Za-z_$]/.test(v) && !/^(function|async|new)\b/.test(v)) {
      if (v.startsWith('state.')) return `this.${v}`
      return `this.state.${v}`
    }
    return v
  }
}

function splitVForExpression(exp: string): { left: string; right: string } | null {
  const source = String(exp || '').trim()
  if (!source) return null

  let quote: string | null = null
  let depth = 0

  for (let index = 0; index < source.length; index++) {
    const char = source[index]

    if (quote) {
      if (char === '\\') {
        index += 1
        continue
      }
      if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === "'" || char === '"' || char === '`') {
      quote = char
      continue
    }

    if (char === '(' || char === '[' || char === '{') {
      depth += 1
      continue
    }

    if (char === ')' || char === ']' || char === '}') {
      depth = Math.max(0, depth - 1)
      continue
    }

    if (depth !== 0) continue

    if (source.startsWith(' in ', index)) {
      return {
        left: source.slice(0, index).trim(),
        right: source.slice(index + 4).trim()
      }
    }

    if (source.startsWith(' of ', index)) {
      return {
        left: source.slice(0, index).trim(),
        right: source.slice(index + 4).trim()
      }
    }
  }

  return null
}

function extractLoopArgs(left: string): string[] {
  const target = String(left || '').trim()
  if (!target || target === '()') return []

  try {
    const functionSource = target.startsWith('(') ? `${target} => {}` : `(${target}) => {}`
    const ast: any = babelParse(functionSource, { sourceType: 'module', plugins: ['typescript', 'jsx'] })
    const expression = ast.program?.body?.[0]?.expression
    const params = expression?.params || []

    return params
      .map((param: any) => {
        if (param?.type === 'Identifier') return param.name
        if (param?.type === 'AssignmentPattern' && param.left?.type === 'Identifier') return param.left.name
        if (param?.type === 'RestElement' && param.argument?.type === 'Identifier') return param.argument.name
        return null
      })
      .filter(Boolean)
  } catch (_error) {
    const simpleMatch = target.match(/^\(?\s*([A-Za-z_$][A-Za-z0-9_$]*)/)
    return simpleMatch ? [simpleMatch[1]] : []
  }
}

function toPascalCase(input: string) {
  return input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
}

function getComponentName(tag: string, options: any) {
  if (options.componentMap && options.componentMap[tag]) return options.componentMap[tag]
  const lower = tag.toLowerCase()
  // Normalize all tiny-* components to PascalCase TinyXxxYyy
  if (lower.startsWith('tiny-')) {
    const rest = lower.replace(/^tiny-/, '')
    return `Tiny${toPascalCase(rest)}`
  }
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
  if (htmlTags.includes(lower)) return lower
  // Default: convert arbitrary custom elements to PascalCase by hyphen/underscore splitting
  return toPascalCase(tag)
}

function isComponentImported(tag: string, options: any) {
  // Check if this tag corresponds to an imported component
  if (!options.imports || !Array.isArray(options.imports)) return false

  const lower = tag.toLowerCase()

  // HTML tags are not imported components
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
    'main',
    'slot'
  ]
  if (htmlTags.includes(lower)) return false

  // tiny-* components are built-in, not imported
  if (lower.startsWith('tiny-')) return false

  // Check if the tag matches any imported component
  // The tag could be in kebab-case or PascalCase
  const pascalTag = toPascalCase(tag)

  for (const imp of options.imports) {
    // imp is an object with { source, specifiers }
    // specifiers is an array of { local, imported }
    if (!imp.specifiers || !Array.isArray(imp.specifiers)) continue

    for (const spec of imp.specifiers) {
      // Check if the imported name matches the tag
      if (spec.local === pascalTag || spec.local === tag) {
        return true
      }
      // Also check if the imported name in kebab-case matches
      const kebabImported = spec.local
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')
      if (kebabImported === lower) {
        return true
      }
    }
  }

  return false
}

function parseNodeProps(props: any[], _options: any) {
  const result: Record<string, any> = {}
  props.forEach((prop: any) => {
    if (prop.type === 6) {
      const name = prop.name === 'class' ? 'className' : prop.name
      result[name] = prop.value ? prop.value.content : true
    }
  })
  return result
}

function astToValue(node: any): any {
  const unsupported = { __UNSUPPORTED__: true }
  if (!node) return unsupported
  switch (node.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
      return node.value
    case 'NullLiteral':
      return null
    case 'TemplateLiteral':
      return (node.expressions?.length ?? 0) === 0 ? node.quasis.map((q: any) => q.value.cooked).join('') : unsupported
    case 'ArrayExpression': {
      const out: any[] = []
      for (const el of node.elements) {
        if (!el) return unsupported
        const v = astToValue(el)
        if ((v as any)?.__UNSUPPORTED__) return unsupported
        out.push(v)
      }
      return out
    }
    case 'ObjectExpression': {
      const obj: Record<string, any> = {}
      for (const p of node.properties) {
        if (p.type !== 'ObjectProperty' || p.computed) return unsupported
        const k =
          p.key.type === 'Identifier'
            ? p.key.name
            : p.key.type === 'StringLiteral'
            ? p.key.value
            : p.key.type === 'NumericLiteral'
            ? String(p.key.value)
            : null
        if (k === null) return unsupported
        const v = astToValue(p.value)
        if ((v as any)?.__UNSUPPORTED__) return unsupported
        obj[k] = v
      }
      return obj
    }
    default:
      return unsupported
  }
}

// Convert simple JS literal expressions to native values; otherwise fallback later to JSExpression
function parseLiteralExpression(exp: string): { ok: true; value: any } | { ok: false } {
  const trimmed = (exp || '').trim()
  if (trimmed === 'true') return { ok: true, value: true }
  if (trimmed === 'false') return { ok: true, value: false }
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return { ok: true, value: Number(trimmed) }
  const looksLikeLiteral =
    (trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))
  if (!looksLikeLiteral) return { ok: false }
  try {
    const ast: any = babelParse(`(${trimmed})`, { sourceType: 'module', plugins: ['typescript', 'jsx'] })
    const expr = ast.program?.body?.[0]?.expression
    const value = astToValue(expr)
    if (value && (value as any).__UNSUPPORTED__) return { ok: false }
    return { ok: true, value }
  } catch (_e) {
    return { ok: false }
  }
}

function createConditionExpression(value: string) {
  return {
    type: 'JSExpression',
    value
  }
}

function negateCondition(value: string) {
  return `!(${value})`
}

function combineConditions(expressions: string[] = []) {
  if (!expressions.length) return ''
  if (expressions.length === 1) return expressions[0]
  return expressions.map((item) => `(${item})`).join(' && ')
}

function applyConditionalBranches(nodes: any[]) {
  const branchConditions: string[] = []

  const clearBranchMeta = (node: any) => {
    if (!node || typeof node !== 'object') return node
    delete node.__branchType
    delete node.__branchExpression
    return node
  }

  return nodes.map((node: any) => {
    if (!node || typeof node !== 'object') return node

    const branchType = node.__branchType
    const branchExpression = node.__branchExpression

    if (branchType === 'if' && branchExpression) {
      branchConditions.length = 0
      branchConditions.push(branchExpression)
      node.condition = createConditionExpression(branchExpression)
      return clearBranchMeta(node)
    }

    if (branchType === 'else-if' && branchExpression && branchConditions.length) {
      const previousConditions = branchConditions.map(negateCondition)
      const currentCondition = combineConditions([...previousConditions, branchExpression])
      branchConditions.push(branchExpression)
      node.condition = createConditionExpression(currentCondition)
      return clearBranchMeta(node)
    }

    if (branchType === 'else' && branchConditions.length) {
      const previousConditions = branchConditions.map(negateCondition)
      node.condition = createConditionExpression(combineConditions(previousConditions))
      branchConditions.length = 0
      return clearBranchMeta(node)
    }

    branchConditions.length = 0
    return clearBranchMeta(node)
  })
}

function parseDirectives(node: any, schema: any, _options: any, parentLoopVariables: string[] = []) {
  if (!node.props) return

  // First pass: extract loopArgs if this node has v-for
  let currentLoopVariables: string[] = []
  let loopSource = ''
  for (const prop of node.props) {
    if (prop.type === 7 && prop.name === 'for' && prop.exp) {
      const exp = prop.exp.content || ''
      const parsedFor = splitVForExpression(exp)
      const parsedLoopArgs = extractLoopArgs(parsedFor?.left || '')
      currentLoopVariables = parsedLoopArgs
      loopSource = parsedFor?.right || exp

      if (parsedLoopArgs.length) {
        schema.loopArgs = parsedLoopArgs
      }
      break
    }
  }
  const activeLoopVariables = Array.from(new Set([...(parentLoopVariables || []), ...currentLoopVariables]))

  // Second pass: process all directives with knowledge of loop variable
  node.props.forEach((prop: any) => {
    if (prop.type !== 7) return
    const directiveName = prop.name
    switch (directiveName) {
      case 'if':
        schema.__branchType = 'if'
        schema.__branchExpression = ensureThisPrefix(
          prop.exp ? prop.exp.content : 'true',
          _options,
          activeLoopVariables
        )
        break
      case 'else-if':
        schema.__branchType = 'else-if'
        schema.__branchExpression = ensureThisPrefix(
          prop.exp ? prop.exp.content : 'true',
          _options,
          activeLoopVariables
        )
        break
      case 'else':
        schema.__branchType = 'else'
        break
      case 'for':
        if (prop.exp) {
          const src = String(loopSource || prop.exp.content || '').trim()
          schema.loop = { type: 'JSExpression', value: ensureThisPrefix(src, _options) }
        }
        break
      case 'show':
        schema.props['v-show'] = {
          type: 'JSExpression',
          value: ensureThisPrefix(prop.exp ? prop.exp.content : 'true', _options, activeLoopVariables)
        }
        break
      case 'model':
        schema.props['modelValue'] = {
          type: 'JSExpression',
          value: ensureThisPrefix(String(prop.exp.content), _options, activeLoopVariables),
          model: true
        }
        break
      case 'on': {
        const rawEvent = prop.arg ? prop.arg.content : 'click'
        const eventName = `on${toPascalCase(rawEvent)}`
        const val = prop.exp ? String(prop.exp.content || '') : ''
        schema.props[eventName] = { type: 'JSExpression', value: ensureThisPrefix(val, _options, activeLoopVariables) }
        break
      }
      case 'bind': {
        let attrName = prop.arg ? prop.arg.content : 'value'
        if (attrName === 'class') attrName = 'className'
        if (prop.exp && prop.exp.content !== null) {
          const raw = String(prop.exp.content)
          const parsed = parseLiteralExpression(raw)
          if (parsed.ok) {
            schema.props[`${attrName}`] = parsed.value
          } else {
            schema.props[`${attrName}`] = {
              type: 'JSExpression',
              value: ensureThisPrefix(raw, _options, activeLoopVariables)
            }
          }
        } else {
          schema.props[`${attrName}`] = ''
        }
        break
      }
      case 'slot': {
        const slotName = prop.arg ? prop.arg.content : 'default'
        schema.slot = slotName
        break
      }
      default:
        schema.props[`v-${directiveName}`] = prop.exp ? prop.exp.content : 'true'
    }
  })
}

// Normalize tiny-icon-* to generic Icon component with name prop
// e.g. <tiny-icon-panel-mini /> -> { componentName: 'Icon', props: { name: 'IconPanelMini', style: '...' } }
function normalizeTinyIcon(schema: any, node: any) {
  const lowerTag = typeof node.tag === 'string' ? node.tag.toLowerCase() : ''
  if (!lowerTag.startsWith('tiny-icon-')) return
  const toPascal = (s: string) =>
    s
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('')
  const rawName = lowerTag.replace(/^tiny-icon-/, '')
  const iconName = `Icon${toPascal(rawName)}`
  const styleVal = schema.props && typeof schema.props.style === 'string' ? schema.props.style : undefined
  // Rebuild props: keep style if present; set name; drop other raw attributes like fill
  schema.componentName = 'Icon'
  schema.props = {}
  if (styleVal) schema.props.style = styleVal
  schema.props.name = iconName
}

const templateAstParser = {
  parseTextNode(node: any, _options: any) {
    if (!node.content || !node.content.trim()) return null
    return { componentName: 'Text', props: { text: node.content.trim() } }
  },

  parseInterpolationNode(node: any, _options: any, loopVariables: string[] = []) {
    return {
      componentName: 'Text',
      props: {
        text: {
          type: 'JSExpression',
          value: ensureThisPrefix(node.content ? node.content.content : '', _options, loopVariables)
        }
      }
    }
  },

  parseTemplateNode(node: any, options: any, parentLoopVariables: string[] = []) {
    if (node.type !== 1) return null
    const componentName = getComponentName(node.tag, options)
    const schema: any = { componentName, props: {}, children: [] }

    // Check if this is an imported component (sub-component)
    // If the component name is PascalCase and not an HTML tag, it's likely a component
    const isImportedComponent = isComponentImported(node.tag, options)
    if (isImportedComponent) {
      schema.componentType = 'Block'
    }

    if (node.props && node.props.length > 0) schema.props = parseNodeProps(node.props, options)
    parseDirectives(node, schema, options, parentLoopVariables)
    // Apply icon normalization
    normalizeTinyIcon(schema, node)

    const currentLoopVariables = Array.from(
      new Set([...(parentLoopVariables || []), ...((schema.loopArgs as string[]) || [])])
    )

    if (node.children && node.children.length > 0) {
      schema.children = templateAstParser.parseTemplateChildren(node.children, options, currentLoopVariables)
    }
    return schema
  },

  parseTemplateChildren(children: any[], options: any, parentLoopVariables: string[] = []) {
    const parsedChildren = children
      .map((child: any) => {
        if (child.type === 1) return templateAstParser.parseTemplateNode(child, options, parentLoopVariables)
        if (child.type === 2) return templateAstParser.parseTextNode(child, options)
        if (child.type === 5) return templateAstParser.parseInterpolationNode(child, options, parentLoopVariables)
        return null
      })
      .filter(Boolean)

    return applyConditionalBranches(parsedChildren)
  }
}

export function parseTemplate(template: string, options: any = {}) {
  const ast = parse(template)
  if (!ast || !ast.children) return []
  return templateAstParser.parseTemplateChildren(ast.children, options, []).filter((node: any) => node?.componentName)
}
