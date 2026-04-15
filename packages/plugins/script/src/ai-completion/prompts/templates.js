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

function appendOverflow(lines, omitted, label) {
  if (!omitted) {
    return lines
  }

  return [...lines, `...and ${omitted} more ${label} not shown`]
}

function buildLowcodeFacts(lowcodeContext = {}) {
  const {
    dataSource = [],
    utils = [],
    bridge = [],
    globalState = [],
    state = [],
    methods = [],
    currentSchema = null,
    truncated = {}
  } = lowcodeContext
  const schemaTruncated = truncated.currentSchema || {}

  const sections = [
    createSection('Platform APIs', [
      'this.props, this.emit, this.setState, this.route, this.history',
      'this.i18n, this.getLocale(), this.setLocale()',
      "this.$('refName') for component refs",
      'this.dataSourceMap.<name>.load() for data loading'
    ]),
    createSection(
      'Data sources',
      appendOverflow(
        dataSource.map((item) => formatFactWithDescription(item.accessPath, item.description, item.type)),
        truncated.dataSource,
        'data sources'
      )
    ),
    createSection(
      'Utilities',
      appendOverflow(
        utils.map((item) =>
          formatFactWithDescription(item.signature || item.accessPath, item.description, item.package)
        ),
        truncated.utils,
        'utilities'
      )
    ),
    createSection(
      'Bridge APIs',
      appendOverflow(
        bridge.map((item) => formatFactWithDescription(item.accessPath, item.description)),
        truncated.bridge,
        'bridge APIs'
      )
    ),
    createSection(
      'Global stores',
      appendOverflow(formatStoreFacts(globalState), truncated.globalState, 'global stores')
    ),
    createSection(
      'Local state',
      appendOverflow(
        state.map((item) => `${item.accessPath}: ${item.type}`),
        truncated.state,
        'local state fields'
      )
    ),
    createSection(
      'Local methods',
      appendOverflow(
        methods.map((item) => item.signature || `${item.accessPath}()`),
        truncated.methods,
        'local methods'
      )
    ),
    createSection(
      'Current component',
      appendOverflow(
        appendOverflow(
          appendOverflow(formatSchemaFacts(currentSchema), schemaTruncated.props, 'component props'),
          schemaTruncated.events,
          'component events'
        ),
        schemaTruncated.dynamicProps,
        'dynamic component props'
      )
    )
  ].filter(Boolean)

  return sections.join('\n\n')
}

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
