const FACT_LIMITS = {
  ITEMS: 20,
  STORE_MEMBERS: 12,
  SCHEMA_KEYS: 16,
  HINT_TOKENS: 80
}

function limitList(items, max = FACT_LIMITS.ITEMS) {
  if (!Array.isArray(items)) {
    return []
  }

  return items.filter(Boolean).slice(0, max)
}

function buildHintContext(hintText = '') {
  if (typeof hintText !== 'string' || !hintText.trim()) {
    return {
      recentTokens: [],
      tokenSet: new Set(),
      currentToken: ''
    }
  }

  const identifiers = hintText.match(/[A-Za-z_$][\w$]*/g) || []
  const recentTokens = identifiers.slice(-FACT_LIMITS.HINT_TOKENS).map((token) => token.toLowerCase())
  const currentTokenMatch = hintText.match(/([A-Za-z_$][\w$]*)$/)

  return {
    recentTokens,
    tokenSet: new Set(recentTokens),
    currentToken: currentTokenMatch?.[1]?.toLowerCase() || ''
  }
}

function scoreByHint(item, hintContext, getLookupText) {
  if (!hintContext.recentTokens.length && !hintContext.currentToken) {
    return 0
  }

  const primaryName = String(item?.name || item?.id || '').toLowerCase()
  const lookupText = String(getLookupText(item) || primaryName).toLowerCase()
  let score = 0

  if (hintContext.currentToken) {
    if (primaryName.startsWith(hintContext.currentToken)) {
      score += 8
    } else if (lookupText.includes(hintContext.currentToken)) {
      score += 4
    }
  }

  if (primaryName && hintContext.tokenSet.has(primaryName)) {
    score += 6
  }

  for (const token of hintContext.recentTokens) {
    if (!token || token === hintContext.currentToken) {
      continue
    }

    if (primaryName && primaryName.startsWith(token)) {
      score += 3
      break
    }

    if (lookupText.includes(token)) {
      score += 1
    }
  }

  return score
}

function prioritizeItems(items, max = FACT_LIMITS.ITEMS, hintContext, getLookupText = () => '') {
  const filteredItems = Array.isArray(items) ? items.filter(Boolean) : []

  if (!filteredItems.length) {
    return {
      items: [],
      omitted: 0
    }
  }

  const rankedItems = filteredItems.map((item, index) => ({
    item,
    index,
    score: scoreByHint(item, hintContext, getLookupText)
  }))

  rankedItems.sort((left, right) => right.score - left.score || left.index - right.index)

  const selectedItems = rankedItems
    .slice(0, max)
    .sort((left, right) => left.index - right.index)
    .map((entry) => entry.item)

  return {
    items: selectedItems,
    omitted: Math.max(filteredItems.length - selectedItems.length, 0)
  }
}

function normalizeDescription(text) {
  return typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : ''
}

function getValueType(value) {
  if (Array.isArray(value)) {
    return 'array'
  }

  if (value === null) {
    return 'null'
  }

  return typeof value
}

/**
 * 格式化数据信息
 * @param {Array} dataSource - 数据源数组
 * @returns {Array} 格式化后的数据源
 */
function formatDataSources(dataSource, hintContext) {
  const candidates = dataSource
    .filter((ds) => ds?.name)
    .map((ds) => ({
      name: ds.name,
      type: ds.type || 'unknown',
      accessPath: `this.dataSourceMap.${ds.name}.load()`,
      description: normalizeDescription(ds.description || `Data source: ${ds.name}`)
    }))

  return prioritizeItems(candidates, FACT_LIMITS.ITEMS, hintContext, (item) =>
    [item.name, item.accessPath, item.description].filter(Boolean).join(' ')
  )
}

/**
 * 从函数代码中提取参数列表
 * @param {string} functionCode - 函数代码字符串
 * @returns {string} 参数列表
 */
