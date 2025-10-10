import { z } from 'zod'
import { editSchema } from './editSchema'
import { editLifeCycleOrMethod } from './editLifeCycleOrMethod'
import { editState } from './editState'
import { editCSS } from './editCSS'
import { ERROR_CODES, nextActionGetSchema } from './utils'

// 定义函数单元的 zod 结构，用于 lifecycle 与 methods（统一 { type: 'JSFunction', value } 形态）
const funcTypeSchema = z
  .object({
    type: z.literal('JSFunction'),
    value: z.string()
  })
  .describe(
    '函数单元。必须为 { type: "JSFunction", value: string } 格式。示例: { type: "JSFunction", value: "function onMounted(){ console.log(\'mounted\') }" }。用于 lifeCycles/methods 的值。'
  )

// lifeCycles(生命周期)：支持 all（整量）、add/update/remove（部分）
const lifeCyclesPayloadSchema = z
  .object({
    all: z
      .record(z.string(), funcTypeSchema)
      .optional()
      .describe(
        '完整的生命周期映射（replace 模式优先使用）。常见钩子：setup, onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted。'
      ),
    add: z
      .record(z.string(), funcTypeSchema)
      .optional()
      .describe('新增生命周期（仅当键不存在时生效）。示例请参考资源文档 lifeCycles 分节。'),
    update: z
      .record(z.string(), funcTypeSchema)
      .optional()
      .describe('更新生命周期（仅当键已存在时生效）。会完全替换原有的函数定义。'),
    remove: z
      .array(z.string())
      .optional()
      .describe('要删除的生命周期键名列表。传入钩子名数组，如 ["onBeforeMount", "onUpdated"]。')
  })
  .optional()
  .describe(
    '当 section = "lifeCycles" 时传入的参数。merge 模式：通过 add/update/remove 按键操作；replace 模式：优先使用 all 字段提供完整映射，或用 add+update 组合重建（此时 remove 将被忽略）。完整示例请参考资源文档 lifeCycles 分节。'
  )

// methods（方法）：与 lifeCycles 相同
const methodsPayloadSchema = z
  .object({
    all: z
      .record(z.string(), funcTypeSchema)
      .optional()
      .describe(
        '完整的方法映射（replace 模式优先使用）。方法名建议使用驼峰命名，如 handleClick, fetchData, validateForm。'
      ),
    add: z
      .record(z.string(), funcTypeSchema)
      .optional()
      .describe('新增方法（仅当键不存在时生效）。示例请参考资源文档 methods 分节。'),
    update: z
      .record(z.string(), funcTypeSchema)
      .optional()
      .describe('更新方法（仅当键已存在时生效）。会完全替换原有的函数定义。'),
    remove: z
      .array(z.string())
      .optional()
      .describe('要删除的方法名列表。传入方法名数组，如 ["legacyMethod", "deprecatedHandler"]。')
  })
  .optional()
  .describe(
    '当 section = "methods" 时传入的参数。merge 模式：通过 add/update/remove 按键操作；replace 模式：优先使用 all 字段提供完整映射，或用 add+update 组合重建（此时 remove 将被忽略）。完整示例请参考资源文档 methods 分节。'
  )

// state（页面状态变量）：支持 all（整量）、add/update/remove（部分）。此处合并为顶层键的浅合并
const statePayloadSchema = z
  .object({
    all: z
      .record(z.string(), z.any())
      .optional()
      .describe('完整的 state 对象（replace 模式优先使用）。值可以是字面量、JSExpression、computed 或 accessor。'),
    add: z
      .record(z.string(), z.any())
      .optional()
      .describe(
        '新增顶层键（仅当键不存在时生效）。值支持字面量（如 "hello", 123, []）、JSExpression（{ type: "JSExpression", value: "..." }）、computed、accessor。示例请参考资源文档 state 分节。'
      ),
    update: z
      .record(z.string(), z.any())
      .optional()
      .describe('更新顶层键（仅当键已存在时生效）。不会深层递归合并，会完全替换顶层键的整个值。'),
    remove: z
      .array(z.string())
      .optional()
      .describe('要从 state 中删除的顶层键列表。传入键名数组，如 ["deprecatedKey", "oldVariable"]。')
  })
  .optional()
  .describe(
    '当 section = "state" 时传入的参数。merge 模式：仅对顶层键执行 add/update/remove（浅合并，不递归深层结构）；值支持字面量或 JSResource/JSExpression/computed/accessor。replace 模式：优先使用 all 字段提供完整对象，或用 add+update 组合重建（此时 remove 将被忽略）。完整示例和值类型说明请参考资源文档 state 分节。'
  )

