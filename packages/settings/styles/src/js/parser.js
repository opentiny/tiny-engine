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
    // 这里我们不处理 at rules, 直接转换成字符串
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

    // comment 需要存起来

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
 * 
 */
export const parser = (css) => {
    const parseList = []
    const selectors = []
    const styleObject = {}

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
            if(!['hover', 'pressed', 'focused', 'disabled'].includes(innerMouseState)) {
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


export const stringify = (originParseList, styleObject) => {
    let str = ''
    const originSelectors = []

    originParseList.forEach((item) => {
        if (['comment', 'atrule'].includes(item.type) || !item.selectors) {
            str += `\n${item.style.value}\n`

            return
        }

        originSelectors.push(item.selectors)

        str += `${item.selectors} {\n`

        if (!styleObject[item.selectors]) {
            for (const [key, value] of Object.entries(item.style)) {
                if (key.includes('comment')) {
                    str += `${value.value}\n`
                } else {
                    str += `${key}: ${value.value};\n`
                }
            }
        } else {
            // 在 styleObject  的，可能有改动，所以需要用 styleObject 拼接
            for (const [key, value] of Object.entries(styleObject[item.selectors].rules)) { 
                str += `${key}: ${value};\n`
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