function extractFunctionParams(functionCode) {
  if (!functionCode) return ''

  const funcMatch = functionCode.match(/function(?:\s+\w+)?\s*\(([^)]*)\)/)
  if (funcMatch) {
    return funcMatch[1].trim()
  }

  const arrowMatch = functionCode.match(/(?:\(([^)]*)\)|(\w+))\s*=>/)
  if (arrowMatch) {
    return (arrowMatch[1] || arrowMatch[2] || '').trim()
  }

  return ''
}

function createCallableAccess(prefix, name, functionCode) {
  const params = extractFunctionParams(functionCode)
  return `${prefix}${name}(${params})`
}

/**
 * 格式化工具类信息
 * @param {Array} utils - 工具类数组
 * @returns {Array} 格式化后的工具类
 */
function formatUtils(utils, hintContext) {
  const candidates = utils
    .filter((util) => util?.name)
    .map((util) => {
      const formatted = {
        name: util.name,
        type: util.type || 'function',
        accessPath: `this.utils.${util.name}`
      }

      if (util.type === 'npm' && util.content) {
        formatted.package = util.content.package
        formatted.description = `npm utility from ${util.content.package}`
      }

      if (util.type === 'function' && util.content?.type === 'JSFunction') {
        formatted.signature = createCallableAccess('this.utils.', util.name, util.content.value)
        formatted.description = `Utility function: ${util.name}`
      }

      return formatted
    })

  return prioritizeItems(candidates, FACT_LIMITS.ITEMS, hintContext, (item) =>
    [item.name, item.signature, item.accessPath, item.package, item.description].filter(Boolean).join(' ')
  )
}

/**
 * 格式化 bridge 信息
 * @param {Array} bridge - bridge 数组
 * @returns {Array} 格式化后的 bridge 信息
 */
function formatBridge(bridge, hintContext) {
  const candidates = bridge
    .filter((item) => item?.name)
    .map((item) => ({
      name: item.name,
      accessPath: `this.bridge.${item.name}`,
      description: normalizeDescription(item.description || `Bridge API: ${item.name}`)
    }))

  return prioritizeItems(candidates, FACT_LIMITS.ITEMS, hintContext, (item) =>
    [item.name, item.accessPath, item.description].filter(Boolean).join(' ')
  )
}

/**
 * 格式化全局状态信息
 * @param {Array} globalState - 全局状态数组
 * @returns {Array} 格式化后的全局状态
 */
function formatGlobalState(globalState, hintContext) {
  const candidates = globalState
    .filter((store) => store?.id)
    .map((store) => ({
      id: store.id,
      state: limitList(Object.keys(store.state || {}), FACT_LIMITS.STORE_MEMBERS),
      getters: limitList(Object.keys(store.getters || {}), FACT_LIMITS.STORE_MEMBERS),
      actions: limitList(Object.keys(store.actions || {}), FACT_LIMITS.STORE_MEMBERS),
      description: `Pinia store: ${store.id}`
    }))

  return prioritizeItems(candidates, FACT_LIMITS.ITEMS, hintContext, (item) =>
    [item.id, ...item.state, ...item.getters, ...item.actions].filter(Boolean).join(' ')
  )
}

/**
 * 格式化本地状态
 * @param {Object} state - 状态对象
 * @returns {Array} 格式化后的状态
 */
function formatState(state, hintContext) {
  const candidates = Object.entries(state).map(([key, value]) => ({
    name: key,
    accessPath: `this.state.${key}`,
    type: getValueType(value)
  }))

  return prioritizeItems(candidates, FACT_LIMITS.ITEMS, hintContext, (item) =>
    [item.name, item.accessPath, item.type].filter(Boolean).join(' ')
  )
}

/**
 * 格式化本地方法
 * @param {Object} methods - 方法对象
 * @returns {Array} 格式化后的方法
 */
