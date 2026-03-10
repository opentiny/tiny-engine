/* metaService: engine.setting.styles.parser */

import postcss from 'postcss'

const handleRules = (node: any) => {
  const declarations = node.nodes || []
  const style = {}
  let selectors = node.selectors || ''
  let commentIndex = 0

  if (Array.isArray(selectors)) {
    selectors = selectors.join(',')
  }

  declarations.forEach(({ prop, value, important, type, text }) => {
    if (type === 'decl') {
      style[prop] = {
        type,
        value: `${value}${important ? '!important' : ''}`
      }
    } else if (type === 'comment') {
      style[`comment${commentIndex}`] = {
        type,
        value: `/*${text}*/`
      }
      commentIndex++
    }
  })

  return {
    selectors,
    style
  }
}

const handleAtRules = (node: any) => {
  // 这里我们不处理 at rules(如 @media、@keyframe 等规则), 直接转换成字符串
  const { source = {}, type } = node
  const { start, end, input } = source

  const rawString = input.css.slice(start.offset, end.offset)

  return {
    type,
    hasBlock: node.nodes !== undefined,
    style: {
      type,
      value: rawString
    }
  }
}

const handleComments = (node: { type: any; text: any }) => {
  const { type, text } = node

  return {
    type,
    style: {
      type,
      value: `/*${text}*/`
    }
  }
}

const nodeHandlerMap = {
  rule: handleRules,
  atrule: handleAtRules,
  comment: handleComments
}

/**
 * 将 css 字符串解析成 css 对象
 * @param {string} css css 字符串
 * @returns
 */
export const parser = (css: string) => {
  const parseList = []
  const selectors = []
  const styleObject = {}

  if (!css) {
    return {
      parseList,
      selectors,
      styleObject
    }
  }

  const ast = postcss().process(css).sync().root

  ast.nodes.forEach((node) => {
    const { type } = node
    const result = nodeHandlerMap[type](node)

    parseList.push(result)
  })

  parseList.forEach((item) => {
    if (!item.selectors) {
      return
    }

    // 不支持属性选择器，以及组合选择器
    if (/[,[\]>~+]/.test(item.selectors)) {
      return
    }

    let selector = item.selectors
    let mouseState = ''

    if (selector.includes(':')) {
      const [pureSelector, innerMouseState] = selector.split(':')
      // 仅支持部分伪类选择器
      if (!['hover', 'pressed', 'focused', 'disabled'].includes(innerMouseState)) {
        return
      }

      selector = pureSelector
      mouseState = innerMouseState
    }

    selectors.push(selector)

    styleObject[item.selectors] = {
      mouseState,
      pureSelector: selector
    }
    const rules = {}

    Object.entries(item.style).forEach(([key, value]) => {
      if (value.type !== 'decl') {
        return
      }
      rules[key] = value.value
    })

    styleObject[item.selectors].rules = rules
  })

  return {
    parseList,
    selectors,
    styleObject
  }
}

/**
 * 根据编辑器 css 内容生成对象，保留源码顺序并支持 at-rule
 * @param {string} content
 * @returns {Record<string, any>}
 */
export const buildCssObjectFromContent = (content: string) => {
  const { parseList, styleObject } = parser(content)
  const cssObject = {}

  // 保证存入 cssObject 的键值顺序与编辑器中的源码字符顺序一致
  parseList.forEach((item) => {
    // parser 中的 handleRules 没有给普通 rule 赋 type 属性，只具备 selectors 和 style
    if (!item.type && item.selectors) {
      if (styleObject[item.selectors]) {
        cssObject[item.selectors] = styleObject[item.selectors].rules
      }
    } else if (item.type === 'atrule') {
      const rawValue = item.style?.value || ''
      let key = ''
      let value = ''

      if (item.hasBlock) {
        const braceIdx = rawValue.indexOf('{')
        key = braceIdx !== -1 ? rawValue.slice(0, braceIdx).trim() : rawValue.trim()
        value = braceIdx !== -1 ? rawValue.slice(braceIdx).trim() : ''
      } else {
        key = rawValue.trim()
        value = ''
      }

      if (cssObject[key] !== undefined) {
        cssObject[key] = Array.isArray(cssObject[key]) ? [...cssObject[key], value] : [cssObject[key], value]
      } else {
        cssObject[key] = value
      }
    }
  })

  return cssObject
}

/**
 * 拿到组合选择器的数组，比如 .test1.test2 得到 ['.test1', '.test2']
 * @param {string} selector
 * @returns
 */
export const getSelectorArr = (selector: string) => {
  const res: string[] = []

  if (!selector || typeof selector !== 'string') {
    return res
  }

  const separator = ['.', '#']

  for (let i = 0; i < selector.length; i++) {
    let str = selector[i]

    i++

    while (!separator.includes(selector[i]) && i < selector.length) {
      str += selector[i]
      i++
    }

    res.push(str)

    i--
  }

  return res
}

// 根据配置替换选择器
const getFinalSelector = (config = {}) => {
  const { selectorStr, originSelector, newSelector } = config

  if (!originSelector || !newSelector) {
    return selectorStr
  }

  const { pureSelector, mouseState } = config

  const selectorArr = getSelectorArr(pureSelector)

  let finalSelector = selectorArr
    .map((item) => {
      if (item === originSelector) {
        return newSelector
      }

      return item
    })
    .join('')

  if (mouseState) {
    finalSelector += `:${mouseState}`
  }

  return finalSelector
}

/**
 * 序列化对象成 css 字符串
 * @param {any} originParseList 原解析对象
 * @param {any} styleObject 可能被编辑过的 styleobject
 * @param {any} config 配置，可以配置替换制定选择器
 * @returns string
 */
export const stringify = (originParseList: any, styleObject: any, config: any = {}) => {
  let str = ''
  const originSelectors: any[] = []
  // 配置需要替换的选择器
  const { originSelector, newSelector } = config

  originParseList.forEach((item) => {
    if (['comment', 'atrule'].includes(item.type) || !item.selectors) {
      str += `\n${item.style.value}\n`

      return
    }

    originSelectors.push(item.selectors)

    if (!styleObject[item.selectors]) {
      str += `${item.selectors} {\n`

      for (const [key, value] of Object.entries(item.style)) {
        if (key.includes('comment')) {
          str += `${value.value}\n`
        } else {
          str += `${key}: ${value.value === '' ? "''" : value.value};\n`
        }
      }
    } else {
      const { mouseState, pureSelector } = styleObject[item.selectors]
      const sel = getFinalSelector({
        selectorStr: item.selectors,
        originSelector,
        newSelector,
        pureSelector,
        mouseState
      })

      str += `${sel} {\n`

      // 在 styleObject  的，可能有改动，所以需要用 styleObject 拼接
      for (const [key, value] of Object.entries(styleObject[item.selectors].rules)) {
        if (![null, undefined].includes(value)) {
          str += `${key}: ${value === '' ? "''" : value};\n`
        }
      }
    }
    str += '}\n'
  })

  // 需要找出 styleObject 新增的选择器，然后写入到  str 中
  Object.entries(styleObject).forEach(([selector, value]) => {
    if (originSelectors.includes(selector)) {
      return
    }

    // 这里是新增的选择器，需要写入
    str += `${selector} {\n`

    for (const [declKey, declValue] of Object.entries(value.rules)) {
      str += `${declKey}: ${declValue === '' ? "''" : declValue};\n`
    }

    str += '}\n'
  })

  return str
}
