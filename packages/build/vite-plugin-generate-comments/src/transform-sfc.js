/**
 * Copyright (c) 2024 - present TinyEngine Authors.
 * Copyright (c) 2024 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */
import { parse } from '@vue/compiler-sfc' //vue 处理sfc 的专用库
import { transform } from './transform.js'
import { isCallEntryFile } from './utils.js'

const getAttrsString = (attrs) => {
  let attrStr = ''
  if (!attrs) {
    return attrStr
  }

  Object.keys(attrs).forEach((key) => {
    const val = attrs[key]
    if (val === true) {
      attrStr += ` ${key}`
    } else {
      attrStr += ` ${key}="${val}"`
    }
  })
  return attrStr
}
const generateTagContent = (tagDescriptor) => {
  if (!tagDescriptor) {
    return ''
  }
  const { attrs, content, type } = tagDescriptor
  return `<${type}${getAttrsString(attrs)}>${content}</${type}>`
}

export const generateSFC = (descriptor) => {
  const { script, scriptSetup, styles = [], template } = descriptor
  return `${generateTagContent(template)}
${generateTagContent(script)}
${generateTagContent(scriptSetup)}
${styles.map(generateTagContent).join('\n')}
`
}

export const transformSFC = (code, id) => {
  const { descriptor } = parse(code)
  const { script, scriptSetup } = descriptor
  if (!isCallEntryFile(code) || (!script && !scriptSetup)) {
    return
  }
  if (script) {
    script.content = transform(script.content, id) || script.content
  }
  if (scriptSetup) {
    scriptSetup.content = transform(scriptSetup.content, id) || scriptSetup.content
  }
  return generateSFC(descriptor)
}
