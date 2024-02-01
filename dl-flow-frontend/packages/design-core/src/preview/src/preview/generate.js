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

const generateDefaultExport = (data) =>
  data && typeof data === 'object' ? `export default ${JSON.stringify(data, null, 2)}`.trim() : 'export default {}'

const generateStores = (globalState) => {
  if (!Array.isArray(globalState)) {
    return 'export {}'
  }

  const result = ["import { defineStore } from 'pinia'\n"]

  const getStoreFunctionStrs = (getters = {}) =>
    Object.values(getters)
      .map(({ value }) => value?.replace(/function /, ''))
      .join(',\n')

  globalState.forEach(({ id, state, getters, actions }) => {
    const storeCode = `export const ${id} = defineStore({
  id: '${id}',
  state: () => (${JSON.stringify(state)}),
  getters: {
    ${getStoreFunctionStrs(getters)}
  },
  actions: {
    ${getStoreFunctionStrs(actions)}
  }
})`

    result.push(storeCode)
  })

  return result.join('\n')
}

const generateBridge = () => 'export default {}'

const checkIsValidFunString = (str) => {
  if (!str) {
    return false
  }
  try {
    const F = Function
    const func = new F(`return ${str}`)
    const type = Object.prototype.toString.call(func)

    return type === '[object Function]' || type === '[object AsyncFunction]'
  } catch (error) {
    return false
  }
}

function generateImportsByType({ item, imports, exportNames, functionStrs }) {
  if (item.type === 'npm') {
    const importFrom = `${item.content.package || ''}${item.content.main || ''}`

    if (importFrom) {
      imports[importFrom] = imports[importFrom] || {}
      const importItem = imports[importFrom]

      if (item.content.destructuring) {
        importItem.destructurings = importItem.destructurings || []
        importItem.destructurings.push(item.content.exportName)
        importItem.aliases = importItem.aliases || []
        importItem.aliases.push(item.name)
      } else {
        importItem.exportName = item.name
      }

      exportNames.push(item.name)
    }
  } else if (item.type === 'function' && checkIsValidFunString(item.content.value)) {
    functionStrs.push(`const ${item.name} = ${item.content.value}`)
    exportNames.push(item.name)
  }
}

function generateStrsFromImports({ imports, strs, functionStrs, exportNames }) {
  const importStrs = []

  Object.entries(imports).forEach(([key, value]) => {
    const list = []

    if (value.exportName) {
      list.push(value.exportName)
    }

    if (Array.isArray(value.destructurings) && value.destructurings.length) {
      const destructuringsWithAliases = value.destructurings.map((destructuring, index) => {
        const alias = value.aliases[index]
        if (destructuring === alias) {
          return destructuring
        }
        return `${destructuring} as ${alias}`
      })
      list.push(`{ ${destructuringsWithAliases.join(', ')} }`)
    }

    importStrs.push(`import ${list.join(', ')} from '${key}'`)
  })

  strs.push(...importStrs, ...functionStrs)

  if (exportNames.length) {
    strs.push(`export { ${exportNames.join(', ')} }`)
  }
}

const generateUtils = (list) => {
  const strs = []

  if (Array.isArray(list)) {
    const exportNames = []
    const functionStrs = []
    const imports = {}

    list.forEach((item) => {
      generateImportsByType({ item, imports, exportNames, functionStrs })
    })

    generateStrsFromImports({ imports, strs, functionStrs, exportNames })
  }

  return strs.join('\n')
}

/**
 * 处理css文件依赖
 * @param {*} code 源代码
 * @param {*} cssList css文件
 * @returns
 */
export const processAppJsCode = (code, cssList) => {
  return `${code}${cssList.map((css) => `addCss('${css}')`).join('\n')}`
}

export default (data) => {
  const locales = generateDefaultExport(data.i18n)
  const dataSource = generateDefaultExport(data.dataSource)
  const stores = generateStores(data.globalState)
  const bridge = generateBridge(data.bridge)
  const utils = generateUtils(data.utils)

  return {
    'locales.js': locales,
    'dataSource.js': dataSource,
    'stores.js': stores,
    'bridge.js': bridge,
    'utils.js': utils
  }
}