function formatMethods(methods, hintContext) {
  const candidates = Object.entries(methods).map(([key, value]) => ({
    name: key,
    accessPath: `this.${key}`,
    signature: value?.type === 'JSFunction' ? createCallableAccess('this.', key, value.value) : `this.${key}()`,
    description: `Method: ${key}`
  }))

  return prioritizeItems(candidates, FACT_LIMITS.ITEMS, hintContext, (item) =>
    [item.name, item.signature, item.accessPath, item.description].filter(Boolean).join(' ')
  )
}

function prioritizeSchemaKeys(keys, max, hintContext) {
  const candidates = keys.map((name) => ({ name }))
  const { items, omitted } = prioritizeItems(candidates, max, hintContext, (item) => item.name)

  return {
    items: items.map((item) => item.name),
    omitted
  }
}

/**
 * 格式化当前组件 schema
 * @param {Object} schema - 组件 schema
 * @returns {Object|null} 格式化后的 schema
 */
function formatCurrentSchema(schema, hintContext) {
  if (!schema) {
    return {
      schema: null,
      truncated: {
        props: 0,
        events: 0,
        dynamicProps: 0
      }
    }
  }

  const formatted = {
    componentName: schema.componentName || 'Unknown',
    ...(schema.ref && { ref: schema.ref, refAccess: `this.$('${schema.ref}')` })
  }

  const truncated = {
    props: 0,
    events: 0,
    dynamicProps: 0
  }

  if (schema.props) {
    const propKeys = []
    const eventKeys = []
    const dynamicPropKeys = []

    for (const [key, value] of Object.entries(schema.props)) {
      if (key.startsWith('on')) {
        eventKeys.push(key)
      } else {
        propKeys.push(key)
      }

      if (value && (value.type === 'JSExpression' || value.type === 'JSFunction')) {
        dynamicPropKeys.push(key)
      }
    }

    const prioritizedProps = prioritizeSchemaKeys(propKeys, FACT_LIMITS.SCHEMA_KEYS, hintContext)
    const prioritizedEvents = prioritizeSchemaKeys(eventKeys, FACT_LIMITS.SCHEMA_KEYS, hintContext)
    const prioritizedDynamicProps = prioritizeSchemaKeys(dynamicPropKeys, FACT_LIMITS.SCHEMA_KEYS, hintContext)

    formatted.props = prioritizedProps.items
    formatted.events = prioritizedEvents.items
    formatted.dynamicProps = prioritizedDynamicProps.items

    truncated.props = prioritizedProps.omitted
    truncated.events = prioritizedEvents.omitted
    truncated.dynamicProps = prioritizedDynamicProps.omitted
  }

  return {
    schema: formatted,
    truncated
  }
}

/**
 * 从低代码平台元数据构建补全上下文
 * @param {Object} metadata - 低代码平台元数据
 * @returns {Object} 格式化的低代码上下文
 */
export function buildLowcodeContext(metadata, options = {}) {
  const {
    dataSource = [],
    utils = [],
    bridge = [],
    globalState = [],
    state = {},
    methods = {},
    currentSchema = null
  } = metadata
  const hintContext = buildHintContext(options.hintText)
  const formattedDataSource = formatDataSources(dataSource, hintContext)
  const formattedUtils = formatUtils(utils, hintContext)
  const formattedBridge = formatBridge(bridge, hintContext)
  const formattedGlobalState = formatGlobalState(globalState, hintContext)
  const formattedState = formatState(state, hintContext)
  const formattedMethods = formatMethods(methods, hintContext)
  const formattedSchema = formatCurrentSchema(currentSchema, hintContext)

  return {
    dataSource: formattedDataSource.items,
    utils: formattedUtils.items,
    bridge: formattedBridge.items,
    globalState: formattedGlobalState.items,
    state: formattedState.items,
    methods: formattedMethods.items,
    currentSchema: formattedSchema.schema,
    truncated: {
      dataSource: formattedDataSource.omitted,
      utils: formattedUtils.omitted,
      bridge: formattedBridge.omitted,
      globalState: formattedGlobalState.omitted,
      state: formattedState.omitted,
      methods: formattedMethods.omitted,
      currentSchema: formattedSchema.truncated
    }
  }
}
