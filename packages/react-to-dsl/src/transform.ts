import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import type { File } from '@babel/types'
import type { IAppSchema, IPageSchema, ISchemaChildrenItem } from './types'
import { genId8 } from './utils'

export interface TransformOptions {
  filename?: string
  isBlock?: boolean
  css?: string | string[]
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

// 将箭头函数表达式转换为普通函数源码字符串，尽量保持参数/async/主体一致
function arrowToFunctionCode(name: string | undefined, node: any): string {
  const params = (node.params || []).map((p: any) => generate(p).code).join(', ')
  const bodyCode =
    node.body?.type === 'BlockStatement' ? generate(node.body).code : `{ return ${generate(node.body).code}; }`
  const asyncPrefix = node.async ? 'async ' : ''
  const namePart = name ? ` ${name}` : ''
  return `${asyncPrefix}function${namePart}(${params}) ${bodyCode}`
}

export function transformReactToDsl(code: string, options: TransformOptions = {}): IAppSchema {
  const filename = options.filename || 'App.tsx'
  const ast: File = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  }) as any

  let rootJsx: any | null = null
  let stateInitNode: any | null = null
  let componentFuncPath: any | null = null
  let componentClassPath: any | null = null

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
        // 记录包含该 return 的最近函数（函数声明/函数表达式/箭头函数）——即组件函数
        const funcPath = path.findParent(
          (p: any) => p.isFunctionDeclaration?.() || p.isFunctionExpression?.() || p.isArrowFunctionExpression?.()
        )
        if (funcPath && !componentFuncPath) componentFuncPath = funcPath
        // 如果在类组件的 render 方法中，记录类路径
        const renderMethodPath = path.findParent((p: any) => p.isClassMethod?.() && p.node.key?.name === 'render')
        if (renderMethodPath && !componentClassPath) {
          const cls = renderMethodPath.findParent((p: any) => p.isClassDeclaration?.() || p.isClassExpression?.())
          if (cls) componentClassPath = cls
        }
      }
    }
  })

  // 读取并拼接 css 内容
  let cssContent = ''
  if (options.css) {
    cssContent = Array.isArray(options.css) ? options.css.join('\n') : options.css
  }

  const page: IPageSchema = {
    componentName: options.isBlock ? 'Block' : 'Page',
    css: cssContent,
    fileName: filename.replace(/\.(t|j)sx?$/, ''),
    lifeCycles: {},
    methods: {},
    props: {},
    state: [],
    meta: {
      id: 1,
      isPage: !options.isBlock,
      isHome: true,
      parentId: '0',
      router: '/'
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

  // 提取组件函数体内的方法定义，写入 schema.methods
  try {
    const methods: Record<string, any> = {}
    if (componentFuncPath) {
      const funcNode: any = componentFuncPath.node
      // 仅处理块体
      const block = funcNode.body && funcNode.body.type === 'BlockStatement' ? funcNode.body : null
      if (block && Array.isArray(block.body)) {
        for (const stmt of block.body) {
          // 1) function handleX() {}
          if (stmt.type === 'FunctionDeclaration' && stmt.id && stmt.id.name) {
            const name = stmt.id.name
            methods[name] = { type: 'JSFunction', value: generate(stmt).code }
          }
          // 2) const fn = () => {} / function() {}
          if (stmt.type === 'VariableDeclaration') {
            for (const decl of stmt.declarations) {
              if (!decl || decl.type !== 'VariableDeclarator') continue
              if (!decl.id || decl.id.type !== 'Identifier') continue
              const name = decl.id.name
              const init = decl.init
              if (!init) continue
              if (init.type === 'ArrowFunctionExpression') {
                methods[name] = { type: 'JSFunction', value: arrowToFunctionCode(name, init) }
              } else if (init.type === 'FunctionExpression') {
                // 若是匿名函数表达式，保留为函数表达式；如需可改为具名函数
                methods[name] = { type: 'JSFunction', value: generate(init).code }
              }
            }
          }
        }
      }
    }
    // 类组件方法与生命周期
    if (componentClassPath && componentClassPath.node && componentClassPath.node.body) {
      const classBody = componentClassPath.node.body.body || []
      const lifeCycleRecord: Record<string, any> = {}
      const lifecycleNames = new Set([
        'constructor',
        'componentDidMount',
        'componentWillUnmount',
        'componentDidUpdate',
        'componentDidCatch',
        'shouldComponentUpdate',
        'getSnapshotBeforeUpdate',
        'componentWillReceiveProps'
      ])
      for (const m of classBody) {
        if (m.type === 'ClassMethod' && m.key && (m.key.type === 'Identifier' || m.key.type === 'StringLiteral')) {
          const name = m.key.type === 'Identifier' ? m.key.name : String(m.key.value)
          if (name === 'render') continue
          if (lifecycleNames.has(name)) {
            lifeCycleRecord[name] = { type: 'JSFunction', value: generate(m).code }
          } else {
            methods[name] = { type: 'JSFunction', value: generate(m).code }
          }
        }
        if ((m.type === 'ClassProperty' || m.type === 'ClassPrivateProperty') && m.key) {
          const key: any = m.key
          const name = key.type === 'Identifier' ? key.name : key.type === 'PrivateName' ? key.id?.name : undefined
          const init: any = (m as any).value
          if (name && init) {
            if (init.type === 'ArrowFunctionExpression') {
              methods[name] = { type: 'JSFunction', value: arrowToFunctionCode(name, init) }
            } else if (init.type === 'FunctionExpression') {
              methods[name] = { type: 'JSFunction', value: generate(init).code }
            }
          }
        }
      }
      if (Object.keys(lifeCycleRecord).length > 0) {
        page.lifeCycles = { ...page.lifeCycles, ...lifeCycleRecord }
      }
    }

    page.methods = { ...page.methods, ...methods }
  } catch (e) {
    // 忽略方法提取失败，不影响总体转换
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
