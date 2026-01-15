import { FIM_CONFIG } from '../constants.js'

/**
 * FIM (Fill-In-the-Middle) Prompt 构建器
 * 用于处理 FIM 格式的代码补全
 */
export class FIMPromptBuilder {
  constructor(config) {
    this.config = config
  }

  /**
   * 构建优化的 FIM (Fill In the Middle) Prompt
   * @param {string} fileContent - 文件内容，包含 [CURSOR] 标记
   * @returns {{ fimPrompt: string, cursorContext: Object }} FIM prompt 和上下文信息
   */
  buildOptimizedFIMPrompt(fileContent) {
    // 1. 清理元信息注释
    let cleanedContent = this.cleanMetaInfo(fileContent)

    // 2. 查找光标位置
    const cursorIndex = cleanedContent.indexOf(FIM_CONFIG.MARKERS.CURSOR)

    if (cursorIndex === -1) {
      return {
        fimPrompt: `${FIM_CONFIG.MARKERS.PREFIX}${cleanedContent}${FIM_CONFIG.MARKERS.SUFFIX}`,
        cursorContext: { type: 'unknown', hasPrefix: true, hasSuffix: false }
      }
    }

    // 3. 分割前缀和后缀
    const prefix = cleanedContent.substring(0, cursorIndex)
    const suffix = cleanedContent.substring(cursorIndex + FIM_CONFIG.MARKERS.CURSOR.length)

    // 4. 分析光标上下文
    const cursorContext = this.analyzeCursorContext(prefix, suffix)

    // 5. 优化前缀和后缀
    const optimizedPrefix = this.optimizePrefix(prefix)
    const optimizedSuffix = this.optimizeSuffix(suffix)

    // 6. 构建 FIM prompt
    let fimPrompt
    if (optimizedSuffix.trim().length > 0) {
      // 有后缀：使用 prefix + suffix + middle 模式
      fimPrompt = `${FIM_CONFIG.MARKERS.PREFIX}${optimizedPrefix}${FIM_CONFIG.MARKERS.SUFFIX}${optimizedSuffix}${FIM_CONFIG.MARKERS.MIDDLE}`
    } else {
      // 无后缀：只使用 prefix + suffix 模式
      fimPrompt = `${FIM_CONFIG.MARKERS.PREFIX}${optimizedPrefix}${FIM_CONFIG.MARKERS.SUFFIX}`
    }

    return { fimPrompt, cursorContext }
  }

  /**
   * 清理元信息注释
   * @param {string} content - 原始内容
   * @returns {string} 清理后的内容
   */
  cleanMetaInfo(content) {
    return content.replace(FIM_CONFIG.META_INFO_PATTERN, '')
  }

  /**
   * 分析光标上下文
   * @param {string} prefix - 前缀代码
   * @param {string} suffix - 后缀代码
   * @returns {Object} 上下文信息
   */
  analyzeCursorContext(prefix, suffix) {
    const context = {
      type: 'unknown',
      hasPrefix: prefix.trim().length > 0,
      hasSuffix: suffix.trim().length > 0,
      inFunction: false,
      inClass: false,
      inObject: false,
      inArray: false,
      needsExpression: false,
      needsStatement: false
    }

    // 分析前缀最后几个字符
    const prefixTrimmed = prefix.trimEnd()

    // 检测是否在表达式中
    if (/[=+\-*/%<>!&|,([]$/.test(prefixTrimmed)) {
      context.needsExpression = true
      context.type = 'expression'
    }
    // 检测是否在语句开始
    else if (/[{;]\s*$/.test(prefixTrimmed) || prefixTrimmed.length === 0) {
      context.needsStatement = true
      context.type = 'statement'
    }
    // 检测是否在对象字面量中
    else if (/{\s*$/.test(prefixTrimmed) || /,\s*$/.test(prefixTrimmed)) {
      context.inObject = true
      context.type = 'object-property'
    }

    // 检测作用域
    const functionMatch = prefix.match(/function\s+\w+|const\s+\w+\s*=.*=>|async\s+function/g)
    const classMatch = prefix.match(/class\s+\w+/g)

    context.inFunction = functionMatch && functionMatch.length > 0
    context.inClass = classMatch && classMatch.length > 0

    return context
  }

  /**
   * 优化前缀（限制上下文长度）
   * @param {string} prefix - 原始前缀
   * @returns {string} 优化后的前缀
   */
  optimizePrefix(prefix) {
    const MAX_PREFIX_LINES = this.config.FIM.MAX_PREFIX_LINES
    const lines = prefix.split('\n')

    if (lines.length <= MAX_PREFIX_LINES) {
      return prefix
    }

    // 保留最后 N 行
    return lines.slice(-MAX_PREFIX_LINES).join('\n')
  }

  /**
   * 优化后缀（限制上下文长度 + 智能截断）
   * @param {string} suffix - 原始后缀
   * @returns {string} 优化后的后缀
   */
  optimizeSuffix(suffix) {
    const MAX_SUFFIX_LINES = this.config.FIM.MAX_SUFFIX_LINES
    const lines = suffix.split('\n')

    // 智能截断：找到下一个函数/类定义的位置
    let cutoffIndex = lines.length
    for (let i = 0; i < Math.min(lines.length, MAX_SUFFIX_LINES); i++) {
      const line = lines[i].trim()

      // 遇到新的函数/类定义，在此处截断
      if (
        line.startsWith('function ') ||
        line.startsWith('class ') ||
        (line.startsWith('const ') && line.includes('=>')) ||
        line.startsWith('export ') ||
        line.startsWith('import ')
      ) {
        cutoffIndex = i
        break
      }

      // 遇到闭合的大括号（可能是当前函数/对象的结束）
      if (line === '}' || line === '};') {
        cutoffIndex = i + 1 // 包含这个闭合括号
        break
      }
    }

    // 取较小值：要么是智能截断位置，要么是最大行数
    const finalLines = Math.min(cutoffIndex, MAX_SUFFIX_LINES)

    if (lines.length <= finalLines) {
      return suffix
    }

    // 保留前 N 行
    return lines.slice(0, finalLines).join('\n')
  }
}