// 顶层输入结构：判别式入口（section）+ 策略（strategy）+ section 对应的参数
const inputSchema = z.object({
  section: z.enum(['schema', 'css', 'lifeCycles', 'methods', 'state']).describe(`要编辑的页面部分。快速选择：
  • 'state' - 页面状态变量（推荐从示例文档 state 分节入手）
  • 'css' - 全局样式（推荐优先使用 Tailwind utility 类）
  • 'lifeCycles' - Vue 生命周期钩子（如 onMounted, setup）
  • 'methods' - 页面方法（如事件处理器）
  • 'schema' - 顶层配置（谨慎使用，建议先读取协议文档 structure 分节）
仅作用于画布中当前打开的页面。详细说明请读取对应的协议文档分节。`),
  strategy: z
    .enum(['replace', 'merge'])
    .optional()
    .describe(
      `编辑策略，默认 merge：
  • 'merge'（推荐）- 部分更新，通过 add/update/remove 精确控制变更，保留现有内容
  • 'replace'（谨慎）- 整体替换，会覆盖现有内容，建议先读取协议文档了解影响
各 section 的 merge 行为：
  - css: 末尾追加
  - lifeCycles/methods: 按键 add/update/remove
  - state: 仅顶层键 add/update/remove（不递归）
  - schema: 仅允许特定键的浅合并`
    ),
  // 提升为一级字段：与各分节处理器的期望保持一致（回调中再做基于 section 的严格校验）
  schema: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      '页面 schema 的顶层部分（浅合并）。仅在 section = "schema" 时使用；仅允许更新特定键集合（css, lifeCycles, methods, state, props, fileName, componentName, dataSource, children）。建议先调用 get_page_schema 查看结构，详细说明请参考协议文档 structure 分节。'
    ),
  css: z
    .string()
    .optional()
    .describe(
      '整页 CSS 文本。replace = 整体覆盖；merge = 在末尾追加（必要时自动换行）。推荐优先使用 Tailwind utility 类直接绑定到组件的 className，而非在此添加自定义 CSS。仅在 section = "css" 时使用。完整示例请参考资源文档 css 分节。'
    ),
  lifeCycles: lifeCyclesPayloadSchema,
  methods: methodsPayloadSchema,
  state: statePayloadSchema
})

const ok = (res: Record<string, any>) => ({
  content: [
    {
      type: 'text',
      text: JSON.stringify(res)
    }
  ]
})

const err = (payload: {
  errorCode: string
  reason: string
  userMessage: string
  next_action?: Array<Record<string, any>>
}) => ({
  content: [
    {
      isError: true,
      type: 'text',
      text: JSON.stringify(payload)
    }
  ]
})

const validateSection = (section: string) => {
  if (!section || !['schema', 'css', 'lifeCycles', 'methods', 'state'].includes(section)) {
    return {
      isValid: false,
      error: {
        errorCode: ERROR_CODES.INVALID_ARGUMENT,
        reason: 'Unknown section',
        userMessage: 'Unknown section',
        next_action: nextActionGetSchema()
      }
    }
  }

  return {
    isValid: true
  }
}

const validateStrategy = (strategy: string) => {
  if (!['replace', 'merge'].includes(strategy)) {
    return {
      isValid: false,
      error: {
        errorCode: ERROR_CODES.INVALID_ARGUMENT,
        reason: 'Unknown strategy',
        userMessage: 'Unknown strategy',
        next_action: nextActionGetSchema()
      }
    }
  }

  return {
    isValid: true
  }
}

const legalSchemaKey = ['css', 'schema', 'lifeCycles', 'methods', 'state'] as const

const validateRequiredField = (args: z.infer<typeof inputSchema>) => {
  // 校验：根据 section 仅允许对应字段存在

  const section = args.section
  const providedSections = legalSchemaKey.filter((key) => typeof args[key] !== 'undefined')
  // section 对应的 必填字段一一对应
  const requiredField = section

  if (!providedSections.length || !providedSections.includes(requiredField)) {
    return {
      isValid: false,
      error: {
        errorCode: ERROR_CODES.INVALID_PAYLOAD,
        reason: `Missing required field for section "${section}": expected "${requiredField}"`,
        userMessage: `Missing required field: please provide "${requiredField}" when section = "${section}"`,
        next_action: nextActionGetSchema()
      }
    }
  }

  if (providedSections.length > 1 || (providedSections.length === 1 && providedSections[0] !== requiredField)) {
    const extras = providedSections.filter((s) => s !== requiredField)
    return {
      isValid: false,
      error: {
        errorCode: ERROR_CODES.INVALID_ARGUMENT,
        reason: `Invalid combination for section "${section}", unexpected fields: ${extras.join(', ')}`,
        userMessage: `Only field "${requiredField}" is allowed when section = "${section}". Unexpected: ${extras.join(
          ', '
        )}`,
        next_action: nextActionGetSchema()
      }
    }
  }

  return {
    isValid: true
  }
}

