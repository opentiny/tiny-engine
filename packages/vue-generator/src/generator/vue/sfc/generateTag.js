import { hyphenate } from '@vue/shared'

const HTML_DEFAULT_VOID_ELEMENTS = [
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
  const { isVoidElement, isStartTag = true, attribute, useHyphenate = true } = config

  if (typeof tagName !== 'string' || !tagName) {
    return ''
  }

  const isVoidEle =
    isVoidElement || (typeof isVoidElement !== 'boolean' && HTML_DEFAULT_VOID_ELEMENTS.includes(renderTagName))

  // 自闭合标签生成闭合标签时，返回空字符串
  if (!isStartTag && isVoidEle) {
    return ''
  }

  let renderTagName = tagName

  if (useHyphenate) {
    renderTagName = hyphenate(tagName)
  }

  if (isVoidEle) {
    return `<${renderTagName} />`
  }

  if (isStartTag) {
    return `<${renderTagName} ${attribute || ''}>`
  }

  return `</${renderTagName}>`
}
