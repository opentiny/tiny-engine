import { utils } from '@opentiny/tiny-engine-utils'

const { obJectCssToString } = utils
export const generateStyleTag = (schema, config = {}) => {
  const { css } = schema
  const { scoped = true, lang = '' } = config

  let langDesc = ''
  let scopedStr = ''

  if (scoped) {
    scopedStr = 'scoped'
  }

  if (lang) {
    langDesc = `lang=${langDesc}`
  }
  const cssString = obJectCssToString(css)
  return `<style ${langDesc} ${scopedStr}> ${cssString || ''} </style>`
}
