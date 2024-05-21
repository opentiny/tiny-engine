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

import { compile } from 'vue/dist/vue.esm-bundler.js'
import { templateHashMap } from './common'

const generateTemplate = (template) => {
  const templateString = template.trim()
  if (templateString.startsWith('<template>') && templateString.endsWith('</template>')) {
    return templateString.slice(10, -11)
  }
  return templateString
}

export const useCompile = ({ component, metaData }) => {
  // 此处compile会缓存template对应的render函数，并且render函数一个纯函数（用到的所有变量都来自参数）
  const customTem = templateHashMap[metaData.id]
  if (customTem) {
    const template = generateTemplate(customTem)
    component.render = compile(template)
  }

  return component
}
