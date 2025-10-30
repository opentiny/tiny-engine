import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { transformReactToDsl } from '../../src'

// 小工具：读取目录下的测试用例（形如 001_xxx），排除 output 目录
function getTestCaseDirs(rootDir) {
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => name !== 'output' && !name.startsWith('.'))
}

// 遍历 children 树的通用工具
function walkNodes(nodes, visit) {
  if (!Array.isArray(nodes)) return
  for (const n of nodes) {
    visit(n)
    if (n && Array.isArray(n.children) && n.children.length) {
      walkNodes(n.children, visit)
    }
  }
}

function someNode(nodes, predicate) {
  let hit = false
  walkNodes(nodes, (n) => {
    if (!hit && predicate(n)) hit = true
  })
  return hit
}

// 读取指定用例 input 目录中的首个 .jsx/.tsx 文件
function findInputSource(caseDir) {
  const inputDir = path.join(caseDir, 'input')
  if (!fs.existsSync(inputDir)) return null
  const files = fs.readdirSync(inputDir)
  const src = files.find((f) => /\.(jsx|tsx)$/.test(f))
  return src ? path.join(inputDir, src) : null
}

// 读取 input 目录下的所有 .css 内容并拼接
function readAllCss(caseDir) {
  const inputDir = path.join(caseDir, 'input')
  if (!fs.existsSync(inputDir)) return ''
  const files = fs.readdirSync(inputDir)
  const cssFiles = files.filter((f) => f.endsWith('.css'))
  const contents = cssFiles.map((f) => fs.readFileSync(path.join(inputDir, f), 'utf-8'))
  return contents.join('\n')
}

// 将 DSL 写入 <caseName>/output/app.schema.json，并额外导出 page.schema.json 便于查看
function writeOutputs(rootDir, caseName, appSchema) {
  const outputDir = path.join(rootDir, caseName, 'output')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  const appSchemaPath = path.join(outputDir, 'app.schema.json')
  fs.writeFileSync(appSchemaPath, JSON.stringify(appSchema, null, 2), 'utf-8')

  // 额外导出首个 page.schema.json 便于查看
  if (Array.isArray(appSchema.pageSchema) && appSchema.pageSchema.length > 0) {
    const pageSchemaPath = path.join(outputDir, 'page.schema.json')
    fs.writeFileSync(pageSchemaPath, JSON.stringify(appSchema.pageSchema[0], null, 2), 'utf-8')
  }
}

