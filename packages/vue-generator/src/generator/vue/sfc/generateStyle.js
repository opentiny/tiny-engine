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

  return `<style ${langDesc} ${scopedStr}> ${css} </style>`
}
