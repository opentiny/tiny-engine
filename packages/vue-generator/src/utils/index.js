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

import { capitalize, hyphenate } from '@vue/shared'
import { tinyIcon as unifyIconName } from '../pre-processor'
import { TINY_ICON, JS_FUNCTION } from '../constant'
import prettierConfig from '@opentiny/tiny-engine-controller/js/config-files/prettierrc'

const getTypeOfSchema = (schema) => schema.componentName

const getFunctionInfo = (fnStr) => {
  const fnRegexp = /(async)?.*?(\w+) *\(([\s\S]*?)\) *\{([\s\S]*)\}/
  const result = fnRegexp.exec(fnStr)
  if (result) {
    return {
      type: result[1] || '',
      name: result[2],
      params: result[3]
        .split(',')
        .map((item) => item.trim())
        .filter((item) => Boolean(item)),
      body: result[4]
    }
  }
  return null
}

const safeRandom = () => {
  const mathConstructor = Math

  return mathConstructor.random()
}

export const randomString = (length = 4, chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') => {
  let result = ''
  for (let i = length; i > 0; --i) {
    result += chars[Math.floor(safeRandom() * chars.length)]
  }
  return result
}

const avoidDuplicateString = (existings, str) => {
  let result = str
  let suffix = 1

  while (existings.includes(result)) {
    result = `${str}${suffix}`
    suffix++
  }

  return result
}

const lowerFirst = (str) => str[0].toLowerCase() + str.slice(1)

/**
 * 将输入字符串转换为 PascalCase 风格, 默认可转换 kebab-case/camelCase
 * @param {string} input 源字符串
 * @param {string} delimiter 定界符。默认使用连字符，以支持转换 kebab-case
 * @returns {string} PascalCase 风格的字符串
 */
const toPascalCase = (input, delimiter = '-') => input.split(delimiter).map(capitalize).join('')

const commonOpts = prettierConfig
const prettierOpts = {
  vue: { ...commonOpts, parser: 'vue', htmlWhitespaceSensitivity: 'ignore' },
  js: { ...commonOpts, parser: 'typescript' }
}

const onRE = /^on([A-Z]\w*)/
const onUpdateRE = /^on(Update:\w+)/
export const thisBindRe = /this\.(props\.)?/g
export const thisPropsBindRe = /this\.(props\.)?/g
export const thisRegexp = /this\./g

const isOn = (key) => onRE.test(key)
const isOnUpdate = (key) => onUpdateRE.test(key)

const toEventKey = (str) => {
  const strRemovedPrefix = str.replace(onRE, '$1')

  if (isOnUpdate(str)) {
    return lowerFirst(strRemovedPrefix)
  }

  return hyphenate(strRemovedPrefix)
}

export const isGetter = (accessor) => accessor?.getter?.type === JS_FUNCTION
export const isSetter = (accessor) => accessor?.setter?.type === JS_FUNCTION
export const hasAccessor = (accessor) => isGetter(accessor) || isSetter(accessor)

const addAccessorRecord = (accessor, record) => {
  if (isGetter(accessor)) {
    record.push(accessor.getter.value)
  }

  if (isSetter(accessor)) {
    record.push(accessor.setter.value)
  }
}

/**
 * TinyIcon 需要从方法返回图标组件，所以需要记录生成图标定义语句所需信息
 * @param {Object} description 记录中间产物的描述信息
 * @param {Object} description.iconComponents 记录定义图标组件所需属性，componentNames/exportNames 要保持对应关系
 * @param {string[]} description.iconComponents.componentNames 模板中的图标组件名集合
 * @param {string[]} description.iconComponents.exportNames 与 componentNames 对应的 TinyVue 组件库中图标组件名集合
 * @param {string} componentName 模板中的图标组件名，前缀为 TinyIcon
 */
const addIconRecord = (description, componentName) => {
  const { componentNames, exportNames } = description.iconComponents

  if (!componentNames.includes(componentName)) {
    const exportName = componentName.replace(TINY_ICON, 'icon')

    componentNames.push(componentName)
    exportNames.push(exportName)
  }
}

/**
 * 处理组件中的 icon 属性绑定
 * @param {Object} description 记录中间产物的描述信息
 * @param {Set} description.componentSet 记录 SFC 中的组件
 * @param {Object} iconProp icon 属性值描述
 * @returns {string} iconName 用于属性绑定的图标组件名，前缀为 TinyIcon
 */
const handleIconInProps = (description, iconProp) => {
  const { componentName: iconName } = unifyIconName(iconProp)

  description.componentSet.add(iconName)
  addIconRecord(description, iconName)

  return iconName
}

export {
  getTypeOfSchema,
  getFunctionInfo,
  safeRandom,
  avoidDuplicateString,
  lowerFirst,
  toPascalCase,
  prettierOpts,
  isOn,
  toEventKey,
  addAccessorRecord,
  addIconRecord,
  handleIconInProps
}
