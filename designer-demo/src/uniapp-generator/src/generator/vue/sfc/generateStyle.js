import { convertPxToRpx } from '../../../utils/styleUtils.js'

export const generateStyleTag = (schema, config = {}) => {
  const { css } = schema
  const { scoped = true, lang = '', convertPx = true } = config

  let langDesc = ''
  let scopedStr = ''

  if (scoped) {
    scopedStr = 'scoped'
  }

  if (lang) {
    langDesc = `lang=${langDesc}`
  }

  // 转换px为rpx
  const processedCss = convertPx ? convertPxToRpx(css) : css

  return `<style ${langDesc} ${scopedStr}> ${processedCss || ''} </style>`
}