import { utils } from '@opentiny/tiny-engine-utils'

const { objectCssToString } = utils
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
  const cssString = objectCssToString(css)
  return `<style ${langDesc} ${scopedStr}> ${cssString || ''} </style>`
}
