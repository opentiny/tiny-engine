import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import type { File } from '@babel/types'
import type { IAppSchema, IPageSchema, ISchemaChildrenItem } from './types'
import { genId8 } from './utils'

export interface TransformOptions {
  filename?: string
  isBlock?: boolean
}

// 将通用 AST 表达式节点转换为可序列化值：基本字面量直接返回；
// 对象/数组递归；函数/标识符/成员/调用等保留为 JSExpression。
function astExprToValue(node: any): any {
  if (!node) return null
  switch (node.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
      return node.value
    case 'NullLiteral':
      return null
    case 'TemplateLiteral': {
      if (!node.expressions || node.expressions.length === 0) {
        return node.quasis.map((q: any) => q.value.cooked).join('')
      }
      return { type: 'JSExpression', value: generate(node).code }
    }
    case 'ObjectExpression': {
      const obj: Record<string, any> = {}
      for (const prop of node.properties) {
        if (prop.type === 'ObjectProperty') {
          const k = prop.computed
            ? generate(prop.key).code
            : prop.key.type === 'Identifier'
            ? prop.key.name
            : String((prop.key as any).value)
          obj[k] = astExprToValue(prop.value)
        } else if (prop.type === 'SpreadElement') {
          // 以特殊键标识展开
          obj['...'] = { type: 'JSExpression', value: generate(prop.argument).code }
        }
      }
      return obj
    }
    case 'ArrayExpression':
      return node.elements.map((el: any) => (el ? astExprToValue(el) : null))
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
    case 'Identifier':
    case 'MemberExpression':
    case 'CallExpression':
    case 'BinaryExpression':
    case 'LogicalExpression':
    case 'ConditionalExpression':
    case 'UnaryExpression':
    case 'NewExpression':
      return { type: 'JSExpression', value: generate(node).code }
    default:
      return { type: 'JSExpression', value: generate(node).code }
  }
}

function jsxAttrValueToLiteral(node: any): any {
  if (!node) return ''
  switch (node.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
      return node.value
    case 'NullLiteral':
      return null
    case 'JSXExpressionContainer':
      return astExprToValue(node.expression)
    case 'ArrayExpression':
    case 'ObjectExpression':
      return astExprToValue(node)
    default:
      return astExprToValue(node)
  }
}

function buildNodeFromJSX(jsxEl: any): ISchemaChildrenItem {
  const componentName = jsxEl.openingElement.name.name || 'Fragment'
  const props: Record<string, any> = {}

  jsxEl.openingElement.attributes.forEach((attr: any) => {
    if (attr.type === 'JSXAttribute') {
      const key = attr.name.name
      const val = attr.value ? jsxAttrValueToLiteral(attr.value) : true
      props[key] = val
    } else if (attr.type === 'JSXSpreadAttribute') {
      props['...'] = {
        type: 'JSExpression',
        value: generate(attr.argument).code
      }
    }
  })

  const children: ISchemaChildrenItem[] = []
  jsxEl.children.forEach((c: any) => {
    if (c.type === 'JSXElement') {
      children.push(buildNodeFromJSX(c))
    } else if (c.type === 'JSXText') {
      const text = c.value.trim()
      if (text) {
        children.push({
          componentName: 'span',
          id: genId8(),
          props: { children: text },
          children: []
        })
      }
    } else if (c.type === 'JSXExpressionContainer') {
      const code = generate(c.expression).code
      children.push({
        componentName: 'Fragment',
        id: genId8(),
        props: { children: { type: 'JSExpression', value: code } },
        children: []
      })
    }
  })

  return {
    componentName,
    id: genId8(),
    props,
    children
  }
}

export function transformReactToDsl(code: string, options: TransformOptions = {}): IAppSchema {
  const filename = options.filename || 'App.tsx'
  const ast: File = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  }) as any

  let rootJsx: any | null = null
  let stateInitNode: any | null = null

  traverse(ast, {
    VariableDeclarator(path) {
      if (stateInitNode) return
      const d: any = path.node
      if (d.id && d.id.type === 'ArrayPattern' && d.init && d.init.type === 'CallExpression') {
        const callee = d.init.callee
        const isUseState =
          (callee.type === 'Identifier' && callee.name === 'useState') ||
          (callee.type === 'MemberExpression' &&
            callee.property &&
            callee.property.type === 'Identifier' &&
            callee.property.name === 'useState')
        if (isUseState && d.init.arguments && d.init.arguments.length > 0) {
          stateInitNode = d.init.arguments[0]
        }
      }
    },
    ReturnStatement(path) {
      // find nearest JSXElement in return
      const arg: any = path.node.argument
      if (arg && (arg.type === 'JSXElement' || arg.type === 'JSXFragment') && !rootJsx) {
        rootJsx = arg.type === 'JSXFragment' ? arg.children.find((c: any) => c.type === 'JSXElement') : arg
      }
    }
  })

  const page: IPageSchema = {
    componentName: options.isBlock ? 'Block' : 'Page',
    css: '',
    fileName: filename.replace(/\.(t|j)sx?$/, ''),
    lifeCycles: {},
    methods: {},
    props: {},
    state: [],
    meta: {
      id: 1,
      isHome: true,
      parentId: 'root',
      rootElement: 'root',
      route: '/'
    },
    children: []
  }

  if (rootJsx) {
    page.children = [buildNodeFromJSX(rootJsx)]
  }
  if (stateInitNode) {
    try {
      page.state = [astExprToValue(stateInitNode)]
    } catch (e) {
      // 失败则忽略
    }
  }

  const appSchema: IAppSchema = {
    i18n: { en_US: {}, zh_CN: {} },
    utils: [],
    dataSource: { list: [] },
    globalState: [],
    pageSchema: [page],
    blockSchema: [],
    componentsMap: [],
    meta: { name: 'App', description: 'Generated from React source' }
  }

  return appSchema
}
