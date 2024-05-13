import { hyphenate } from '@vue/shared'

export const HTML_DEFAULT_VOID_ELEMENTS = [
  'img',
  'input',
  'br',
  'hr',
  'link',
  'area',
  'base',
  'col',
  'embed',
  'meta',
  'source',
  'track',
  'wbr'
]

export const generateTag = (tagName, config = {}) => {
  const { isVoidElement, isStartTag = true, attribute, isJSX = false, useHyphenate = !isJSX } = config

  if (typeof tagName !== 'string' || !tagName) {
    return ''
  }

  let renderTagName = tagName

  const isVoidEle =
    isVoidElement || (typeof isVoidElement !== 'boolean' && HTML_DEFAULT_VOID_ELEMENTS.includes(renderTagName))

  // 自闭合标签生成闭合标签时，返回空字符串
  if (!isStartTag && isVoidEle) {
    return ''
  }

  if (useHyphenate) {
    renderTagName = hyphenate(tagName)
  }

  if (isVoidEle) {
    return `<${renderTagName} ${attribute || ''}/>`
  }

  if (isStartTag) {
    return `<${renderTagName} ${attribute || ''}>`
  }

  return `</${renderTagName}>`
}
