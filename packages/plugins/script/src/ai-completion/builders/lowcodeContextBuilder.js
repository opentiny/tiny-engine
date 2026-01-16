/**
 * 格式化数据源信息
 * @param {Array} dataSource - 数据源数组
 * @returns {Array} 格式化后的数据源
 */
function formatDataSources(dataSource) {
  return dataSource.map((ds) => ({
    name: ds.name,
    type: ds.type || 'unknown',
    description: ds.description || `Data source: ${ds.name}`,
    // 只保留关键信息，避免上下文过大
    ...(ds.options && { options: ds.options })
  }))
}

/**
 * 从函数代码中提取函数签名
 * @param {string} functionCode - 函数代码字符串
 * @returns {string} 函数签名
 */
function extractFunctionSignature(functionCode) {
  if (!functionCode) return 'function()'

  // 匹配函数声明: function name(params)
  const funcMatch = functionCode.match(/function\s+(\w+)?\s*\(([^)]*)\)/)
  if (funcMatch) {
    const name = funcMatch[1] || 'anonymous'
    const params = funcMatch[2].trim()
    return `function ${name}(${params})`
  }

  // 匹配箭头函数: (params) => 或 params =>
  const arrowMatch = functionCode.match(/(?:\(([^)]*)\)|(\w+))\s*=>/)
  if (arrowMatch) {
    const params = arrowMatch[1] || arrowMatch[2] || ''
    return `(${params}) => {}`
  }

  return 'function()'
}

/**
 * 格式化工具类信息
 * @param {Array} utils - 工具类数组
 * @returns {Array} 格式化后的工具类
 */
function formatUtils(utils) {
  return utils.map((util) => {
    const formatted = {
      name: util.name,
      type: util.type || 'function'
    }

    // 处理 npm 类型的工具
    if (util.type === 'npm' && util.content) {
      formatted.package = util.content.package
      formatted.exportName = util.content.exportName
      formatted.destructuring = util.content.destructuring
      formatted.description = `Import from ${util.content.package}`
    }

    // 处理函数类型的工具
    if (util.type === 'function' && util.content) {
      if (util.content.type === 'JSFunction') {
        // 提取函数签名而不是完整实现
        const funcSignature = extractFunctionSignature(util.content.value)
        formatted.signature = funcSignature
        formatted.description = `Utility function: ${util.name}`
      }
    }

    return formatted
  })
}

/**
 * 格式化全局状态信息
 * @param {Array} globalState - 全局状态数组
 * @returns {Array} 格式化后的全局状态
 */
function formatGlobalState(globalState) {
  return globalState.map((store) => ({
    id: store.id,
    state: Object.keys(store.state || {}),
    getters: Object.keys(store.getters || {}),
    actions: Object.keys(store.actions || {}),
    description: `Pinia store: ${store.id}`
  }))
}

/**
 * 格式化本地状态
 * @param {Object} state - 状态对象
 * @returns {Object} 格式化后的状态
 */
function formatState(state) {
  // 只返回键名和类型信息，不返回实际值
  const formatted = {}
  for (const [key, value] of Object.entries(state)) {
    formatted[key] = {
      type: typeof value,
      isArray: Array.isArray(value),
      isObject: value !== null && typeof value === 'object' && !Array.isArray(value)
    }
  }
  return formatted
}

/**
 * 格式化本地方法
 * @param {Object} methods - 方法对象
 * @returns {Object} 格式化后的方法
 */
function formatMethods(methods) {
  const formatted = {}
  for (const [key, value] of Object.entries(methods)) {
    if (value && value.type === 'JSFunction') {
      formatted[key] = {
        signature: extractFunctionSignature(value.value),
        description: `Method: ${key}`
      }
    } else {
      formatted[key] = {
        type: typeof value,
        description: `Method: ${key}`
      }
    }
  }
  return formatted
}

/**
 * 格式化当前组件 schema
 * @param {Object} schema - 组件 schema
 * @returns {Object|null} 格式化后的 schema
 */
function formatCurrentSchema(schema) {
  if (!schema) return null

  const formatted = {
    componentName: schema.componentName,
    ...(schema.ref && { ref: schema.ref })
  }

  // 格式化 props
  if (schema.props) {
    formatted.props = {}
    for (const [key, value] of Object.entries(schema.props)) {
      // 识别事件处理器
      if (key.startsWith('on')) {
        formatted.props[key] = {
          type: 'event',
          isFunction: value && value.type === 'JSFunction'
        }
      } else {
        formatted.props[key] = {
          type: value && value.type ? value.type : 'static',
          isDynamic: value && (value.type === 'JSExpression' || value.type === 'JSFunction')
        }
      }
    }
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

  // 检查必要字段
  const requiredFields = ['dataSource', 'utils', 'globalState', 'state', 'methods']
  for (const field of requiredFields) {
    if (!(field in context)) {
      warnings.push(`Missing field: ${field}`)
    }
  }

  // 检查数据源格式
  if (context.dataSource && !Array.isArray(context.dataSource)) {
    warnings.push('dataSource should be an array')
  }

  // 检查工具类格式
  if (context.utils && !Array.isArray(context.utils)) {
    warnings.push('utils should be an array')
  }

  // 检查全局状态格式
  if (context.globalState && !Array.isArray(context.globalState)) {
    warnings.push('globalState should be an array')
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
    globalState: [],
    state: {},
    methods: {},
    currentSchema: null
  }

  for (const context of contexts) {
    if (!context) continue

    // 合并数组类型
    if (context.dataSource) {
      merged.dataSource = [...merged.dataSource, ...context.dataSource]
    }
    if (context.utils) {
      merged.utils = [...merged.utils, ...context.utils]
    }
    if (context.globalState) {
      merged.globalState = [...merged.globalState, ...context.globalState]
    }

    // 合并对象类型
    if (context.state) {
      merged.state = { ...merged.state, ...context.state }
    }
    if (context.methods) {
      merged.methods = { ...merged.methods, ...context.methods }
    }

    // currentSchema 使用最后一个非空值
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
  const { dataSource = [], utils = [], globalState = [], state = {}, methods = {}, currentSchema = null } = metadata

  return {
    dataSource: formatDataSources(dataSource),
    utils: formatUtils(utils),
    globalState: formatGlobalState(globalState),
    state: formatState(state),
    methods: formatMethods(methods),
    currentSchema: formatCurrentSchema(currentSchema)
  }
}
