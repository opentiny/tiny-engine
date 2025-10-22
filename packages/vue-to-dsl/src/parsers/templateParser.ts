import { parse } from '@vue/compiler-dom'
import { parse as babelParse } from '@babel/parser'

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

function parseNodeProps(props: any[], _options: any) {
  const result: Record<string, any> = {}
  props.forEach((prop: any) => {
    if (prop.type === 6) {
      result[prop.name] = prop.value ? prop.value.content : true
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
          const ensureThis = (s: string) => (s.startsWith('this.') ? s : `this.${s}`)
          schema.loop = { type: 'JSExpression', value: ensureThis(src) }
        }
        break
      case 'show':
        schema.props['v-show'] = prop.exp ? prop.exp.content : 'true'
        break
      case 'model':
        schema.props['v-model'] = prop.exp ? prop.exp.content : ''
        break
      case 'on': {
        const eventName = prop.arg ? prop.arg.content : 'click'
        const val = prop.exp ? String(prop.exp.content || '') : ''
        schema.props[eventName] = { type: 'JSExpression', value: val }
        break
      }
      case 'bind': {
        const attrName = prop.arg ? prop.arg.content : 'value'
        if (prop.exp && prop.exp.content !== null) {
          const raw = String(prop.exp.content)
          const parsed = parseLiteralExpression(raw)
          if (parsed.ok) {
            schema.props[`${attrName}`] = parsed.value
          } else {
            schema.props[`${attrName}`] = { type: 'JSExpression', value: raw }
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

function parseInterpolationNode(node: any, _options: any) {
  return {
    componentName: 'Text',
    props: { text: { type: 'JSExpression', value: node.content ? node.content.content : '' } }
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

function parseTemplateNode(node: any, options: any) {
  if (node.type !== 1) return null
  const schema: any = { componentName: getComponentName(node.tag, options), props: {}, children: [] }
  if (node.props && node.props.length > 0) schema.props = parseNodeProps(node.props, options)
  parseDirectives(node, schema, options)
  // Apply icon normalization
  normalizeTinyIcon(schema, node)

  if (node.children && node.children.length > 0) {
    schema.children = node.children
      .map((child: any) => {
        if (child.type === 1) return parseTemplateNode(child, options)
        if (child.type === 2) return parseTextNode(child, options)
        if (child.type === 5) return parseInterpolationNode(child, options)
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
    .map((node: any) => parseTemplateNode(node, options))
    .filter(Boolean)
}
