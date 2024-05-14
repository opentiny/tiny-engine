import postcss from 'postcss'

const handleRules = (node) => {
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

const handleAtRules = (node) => {
  // 这里我们不处理 at rules(如 @media、@keyframe 等规则), 直接转换成字符串
  const { source = {}, type } = node
  const { start, end, input } = source

  const rawString = input.css.slice(start.offset, end.offset)

  return {
    type,
    style: {
      type,
      value: rawString
    }
  }
}

const handleComments = (node) => {
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
export const parser = (css) => {
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
 * 拿到组合选择器的数组，比如 .test1.test2 得到 ['.test1', '.test2']
 * @param {string} selector
 * @returns
 */
export const getSelectorArr = (selector) => {
  const res = []

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
 * @param {object} originParseList 原解析对象
 * @param {object} styleObject 可能被编辑过的 styleobject
 * @param {object} config 配置，可以配置替换制定选择器
 * @returns string
 */
export const stringify = (originParseList, styleObject, config = {}) => {
  let str = ''
  const originSelectors = []
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
          str += `${key}: ${value.value};\n`
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
          str += `${key}: ${value};\n`
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
      str += `${declKey}: ${declValue};\n`
    }

    str += '}\n'
  })

  return str
}
