function createSection(title, lines = []) {
  const validLines = lines.filter(Boolean)

  if (!validLines.length) {
    return ''
  }

  return `${title}:\n${validLines.map((line) => `- ${line}`).join('\n')}`
}

function formatFactWithDescription(accessPath, description = '', extra = '') {
  const details = [extra, description].filter(Boolean).join(' | ')
  return details ? `${accessPath} // ${details}` : accessPath
}

function formatStoreFacts(globalState) {
  return globalState.map((store) => {
    const members = [...store.state, ...store.getters].map((name) => `this.stores.${store.id}.${name}`)
    const actions = store.actions.map((name) => `this.stores.${store.id}.${name}()`)
    const facts = [...members, ...actions]
    return facts.length ? facts.join(', ') : `this.stores.${store.id}`
  })
}

function formatSchemaFacts(currentSchema) {
  if (!currentSchema) {
    return []
  }

  return [
    `component: ${currentSchema.componentName || 'Unknown'}`,
    currentSchema.refAccess ? `ref: ${currentSchema.refAccess}` : '',
    currentSchema.props?.length ? `props: ${currentSchema.props.join(', ')}` : '',
    currentSchema.events?.length ? `events: ${currentSchema.events.join(', ')}` : '',
    currentSchema.dynamicProps?.length ? `dynamic props: ${currentSchema.dynamicProps.join(', ')}` : ''
  ]
}

function buildLowcodeFacts(lowcodeContext = {}) {
  const {
    dataSource = [],
    utils = [],
    bridge = [],
    globalState = [],
    state = [],
    methods = [],
    currentSchema = null
  } = lowcodeContext

  const sections = [
    createSection('Platform APIs', [
      'this.props, this.emit, this.setState, this.route, this.history',
      'this.i18n, this.getLocale(), this.setLocale()',
      "this.$('refName') for component refs",
      'this.dataSourceMap.<name>.load() for data loading'
    ]),
    createSection(
      'Data sources',
      dataSource.map((item) => formatFactWithDescription(item.accessPath, item.description, item.type))
    ),
    createSection(
      'Utilities',
      utils.map((item) => formatFactWithDescription(item.signature || item.accessPath, item.description, item.package))
    ),
    createSection(
      'Bridge APIs',
      bridge.map((item) => formatFactWithDescription(item.accessPath, item.description))
    ),
    createSection('Global stores', formatStoreFacts(globalState)),
    createSection(
      'Local state',
      state.map((item) => `${item.accessPath}: ${item.type}`)
    ),
    createSection(
      'Local methods',
      methods.map((item) => item.signature || `${item.accessPath}()`)
    ),
    createSection('Current component', formatSchemaFacts(currentSchema))
  ].filter(Boolean)

  return sections.join('\n\n')
}

/**
 * 系统 Prompt - 定义 AI 的角色和基本规则
 */
export const SYSTEM_BASE_PROMPT = `Return only the text to insert at the cursor.
Match the surrounding style and indentation.
Stay in the current scope and do not repeat existing code.`

/**
 * 代码补全指令模板
 * @param {string} language - 编程语言
 * @returns {string} 指令文本
 */
export function createCodeInstruction(language) {
  return `Complete the ${language} code at the cursor.
Return only the inserted code.
Keep the completion minimal and stay in the current scope.`
}

/**
 * 块注释补全指令（JSDoc）
 */
export const BLOCK_COMMENT_INSTRUCTION = `Complete the current JSDoc comment only.
Keep it concise, accurate, and aligned with the nearby code.
Do not generate code.`

/**
 * 行注释补全指令
 */
export const LINE_COMMENT_INSTRUCTION = `Complete the current inline comment only.
Keep it brief and explain intent, not implementation details.
Do not generate code.`

/**
 * 低代码平台上下文增强 Prompt
 */
export const LOWCODE_CONTEXT_INSTRUCTION = `You are completing code inside a TinyEngine low-code page script.
Prefer the project symbols and runtime APIs listed below.
Use data sources via this.dataSourceMap.<name>.load().`

/**
 * 创建带低代码上下文的指令
 * @param {string} language - 编程语言
 * @param {Object} lowcodeContext - 低代码上下文数据
 * @returns {string} 增强的指令文本
 */
export function createLowcodeInstruction(language, lowcodeContext = {}) {
  const instruction = [createCodeInstruction(language), LOWCODE_CONTEXT_INSTRUCTION].join('\n')
  const facts = buildLowcodeFacts(lowcodeContext)

  return facts ? `${instruction}\n\n${facts}` : instruction
}

/**
 * 用户 Prompt 模板
 * @param {string} instruction - 指令文本
 * @param {string} fileContent - 文件内容（包含 [CURSOR] 标记）
 * @returns {string} 完整的用户 Prompt
 */
export function createUserPrompt(instruction, fileContent) {
  return `${instruction}

File content (cursor position marked with [CURSOR]):
${fileContent}

Complete the code/text at the [CURSOR] position. Return ONLY the completion text.`
}