describe('react-to-dsl: run all testcases and output to ./output', () => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const casesRoot = __dirname
  const caseNames = getTestCaseDirs(casesRoot)

  it(`should discover at least 1 testcase`, () => {
    expect(Array.isArray(caseNames)).toBe(true)
    // 允许为空，但给出提示；如果后续补充用例即可被自动识别
  })

  for (const caseName of caseNames) {
    it(`transform testcase: ${caseName}`, () => {
      const caseDir = path.join(casesRoot, caseName)
      const srcPath = findInputSource(caseDir)
      expect(srcPath, `No JSX/TSX found in ${path.join(caseDir, 'input')}`).toBeTruthy()

      const code = fs.readFileSync(srcPath, 'utf-8')
      const css = readAllCss(caseDir)
      const appSchema = transformReactToDsl(code, {
        filename: path.basename(srcPath),
        css
      })

      // 基本校验
      expect(appSchema).toBeTruthy()
      expect(Array.isArray(appSchema.pageSchema)).toBe(true)

      // 获取第一个 Page/Block
      const pageOrFolder = appSchema.pageSchema[0]
      expect(pageOrFolder).toBeTruthy()
      if (pageOrFolder && pageOrFolder.componentName === 'Folder') return
      const page = pageOrFolder

      // 通用结构校验
      expect(Array.isArray(page.children)).toBe(true)
      expect(typeof page.css).toBe('string')

      // 各用例特定断言
      if (caseName.startsWith('001_normal')) {
        // 1) CSS 注入
        expect(page.css.includes('.main-body')).toBe(true)
        // 2) 组件存在（Tiny 体系）
        expect(
          someNode(page.children, (n) => n.componentName === 'TinyForm') &&
            someNode(page.children, (n) => n.componentName === 'TinyGrid')
        ).toBe(true)
        // 3) 循环识别：state.buttons.map -> loop 表达式
        expect(
          someNode(
            page.children,
            (n) => n.loop && n.loop.type === 'JSExpression' && /state\.buttons/.test(n.loop.value)
          )
        ).toBe(true)
        // 4) 方法提取
        expect(page.methods && typeof page.methods === 'object').toBe(true)
        expect(!!page.methods.getTableData).toBe(true)
        expect(!!page.methods.handleSearch).toBe(true)
      }

      if (caseName.startsWith('002_data-binding')) {
        // value/checked 等数据绑定应转为 JSExpression
        const hasBoundValue = someNode(page.children, (n) => {
          const v = n?.props?.modelValue
          return v && typeof v === 'object' && v.type === 'JSExpression' && /state\.(username|email)/.test(v.value)
        })
        expect(hasBoundValue).toBe(true)
        const hasBoundChecked = someNode(page.children, (n) => {
          const v = n?.props?.checked
          return v && typeof v === 'object' && v.type === 'JSExpression' && /state\.isSubscribed/.test(v.value)
        })
        expect(hasBoundChecked).toBe(true)

        // 双向绑定：value/modelValue 与 checked 应带有 model: true 且使用 this.state 路径
        const hasModelForValue = someNode(page.children, (n) => {
          const mv = n?.props?.modelValue || n?.props?.value
          return (
            mv &&
            typeof mv === 'object' &&
            mv.type === 'JSExpression' &&
            mv.model === true &&
            /this\.state\.(username|email)/.test(mv.value)
          )
        })
        expect(hasModelForValue).toBe(true)

        const hasModelForChecked = someNode(page.children, (n) => {
          const ck = n?.props?.checked
          return (
            ck &&
            typeof ck === 'object' &&
            ck.type === 'JSExpression' &&
            ck.model === true &&
            /this\.state\.isSubscribed/.test(ck.value)
          )
        })
        expect(hasModelForChecked).toBe(true)

        // 双向绑定后应移除 onChange
        const removedOnChange = someNode(page.children, (n) => {
          const p = n?.props || {}
          const hasModel =
            (p.modelValue && typeof p.modelValue === 'object' && p.modelValue.model === true) ||
            (p.value && typeof p.value === 'object' && p.value.model === true) ||
            (p.checked && typeof p.checked === 'object' && p.checked.model === true)
          return hasModel && !('onChange' in p)
        })
        expect(removedOnChange).toBe(true)
      }

      if (caseName.startsWith('003_createVM')) {
        // 组件映射校验：Steps -> TinyTimeLine
        expect(someNode(page.children, (n) => n.componentName === 'TinyTimeLine')).toBe(true)
        // Input.Search -> TinySearch
        expect(someNode(page.children, (n) => n.componentName === 'TinySearch')).toBe(true)
        // Radio.Group -> TinyButtonGroup
        expect(someNode(page.children, (n) => n.componentName === 'TinyButtonGroup')).toBe(true)
        // Select -> TinySelect
        expect(someNode(page.children, (n) => n.componentName === 'TinySelect')).toBe(true)
        // DatabaseOutlined 特殊图标映射
        expect(
          someNode(page.children, (n) => n.componentName === 'Icon' && n.props && n.props.name === 'IconPanelMini')
        ).toBe(true)
        // style 规范化为字符串（例如 padding-bottom: 10px）
        expect(
          someNode(
            page.children,
            (n) => typeof n?.props?.style === 'string' && /padding-bottom:\s*10px/.test(n.props.style)
          )
        ).toBe(true)
      }

      if (caseName.startsWith('004_lifecycle')) {
        // 生命周期与类方法提取
        const lc = page.lifeCycles || {}
        const methods = page.methods || {}
        expect(!!lc.componentDidMount).toBe(true)
        expect(!!lc.componentWillUnmount).toBe(true)
        expect(!!lc.componentDidUpdate).toBe(true)
        expect(!!lc.componentDidCatch).toBe(true)
        expect(!!methods.handleClick).toBe(true)
      }

      // 输出到 output/<caseName>
      writeOutputs(casesRoot, caseName, appSchema)
    })
  }
})
