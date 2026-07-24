export function parseStyle(style: string, options: any = {}) {
  if (!style || !style.trim()) {
    return { css: '', scoped: false, lang: 'css' }
  }
  return { css: style.trim(), scoped: options.scoped || false, lang: options.lang || 'css' }
}

function parseDeclarations(declarations: string) {
  const result: Record<string, string> = {}
  if (!declarations) return result
  const declarationList = declarations.split(';').filter((d) => d.trim())
  declarationList.forEach((declaration) => {
    const colonIndex = declaration.indexOf(':')
    if (colonIndex > 0) {
      const property = declaration.substring(0, colonIndex).trim()
      const value = declaration.substring(colonIndex + 1).trim()
      result[property] = value
    }
  })
  return result
}

export function parseCSSRules(css: string) {
  if (!css || !css.trim()) return [] as any[]
  const rules: any[] = []
  const ruleMatches = css.match(/([^{}]+)\s*{([^{}]*)}/g)
  if (ruleMatches) {
    ruleMatches.forEach((ruleMatch) => {
      const match = ruleMatch.match(/([^{}]+)\s*{([^{}]*)}/)
      if (match) {
        const selector = match[1].trim()
        const declarations = match[2].trim()
        rules.push({ selector, declarations: parseDeclarations(declarations) })
      }
    })
  }
  return rules
}

export function extractCSSVariables(css: string) {
  const variables: Record<string, string> = {}
  if (!css) return variables
  const variableMatches = css.match(/--[\w-]+\s*:\s*[^;]+/g)
  if (variableMatches) {
    variableMatches.forEach((match) => {
      const colonIndex = match.indexOf(':')
      if (colonIndex > 0) {
        const name = match.substring(0, colonIndex).trim()
        const value = match.substring(colonIndex + 1).trim()
        variables[name] = value
      }
    })
  }
  return variables
}

export function hasMediaQueries(css: string) {
  if (!css) return false
  return /@media\s+/.test(css)
}

export function extractMediaQueries(css: string) {
  const mediaQueries: any[] = []
  if (!css) return mediaQueries
  const mediaMatches = css.match(/@media[^{]+\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g)
  if (mediaMatches) {
    mediaMatches.forEach((match) => {
      const conditionMatch = match.match(/@media\s+([^{]+)/)
      if (conditionMatch) {
        const condition = conditionMatch[1].trim()
        const content = match.substring(match.indexOf('{') + 1, match.lastIndexOf('}')).trim()
        mediaQueries.push({ condition, content, rules: parseCSSRules(content) })
      }
    })
  }
  return mediaQueries
}
