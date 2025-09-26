/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

function addCss(href) {
  const link = document.createElement('link')
  link.setAttribute('rel', 'stylesheet')
  link.setAttribute('href', href)
  document.head.appendChild(link)
}
addCss('${VITE_CDN_DOMAIN}/@opentiny/vue-theme${versionDelimiter}3.20${fileDelimiter}/index.css')
addCss('${VITE_CDN_DOMAIN}/@opentiny/vue-theme-mobile${versionDelimiter}3.20${fileDelimiter}/index.css')

// tailwindcss function and directive 特性需要使用 <style type="text/tailwindcss"> 标签
// https://tailwindcss.com/docs/functions-and-directives
// vue-repl 默认是使用 style[css] 标签，我们需要将它转换为 <style type="text/tailwindcss"> 标签
// 并重新插入一遍使得 tailwindcss 识别并生效
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function enableTailwindCSS(tryCount = 0) {
  if (tryCount > 100) {
    return
  }

  while (!document.querySelectorAll('style[css]').length) {
    await new Promise((resolve) => setTimeout(resolve, 200))
    enableTailwindCSS(tryCount + 1)
    return
  }

  const allStyles = document.querySelectorAll('style[css]')
  allStyles.forEach((el) => {
    const content = el.innerHTML
    const attributes = {}
    Array.from(el.attributes).forEach((attr) => {
      attributes[attr.name] = attr.value
    })

    el.remove()

    attributes.type = 'text/tailwindcss'
    const attributeText = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ')

    document.head.insertAdjacentHTML('beforeend', `<style ${attributeText}>${content}</style>`)
  })
}
