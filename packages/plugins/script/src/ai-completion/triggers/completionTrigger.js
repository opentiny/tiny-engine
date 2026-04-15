import { getCommentState } from '../utils/contextAnalysis.js'

/**
 * 检测光标是否在语句结束符后（分号后）
 */
function isAfterStatementEnd(beforeCursor) {
  // 检查是否以分号结尾（忽略尾部空格）
  const trimmedEnd = beforeCursor.trimEnd()

  if (trimmedEnd.endsWith(';')) {
    // 排除 for 循环中的分号：for (let i = 0; i < 10; i++)
    // 检查是否在括号内
    const openParens = (beforeCursor.match(/\(/g) || []).length
    const closeParens = (beforeCursor.match(/\)/g) || []).length

    // 如果括号未闭合，说明可能在 for 循环中
    if (openParens > closeParens) {
      return false
    }

    return true
  }

  return false
}

/**
 * 检测光标是否在代码块结束符后（右花括号后）
 */
function isAfterBlockEnd(beforeCursor) {
  const trimmedEnd = beforeCursor.trimEnd()

  // 检查是否以右花括号结尾
  if (trimmedEnd.endsWith('}')) {
    // 检查后面是否只有空格（没有其他字符）
    const afterBrace = beforeCursor.substring(trimmedEnd.length)
    return afterBrace.trim().length === 0
  }

  return false
}

/**
 * 判断是否应该触发代码补全
 * @param {Object} params - 触发参数
 * @param {string} params.text - 完整文本
 * @param {Object} params.position - 光标位置
 * @param {number} params.position.lineNumber - 行号
 * @param {number} params.position.column - 列号
 * @returns {boolean} 是否触发补全
 */
export function shouldTriggerCompletion(params) {
  const { text, position } = params
  const lines = text.split('\n')
  const currentLine = lines[position.lineNumber - 1] || ''
  const beforeCursor = currentLine.substring(0, position.column - 1)
  const textBeforeCursor = `${lines.slice(0, position.lineNumber - 1).join('\n')}${
    position.lineNumber > 1 ? '\n' : ''
  }${beforeCursor}`
  const lexicalState = getCommentState(textBeforeCursor)

  // 1. 代码太短不触发
  if (text.trim().length < 2) {
    return false
  }

  // 2. 注释和字符串里不触发
  if (lexicalState.inComment || lexicalState.inString) {
    return false
  }

  // 3. 分号后不触发（语句已结束）
  if (isAfterStatementEnd(beforeCursor)) {
    return false
  }

  // 4. 右花括号后不触发（块已结束）
  if (isAfterBlockEnd(beforeCursor)) {
    return false
  }

  // 其他情况都允许触发
  return true
}
