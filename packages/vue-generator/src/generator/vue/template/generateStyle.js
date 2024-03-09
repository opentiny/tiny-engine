export const generateStyleTag = (schema) => {
  const { cssLang, css } = schema

  let langDesc = ''

  if (cssLang) {
    langDesc = `lang=${langDesc}`
  }

  return `<style ${langDesc} scoped> ${css} </style>`
}
