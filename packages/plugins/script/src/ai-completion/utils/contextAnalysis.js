const CONTROL_KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'with'])

function maskChar(char) {
  return char === '\n' ? '\n' : ' '
}

export function getCommentState(text = '') {
  let inSingleQuote = false
  let inDoubleQuote = false
  let inTemplate = false
  let templateExpressionDepth = 0
  let inBlockComment = false
  let inLineComment = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false
      }
      continue
    }

    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false
        i++
      }
      continue
    }

    if (inSingleQuote) {
      if (char === '\\') {
        i++
      } else if (char === "'") {
        inSingleQuote = false
      }
      continue
    }

    if (inDoubleQuote) {
      if (char === '\\') {
        i++
      } else if (char === '"') {
        inDoubleQuote = false
      }
      continue
    }

    if (inTemplate && templateExpressionDepth === 0) {
      if (char === '\\') {
        i++
      } else if (char === '`') {
        inTemplate = false
      } else if (char === '$' && next === '{') {
        templateExpressionDepth = 1
        i++
      }
      continue
    }

    if (char === '/' && next === '/') {
      inLineComment = true
      i++
      continue
    }

    if (char === '/' && next === '*') {
      inBlockComment = true
      i++
      continue
    }

    if (char === "'") {
      inSingleQuote = true
      continue
    }

    if (char === '"') {
      inDoubleQuote = true
      continue
    }

    if (char === '`') {
      inTemplate = true
      continue
    }

    if (inTemplate && templateExpressionDepth > 0) {
      if (char === '{') {
        templateExpressionDepth++
      } else if (char === '}') {
        templateExpressionDepth--
      }
    }
  }

  const inTemplateString = inTemplate && templateExpressionDepth === 0

  return {
    inBlockComment,
    inLineComment,
    inComment: inBlockComment || inLineComment,
    inString: inSingleQuote || inDoubleQuote || inTemplateString,
    inTemplateString
  }
}

export function sanitizeStructuralText(text = '') {
  const sanitized = []
  let inSingleQuote = false
  let inDoubleQuote = false
  let inTemplate = false
  let templateExpressionDepth = 0
  let inBlockComment = false
  let inLineComment = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (inLineComment) {
      sanitized.push(maskChar(char))
      if (char === '\n') {
        inLineComment = false
      }
      continue
    }

    if (inBlockComment) {
      sanitized.push(maskChar(char))
      if (char === '*' && next === '/') {
        sanitized.push(maskChar(next))
        inBlockComment = false
        i++
      }
      continue
    }

    if (inSingleQuote) {
      sanitized.push(maskChar(char))
      if (char === '\\') {
        sanitized.push(maskChar(next))
        i++
      } else if (char === "'") {
        inSingleQuote = false
      }
      continue
    }

    if (inDoubleQuote) {
      sanitized.push(maskChar(char))
      if (char === '\\') {
        sanitized.push(maskChar(next))
        i++
      } else if (char === '"') {
        inDoubleQuote = false
      }
      continue
    }

    if (inTemplate && templateExpressionDepth === 0) {
      sanitized.push(maskChar(char))
      if (char === '\\') {
        sanitized.push(maskChar(next))
        i++
      } else if (char === '`') {
        inTemplate = false
      } else if (char === '$' && next === '{') {
        sanitized.push(maskChar(next))
        templateExpressionDepth = 1
        i++
      }
      continue
    }

    if (char === '/' && next === '/') {
      sanitized.push(maskChar(char))
      sanitized.push(maskChar(next))
      inLineComment = true
      i++
      continue
    }

    if (char === '/' && next === '*') {
      sanitized.push(maskChar(char))
      sanitized.push(maskChar(next))
      inBlockComment = true
      i++
      continue
    }

    if (char === "'") {
      sanitized.push(maskChar(char))
      inSingleQuote = true
      continue
    }

    if (char === '"') {
      sanitized.push(maskChar(char))
      inDoubleQuote = true
      continue
    }

    if (char === '`') {
      sanitized.push(maskChar(char))
      inTemplate = true
      continue
    }

    if (inTemplate && templateExpressionDepth > 0) {
      if (char === '{') {
        templateExpressionDepth++
        sanitized.push(char)
        continue
      }

      if (char === '}') {
        if (templateExpressionDepth === 1) {
          sanitized.push(maskChar(char))
        } else {
          sanitized.push(char)
        }
        templateExpressionDepth--
        continue
      }
    }

    sanitized.push(char)
  }

  return sanitized.join('')
}

function detectScopeFromHeader(header) {
  const trimmedHeader = header.trimEnd()

  const classMatch = trimmedHeader.match(/class\s+([A-Za-z_$][\w$]*)[^{]*$/)
  if (classMatch) {
    return {
      type: 'class',
      name: classMatch[1]
    }
  }

  const functionPatterns = [
    /function\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)[^{]*$/,
    /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>[^{]*$/,
    /(?:^|[\n;]\s*)(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*$/
  ]

  for (const pattern of functionPatterns) {
    const match = trimmedHeader.match(pattern)
    if (!match) {
      continue
    }

    const name = match[1]
    if (!name || CONTROL_KEYWORDS.has(name)) {
      continue
    }

    return {
      type: 'function',
      name
    }
  }

  return {
    type: 'other',
    name: ''
  }
}

export function getOpenScopeContext(text = '') {
  const sanitizedText = sanitizeStructuralText(text)
  const scopeStack = []

  for (let i = 0; i < sanitizedText.length; i++) {
    const char = sanitizedText[i]

    if (char === '{') {
      const header = sanitizedText.slice(Math.max(0, i - 200), i)
      const scope = detectScopeFromHeader(header)
      scopeStack.push(scope)
      continue
    }

    if (char === '}' && scopeStack.length > 0) {
      scopeStack.pop()
    }
  }

  const functionScope = [...scopeStack].reverse().find((scope) => scope.type === 'function')
  const classScope = [...scopeStack].reverse().find((scope) => scope.type === 'class')

  return {
    functionName: functionScope?.name || '',
    className: classScope?.name || ''
  }
}
