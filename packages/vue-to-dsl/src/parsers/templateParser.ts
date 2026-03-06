import { parse } from '@vue/compiler-dom'
import { parse as babelParse } from '@babel/parser'

function ensureThisPrefix(exp: string, loopVariable?: string) {
  const v = String(exp || '').trim()
  if (!v) return v
  if (v.startsWith('this.')) return v

  // If we're inside a loop and the expression starts with the loop variable, don't prefix
  if (loopVariable) {
    // Check if expression starts with the loop variable name
    const loopVarPattern = new RegExp(`^${loopVariable}(?:\\.|\\[|$)`)
    if (loopVarPattern.test(v)) {
      return v
    }
  }

  // Only prefix when expression starts with an identifier (not literals/objects/arrays/parens/etc.)
  // and avoid prefixing keywords like function/async/new
  if (/^[A-Za-z_$]/.test(v) && !/^(function|async|new)\b/.test(v)) {
    // Check if it already starts with 'state.'
    if (v.startsWith('state.')) {
      return `this.${v}`
    }
    // For other identifiers, add 'this.state.' prefix
    // This handles both 'state' variable references and other reactive variables
    return `this.state.${v}`
  }
  return v
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

function parseDirectives(node: any, schema: any, _options: any) {
  if (!node.props) return

  // First pass: extract loopArgs if this node has v-for
  let loopVariable: string | undefined
  for (const prop of node.props) {
    if (prop.type === 7 && prop.name === 'for' && prop.exp) {
      const exp = prop.exp.content || ''
      // Extract loop variable names from `v-for="(item, index) in/of list"`
      const loopArgsMatch = exp.match(/^\(([A-Za-z_$][A-Za-z0-9_$]*)\s*,\s*([A-Za-z_$][A-Za-z0-9_$]*)\)/)
      if (loopArgsMatch) {
        loopVariable = loopArgsMatch[1]
        schema.loopArgs = [loopArgsMatch[1], loopArgsMatch[2]]
      } else {
        const itemMatch = exp.match(/^\(?([A-Za-z_$][A-Za-z0-9_$]*)\)?/)
        if (itemMatch) {
          loopVariable = itemMatch[1]
          schema.loopArgs = [itemMatch[1]]
        }
      }
      break
    }
  }

  // Second pass: process all directives with knowledge of loop variable
  node.props.forEach((prop: any) => {
    if (prop.type !== 7) return
    const directiveName = prop.name
    switch (directiveName) {
      case 'if':
        schema.condition = prop.exp ? prop.exp.content : 'true'
        break
      case 'for':
        if (prop.exp) {
          const exp = prop.exp.content || ''
          // Extract the iterable expression in `v-for="(item, i) in/of list"`
          // Prefer the part after the last occurrence of ` in ` or ` of `.
          const match =
            exp.match(/^[^]*?(?:\)|\S)\s+(?:in|of)\s+([^]+)$/) || exp.match(/^(?:[^]+?)\s+(?:in|of)\s+([^]+)$/)
          const src = (match ? match[1] : exp).trim()
          schema.loop = { type: 'JSExpression', value: ensureThisPrefix(src) }
        }
        break
      case 'show':
        schema.props['v-show'] = prop.exp ? prop.exp.content : 'true'
        break
      case 'model':
        schema.props['modelValue'] = {
          type: 'JSExpression',
          value: ensureThisPrefix(String(prop.exp.content), loopVariable),
          model: true
        }
        break
      case 'on': {
        const rawEvent = prop.arg ? prop.arg.content : 'click'
        const eventName = `on${toPascalCase(rawEvent)}`
        const val = prop.exp ? String(prop.exp.content || '') : ''
        schema.props[eventName] = { type: 'JSExpression', value: ensureThisPrefix(val, loopVariable) }
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
            schema.props[`${attrName}`] = { type: 'JSExpression', value: ensureThisPrefix(raw, loopVariable) }
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

function parseTextNode(node: any, _options: any) {
  if (!node.content || !node.content.trim()) return null
  return { componentName: 'Text', props: { text: node.content.trim() } }
}

function parseInterpolationNode(node: any, _options: any, loopVariable?: string) {
  return {
    componentName: 'Text',
    props: {
      text: {
        type: 'JSExpression',
        value: ensureThisPrefix(node.content ? node.content.content : '', loopVariable)
      }
    }
  }
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

function parseTemplateNode(node: any, options: any, parentLoopVariable?: string) {
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
  parseDirectives(node, schema, options)
  // Apply icon normalization
  normalizeTinyIcon(schema, node)

  // Get the loop variable from this node (if it has v-for)
  const currentLoopVariable = schema.loopArgs ? schema.loopArgs[0] : parentLoopVariable

  if (node.children && node.children.length > 0) {
    schema.children = node.children
      .map((child: any) => {
        if (child.type === 1) return parseTemplateNode(child, options, currentLoopVariable)
        if (child.type === 2) return parseTextNode(child, options)
        if (child.type === 5) return parseInterpolationNode(child, options, currentLoopVariable)
        return null
      })
      .filter(Boolean)
  }
  return schema
}

export function parseTemplate(template: string, options: any = {}) {
  const ast = parse(template)
  if (!ast || !ast.children) return []
  return ast.children
    .filter((node: any) => node.type === 1)
    .map((node: any) => parseTemplateNode(node, options, undefined))
    .filter(Boolean)
}
