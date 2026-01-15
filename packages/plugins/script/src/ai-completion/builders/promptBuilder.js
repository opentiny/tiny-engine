import { CODE_PATTERNS, CONTEXT_CONFIG } from '../constants.js'
import {
  createCodeInstruction,
  createLowcodeInstruction,
  BLOCK_COMMENT_INSTRUCTION,
  LINE_COMMENT_INSTRUCTION
} from '../prompts/templates.js'
import { buildLowcodeContext, validateLowcodeContext } from './lowcodeContextBuilder.js'

/**
 * 检测光标是否在注释中
 * @param {string} textBeforeCursor - 光标前的文本
 * @returns {{ isComment: boolean, type: string | null }} 注释状态
 */
function isInComment(textBeforeCursor) {
  const trimmed = textBeforeCursor.trim()

  // 单行注释 //
  if (trimmed.includes('//')) {
    const lastLineBreak = textBeforeCursor.lastIndexOf('\n')
    const currentLine = textBeforeCursor.substring(lastLineBreak + 1)
    if (currentLine.trim().startsWith('//')) {
      return { isComment: true, type: 'line' }
    }
  }

  // 块注释 /* */ 或 JSDoc /** */
  const lastBlockStart = textBeforeCursor.lastIndexOf('/*')
  const lastBlockEnd = textBeforeCursor.lastIndexOf('*/')
  if (lastBlockStart > lastBlockEnd) {
    return { isComment: true, type: 'block' }
  }

  return { isComment: false, type: null }
}

/**
 * 提取当前代码上下文信息（函数名、类名、接口名等）
 * @param {string} textBeforeCursor - 光标前的文本
 * @returns {{ functionName: string, className: string, interfaceName: string, typeName: string }} 代码上下文
 */
function extractCodeContext(textBeforeCursor) {
  const lines = textBeforeCursor.split('\n')
  let functionName = ''
  let className = ''
  let interfaceName = ''
  let typeName = ''

  // 从后往前查找最近的定义
  const startLine = Math.max(0, lines.length - CONTEXT_CONFIG.MAX_LINES_TO_SCAN)

  for (let i = lines.length - 1; i >= startLine; i--) {
    const line = lines[i]

    if (!functionName) {
      const funcMatch = line.match(CODE_PATTERNS.FUNCTION)
      if (funcMatch) functionName = funcMatch[1] || funcMatch[2] || funcMatch[3]
    }

    if (!className) {
      const classMatch = line.match(CODE_PATTERNS.CLASS)
      if (classMatch) className = classMatch[1]
    }

    if (!interfaceName) {
      const interfaceMatch = line.match(CODE_PATTERNS.INTERFACE)
      if (interfaceMatch) interfaceName = interfaceMatch[1]
    }

    if (!typeName) {
      const typeMatch = line.match(CODE_PATTERNS.TYPE)
      if (typeMatch) typeName = typeMatch[1]
    }

    // 找到所有信息后提前退出
    if (functionName && className && interfaceName && typeName) break
  }

  return { functionName, className, interfaceName, typeName }
}

/**
 * 构建元信息注释
 * @param {string} filename - 文件名
 * @param {string} language - 语言类型
 * @param {Object} codeContext - 代码上下文
 * @param {string[]} technologies - 技术栈
 * @returns {string} 元信息字符串
 */
function buildMetaInfo(filename, language, codeContext, technologies) {
  let metaInfo = ''

  if (filename) {
    metaInfo += `// File: ${filename}\n`
  }

  metaInfo += `// Language: ${language}\n`

  // 强调当前作用域
  if (codeContext.className) {
    metaInfo += `// Current Class: ${codeContext.className}\n`
    metaInfo += `// IMPORTANT: Only complete code within this class\n`
  }

  if (codeContext.interfaceName) {
    metaInfo += `// Current Interface: ${codeContext.interfaceName}\n`
  }

  if (codeContext.typeName) {
    metaInfo += `// Current Type: ${codeContext.typeName}\n`
  }

  if (codeContext.functionName) {
    metaInfo += `// Current Function: ${codeContext.functionName}\n`
    metaInfo += `// IMPORTANT: Only complete code within this function scope\n`
  }

  if (technologies.length > 0) {
    metaInfo += `// Technologies: ${technologies.join(', ')}\n`
  }

  metaInfo += `// NOTE: Do not reference variables or code from other functions\n`
  metaInfo += '\n'

  return metaInfo
}

/**
 * 构建基础上下文
 * @param {string} language - 语言类型
 * @param {string} filename - 文件名
 * @returns {string} 上下文字符串
 */
function buildContext(language, filename) {
  let context = `You are an expert ${language} developer with deep knowledge of modern best practices.`

  if (filename) {
    context += ` Currently editing: ${filename}`
  }

  return context
}

/**
 * 构建注释补全指令
 * @param {string} commentType - 注释类型 ('line' | 'block')
 * @returns {string} 指令文本
 */
function buildCommentInstruction(commentType) {
  return commentType === 'block' ? BLOCK_COMMENT_INSTRUCTION : LINE_COMMENT_INSTRUCTION
}

/**
 * 创建智能 Prompt，根据上下文优化补全
 * @param {Object} completionMetadata - 补全元数据
 * @returns {{ context: string, instruction: string, fileContent: string }} Prompt 对象
 */
export function createSmartPrompt(completionMetadata) {
  const {
    textBeforeCursor = '',
    textAfterCursor = '',
    language = 'javascript',
    filename,
    technologies = [],
    lowcodeMetadata = null
  } = completionMetadata

  const commentStatus = isInComment(textBeforeCursor)
  const codeContext = extractCodeContext(textBeforeCursor)

  // 构建文件元信息（伪装成注释，让 AI 理解上下文）
  const metaInfo = buildMetaInfo(filename, language, codeContext, technologies)

  // 基础上下文
  const context = buildContext(language, filename)

  // 根据是否在注释中使用不同的 instruction
  let instruction
  if (commentStatus.isComment) {
    instruction = buildCommentInstruction(commentStatus.type)
  } else if (lowcodeMetadata) {
    // 如果提供了低代码元数据，使用增强的指令
    const lowcodeContext = buildLowcodeContext(lowcodeMetadata)
    const validation = validateLowcodeContext(lowcodeContext)

    if (!validation.valid) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Lowcode context validation warnings:', validation.warnings)
    }

    instruction = createLowcodeInstruction(language, lowcodeContext)
  } else {
    instruction = createCodeInstruction(language)
  }

  // 在文件内容前注入元信息
  const fileContent = `${metaInfo}${textBeforeCursor}[CURSOR]${textAfterCursor}`

  return {
    context,
    instruction,
    fileContent
  }
}
