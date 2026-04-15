import { buildLowcodeContext } from './lowcodeContextBuilder.js'
import { getCommentState, getOpenScopeContext } from '../utils/contextAnalysis.js'

/**
 * 检测光标是否在注释中
 * @param {string} textBeforeCursor - 光标前的文本
 * @returns {{ isComment: boolean, type: string | null }} 注释状态
 */
function isInComment(textBeforeCursor) {
  const commentState = getCommentState(textBeforeCursor)

  if (commentState.inLineComment) {
    return { isComment: true, type: 'line' }
  }

  if (commentState.inBlockComment) {
    return { isComment: true, type: 'block' }
  }

  return { isComment: false, type: null }
}

/**
 * 提取当前代码上下文信息（函数名、类名）
 * @param {string} textBeforeCursor - 光标前的文本
 * @returns {{ functionName: string, className: string }} 代码上下文
 */
function extractCodeContext(textBeforeCursor) {
  const openScope = getOpenScopeContext(textBeforeCursor)

  return {
    functionName: openScope.functionName,
    className: openScope.className
  }
}

/**
 * 构建元信息注释
 * @param {Object} codeContext - 代码上下文
 * @returns {string} 元信息字符串
 */
function buildMetaInfo(codeContext) {
  const metaLines = []

  if (codeContext.className) {
    metaLines.push(`// Current Class: ${codeContext.className}`)
  }

  if (codeContext.functionName) {
    metaLines.push(`// Current Function: ${codeContext.functionName}`)
  }

  return metaLines.length ? `${metaLines.join('\n')}\n\n` : ''
}

/**
 * 创建智能 Prompt，根据上下文优化补全
 * @param {Object} completionMetadata - 补全元数据
 * @returns {{ fileContent: string, commentStatus: object, lowcodeContext: object | null }} Prompt 对象
 */
export function createSmartPrompt(completionMetadata) {
  const { textBeforeCursor = '', textAfterCursor = '', lowcodeMetadata = null } = completionMetadata

  const commentStatus = isInComment(textBeforeCursor)
  const codeContext = extractCodeContext(textBeforeCursor)
  let lowcodeContext = null

  // 用极少量上下文注释提醒当前开放作用域，避免重复注入过多控制信息
  const metaInfo = buildMetaInfo(codeContext)

  if (lowcodeMetadata) {
    lowcodeContext = buildLowcodeContext(lowcodeMetadata, {
      hintText: textBeforeCursor
    })
  }

  // 在文件内容前注入元信息
  const fileContent = `${metaInfo}${textBeforeCursor}[CURSOR]${textAfterCursor}`

  return {
    fileContent,
    commentStatus,
    lowcodeContext
  }
}
