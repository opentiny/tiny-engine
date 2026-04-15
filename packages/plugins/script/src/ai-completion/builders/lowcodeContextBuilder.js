const FACT_LIMITS = {
  ITEMS: 20,
  STORE_MEMBERS: 12,
  SCHEMA_KEYS: 16
}

function limitList(items, max = FACT_LIMITS.ITEMS) {
  if (!Array.isArray(items)) {
    return []
  }

  return items.filter(Boolean).slice(0, max)
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
function formatDataSources(dataSource) {
  return limitList(
    dataSource
      .filter((ds) => ds?.name)
      .map((ds) => ({
        name: ds.name,
        type: ds.type || 'unknown',
        accessPath: `this.dataSourceMap.${ds.name}.load()`,
        description: normalizeDescription(ds.description || `Data source: ${ds.name}`)
      }))
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
function formatUtils(utils) {
  return limitList(
    utils
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
  )
}

/**
 * 格式化 bridge 信息
 * @param {Array} bridge - bridge 数组
 * @returns {Array} 格式化后的 bridge 信息
 */
function formatBridge(bridge) {
  return limitList(
    bridge
      .filter((item) => item?.name)
      .map((item) => ({
        name: item.name,
        accessPath: `this.bridge.${item.name}`,
        description: normalizeDescription(item.description || `Bridge API: ${item.name}`)
      }))
  )
}

/**
 * 格式化全局状态信息
 * @param {Array} globalState - 全局状态数组
 * @returns {Array} 格式化后的全局状态
 */
function formatGlobalState(globalState) {
  return limitList(
    globalState
      .filter((store) => store?.id)
      .map((store) => ({
        id: store.id,
        state: limitList(Object.keys(store.state || {}), FACT_LIMITS.STORE_MEMBERS),
        getters: limitList(Object.keys(store.getters || {}), FACT_LIMITS.STORE_MEMBERS),
        actions: limitList(Object.keys(store.actions || {}), FACT_LIMITS.STORE_MEMBERS),
        description: `Pinia store: ${store.id}`
      }))
  )
}

/**
 * 格式化本地状态
 * @param {Object} state - 状态对象
 * @returns {Array} 格式化后的状态
 */
function formatState(state) {
  return limitList(
    Object.entries(state).map(([key, value]) => ({
      name: key,
      accessPath: `this.state.${key}`,
      type: getValueType(value)
    }))
  )
}

/**
 * 格式化本地方法
 * @param {Object} methods - 方法对象
 * @returns {Array} 格式化后的方法
 */
function formatMethods(methods) {
  return limitList(
    Object.entries(methods).map(([key, value]) => ({
      name: key,
      accessPath: `this.${key}`,
      signature: value?.type === 'JSFunction' ? createCallableAccess('this.', key, value.value) : `this.${key}()`,
      description: `Method: ${key}`
    }))
  )
}

/**
 * 格式化当前组件 schema
 * @param {Object} schema - 组件 schema
 * @returns {Object|null} 格式化后的 schema
 */
function formatCurrentSchema(schema) {
  if (!schema) return null

  const formatted = {
    componentName: schema.componentName || 'Unknown',
    ...(schema.ref && { ref: schema.ref, refAccess: `this.$('${schema.ref}')` })
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

    formatted.props = limitList(propKeys, FACT_LIMITS.SCHEMA_KEYS)
    formatted.events = limitList(eventKeys, FACT_LIMITS.SCHEMA_KEYS)
    formatted.dynamicProps = limitList(dynamicPropKeys, FACT_LIMITS.SCHEMA_KEYS)
  }

  return formatted
}

/**
 * 验证低代码上下文的完整性
 * @param {Object} context - 低代码上下文
 * @returns {{ valid: boolean, warnings: string[] }} 验证结果
 */
export function validateLowcodeContext(context) {
  const warnings = []

  if (!context) {
    return { valid: false, warnings: ['Context is null or undefined'] }
  }

  const requiredFields = ['dataSource', 'utils', 'bridge', 'globalState', 'state', 'methods']
  for (const field of requiredFields) {
    if (!(field in context)) {
      warnings.push(`Missing field: ${field}`)
    }
  }

  if (context.dataSource && !Array.isArray(context.dataSource)) {
    warnings.push('dataSource should be an array')
  }

  if (context.utils && !Array.isArray(context.utils)) {
    warnings.push('utils should be an array')
  }

  if (context.bridge && !Array.isArray(context.bridge)) {
    warnings.push('bridge should be an array')
  }

  if (context.globalState && !Array.isArray(context.globalState)) {
    warnings.push('globalState should be an array')
  }

  if (context.state && !Array.isArray(context.state)) {
    warnings.push('state should be an array')
  }

  if (context.methods && !Array.isArray(context.methods)) {
    warnings.push('methods should be an array')
  }

  return {
    valid: warnings.length === 0,
    warnings
  }
}

/**
 * 合并多个低代码上下文
 * @param {...Object} contexts - 多个上下文对象
 * @returns {Object} 合并后的上下文
 */
export function mergeLowcodeContexts(...contexts) {
  const merged = {
    dataSource: [],
    utils: [],
    bridge: [],
    globalState: [],
    state: [],
    methods: [],
    currentSchema: null
  }

  for (const context of contexts) {
    if (!context) continue

    if (context.dataSource) {
      merged.dataSource = [...merged.dataSource, ...context.dataSource]
    }
    if (context.utils) {
      merged.utils = [...merged.utils, ...context.utils]
    }
    if (context.bridge) {
      merged.bridge = [...merged.bridge, ...context.bridge]
    }
    if (context.globalState) {
      merged.globalState = [...merged.globalState, ...context.globalState]
    }
    if (context.state) {
      merged.state = [...merged.state, ...context.state]
    }
    if (context.methods) {
      merged.methods = [...merged.methods, ...context.methods]
    }
    if (context.currentSchema) {
      merged.currentSchema = context.currentSchema
    }
  }

  return merged
}

/**
 * 从低代码平台元数据构建补全上下文
 * @param {Object} metadata - 低代码平台元数据
 * @returns {Object} 格式化的低代码上下文
 */
export function buildLowcodeContext(metadata) {
  const {
    dataSource = [],
    utils = [],
    bridge = [],
    globalState = [],
    state = {},
    methods = {},
    currentSchema = null
  } = metadata

  return {
    dataSource: formatDataSources(dataSource),
    utils: formatUtils(utils),
    bridge: formatBridge(bridge),
    globalState: formatGlobalState(globalState),
    state: formatState(state),
    methods: formatMethods(methods),
    currentSchema: formatCurrentSchema(currentSchema)
  }
}