export const EditPageSchema = {
  name: 'edit_page_schema',
  title: '编辑页面schema',
  description: `编辑 TinyEngine 低代码画布中当前页面的 schema。

【支持的部分】
支持五个部分：schema、css、lifeCycles、methods 和 state。
使用策略 "replace" 进行整体替换，或使用 "merge" 进行部分更新（add/update/remove）。

【必读文档资源】
在使用本工具前，强烈建议先通过 read_resources 工具读取以下文档以确保正确操作：

1. 页面 Schema 协议文档（数据结构和约束）：
   - 完整读取：{ "uri": "tinyengine://docs/page-schema" }
   - 分节读取：{ "uriTemplate": "tinyengine://docs/page-schema/{section}", "variables": { "section": "对应分节名" } }

2. 编辑示例文档（实战案例和最佳实践）：
   - 完整读取：{ "uri": "tinyengine://docs/edit-page-schema-examples" }
   - 分节读取：{ "uriTemplate": "tinyengine://docs/edit-page-schema-examples/{section}", "variables": { "section": "对应分节名" } }

【按 section 读取对应文档分节】
根据你要操作的 section，建议读取以下分节（使用 read_resources 工具）：

• section='state':
  协议文档分节: { "section": "state" }
  示例文档分节: { "section": "state" }

• section='css':
  协议文档分节: { "section": "css" }
  示例文档分节: { "section": "css" }

• section='lifeCycles':
  协议文档分节: { "section": "lifeCycles" }
  示例文档分节: { "section": "lifeCycles" }

• section='methods':
  协议文档分节: { "section": "methods" }
  示例文档分节: { "section": "methods" }

• section='schema':
  协议文档分节: { "section": "structure" }
  示例文档分节: { "section": "schema" }

【遇到错误或疑问时】
• 建议先读取完整协议文档了解整体结构
• 根据操作的 section 读取对应分节即可

【使用建议】
• 首次使用：建议先读取完整协议文档了解整体结构，或读取对应 section 的示例快速上手
• 日常使用：根据操作的 section 读取对应分节即可（性能更优）
• 不确定当前结构：先调用 "get_page_schema" 工具查看现有结构

【关键提示】
• lifeCycles 和 methods 需要 { type: "JSFunction", value: string } 形式的函数单元
• state 接受普通值以及 JSResource/JSExpression/computed/accessor（getter/setter）结构
• css 使用 "merge" 时会将给定的 CSS 字符串追加到末尾
• 对于细粒度的节点树变更（children 结构），建议使用节点工具如 "add_node" 或 "change_node_props"

【重要警告】
此工具始终作用于画布中当前打开的页面。
"replace" 策略会覆盖现有内容，使用前请务必先读取协议文档了解影响范围。`,
  inputSchema: inputSchema.shape,
  callback: async (args: z.infer<typeof inputSchema>) => {
    try {
      const { section, strategy = 'merge' } = args || {}

      const sectionValidateResult = validateSection(section)
      if (!sectionValidateResult.isValid) {
        return err(sectionValidateResult.error!)
      }

      const strategyValidateResult = validateStrategy(strategy)
      if (!strategyValidateResult.isValid) {
        return err(strategyValidateResult.error!)
      }

      const requiredFieldValidateResult = validateRequiredField(args)
      if (!requiredFieldValidateResult.isValid) {
        return err(requiredFieldValidateResult.error!)
      }

      let out: Record<string, any> | undefined
      // 根据不同 section 调用对应的处理器
      if (section === 'lifeCycles' || section === 'methods') {
        out = editLifeCycleOrMethod(strategy, args[section], section)
      } else if (section === 'css') {
        out = editCSS(strategy, args.css)
      } else if (section === 'schema') {
        out = editSchema(strategy, args.schema)
      } else if (section === 'state') {
        out = editState(strategy, args.state)
      }

      if (out?.error) {
        return err(out.error)
      }

      return ok({
        status: 'success',
        message: out?.message,
        data: { section, strategy, ...out }
      })
    } catch (e) {
      return err({
        errorCode: ERROR_CODES.UNEXPECTED_ERROR,
        reason: e instanceof Error ? e.message : 'Unknown error',
        userMessage: 'Unexpected error occurred while editing page schema'
      })
    }
  }
}
