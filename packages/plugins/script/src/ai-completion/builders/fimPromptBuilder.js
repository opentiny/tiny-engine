import { FIM_CONFIG } from '../constants.js'
import {
  SYSTEM_BASE_PROMPT,
  createCodeInstruction,
  createLowcodeInstruction,
  BLOCK_COMMENT_INSTRUCTION,
  LINE_COMMENT_INSTRUCTION
} from '../prompts/templates.js'

/**
 * FIM (Fill-In-the-Middle) Prompt 构建器
 * 用于处理 FIM 格式的代码补全
 */
export class FIMPromptBuilder {
  constructor(config) {
    this.config = config
  }

  /**
   * 构建增强的 FIM 组件（包含完整指令）
   * @param {string} fileContent - 文件内容，包含 [CURSOR] 标记
   * @param {Object} metadata - 元数据（language, isComment, lowcodeContext 等）
   * @returns {{ prefix: string, suffix: string, cursorContext: Object }} FIM 组件
   */
  buildFIMComponents(fileContent, metadata = {}) {
    const { language = 'javascript', isComment = false, lowcodeContext = null } = metadata

    // 1. 查找光标位置
    const cursorIndex = fileContent.indexOf(FIM_CONFIG.MARKERS.CURSOR)

    if (cursorIndex === -1) {
      return {
        prefix: fileContent,
        suffix: '',
        cursorContext: { type: 'unknown', hasPrefix: true, hasSuffix: false }
      }
    }

    // 2. 分割前缀和后缀
    const rawPrefix = fileContent.substring(0, cursorIndex)
    const rawSuffix = fileContent.substring(cursorIndex + FIM_CONFIG.MARKERS.CURSOR.length)

    // 3. 分析光标上下文
    const cursorContext = this.analyzeCursorContext(rawPrefix, rawSuffix)

    // 4. 构建完整的指令前缀
    const instructionPrefix = this.buildInstructionPrefix(language, isComment, lowcodeContext, cursorContext)

    // 5. 优化前缀和后缀
    const optimizedPrefix = this.optimizePrefix(rawPrefix)
    const optimizedSuffix = this.optimizeSuffix(rawSuffix)

    // 6. 组合：指令 + 代码前缀
    const fullPrefix = instructionPrefix + optimizedPrefix

    return {
      prefix: fullPrefix,
      suffix: optimizedSuffix,
      cursorContext
    }
  }

  /**
   * 构建指令前缀（将 system prompt 和 instruction 转换为注释形式）
   * @param {string} language - 编程语言
   * @param {boolean} isComment - 是否在注释中
   * @param {Object} lowcodeContext - 低代码上下文
   * @param {Object} cursorContext - 光标上下文
   * @returns {string} 指令前缀
   */
  buildInstructionPrefix(language, isComment, lowcodeContext, cursorContext) {
    let instruction = ''

    // 1. 添加系统基础提示（转换为注释）
    instruction += '// ===== AI COMPLETION INSTRUCTIONS =====\n'
    instruction += this.convertToComments(SYSTEM_BASE_PROMPT)
    instruction += '//\n'

    // 2. 添加具体的补全指令
    let specificInstruction
    if (isComment) {
      // 注释补全
      specificInstruction = cursorContext.inBlockComment ? BLOCK_COMMENT_INSTRUCTION : LINE_COMMENT_INSTRUCTION
    } else if (lowcodeContext) {
      // 低代码补全
      specificInstruction = createLowcodeInstruction(language, lowcodeContext)
    } else {
      // 普通代码补全
      specificInstruction = createCodeInstruction(language)
    }

    instruction += this.convertToComments(specificInstruction)
    instruction += '//\n'
    instruction += '// ===== CODE CONTEXT STARTS BELOW =====\n'
    instruction += '\n'

    return instruction
  }

  /**
   * 将多行文本转换为注释格式
   * @param {string} text - 原始文本
   * @returns {string} 注释格式的文本
   */
  convertToComments(text) {
    return text
      .split('\n')
      .map((line) => (line.trim() ? `// ${line}` : '//'))
      .join('\n')
  }

  /**
   * 构建优化的 FIM (Fill In the Middle) Prompt（Qwen 格式）
   * @param {string} fileContent - 文件内容，包含 [CURSOR] 标记
   * @param {Object} metadata - 元数据
   * @returns {{ fimPrompt: string, cursorContext: Object }} FIM prompt 和上下文信息
   */
  buildOptimizedFIMPrompt(fileContent, metadata = {}) {
    const { prefix, suffix, cursorContext } = this.buildFIMComponents(fileContent, metadata)

    // 构建 Qwen FIM prompt
    let fimPrompt
    if (suffix.trim().length > 0) {
      // 有后缀：使用 prefix + suffix + middle 模式
      fimPrompt = `${FIM_CONFIG.MARKERS.PREFIX}${prefix}${FIM_CONFIG.MARKERS.SUFFIX}${suffix}${FIM_CONFIG.MARKERS.MIDDLE}`
    } else {
      // 无后缀：只使用 prefix + suffix 模式
      fimPrompt = `${FIM_CONFIG.MARKERS.PREFIX}${prefix}${FIM_CONFIG.MARKERS.SUFFIX}`
    }

    return { fimPrompt, cursorContext }
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
      inBlockComment: false,
      inLineComment: false,
      needsExpression: false,
      needsStatement: false
    }

    // 检测是否在注释中
    const lastBlockStart = prefix.lastIndexOf('/*')
    const lastBlockEnd = prefix.lastIndexOf('*/')
    if (lastBlockStart > lastBlockEnd) {
      context.inBlockComment = true
      context.type = 'block-comment'
      return context
    }

    const lastLineBreak = prefix.lastIndexOf('\n')
    const currentLine = prefix.substring(lastLineBreak + 1)
    if (currentLine.trim().startsWith('//')) {
      context.inLineComment = true
      context.type = 'line-comment'
      return context
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
