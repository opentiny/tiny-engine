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

import prettier from 'prettier'
import parserHtml from 'prettier/parser-html'
import parseCss from 'prettier/parser-postcss'
import parserBabel from 'prettier/parser-babel'
import prettierCommon from '@opentiny/tiny-engine-controller/js/config-files/prettierrc'

// LOWCODE_TODO: 从本地配置文件获取
const basePaths = {
  i18n: 'src/i18n/',
  pages: 'src/views/',
  blocks: 'src/components/',
  utils: 'src/lowcode/utils.js',
  dataSource: 'src/lowcode/dataSource.json',
  router: 'src/router/index.js',
  store: 'src/stores/'
}

const FILE_TYPES = {
  Page: 'Page',
  Block: 'Block',
  I18n: 'I18n',
  Utils: 'Utils',
  DataSource: 'DataSource',
  Router: 'Router',
  Store: 'Store'
}

function formatScript(string) {
  return prettier.format(string, {
    ...prettierCommon,
    parser: 'babel',
    plugins: [parserBabel]
  })
}

function getPaths(page, pagesMap) {
  if (!page) return ''
  const parentArr = []
  let cur = page
  let parentId = `${cur.parentId}`
  while (parentId && pagesMap[parentId]) {
    parentArr.unshift(pagesMap[parentId].route)
    cur = pagesMap[parentId]
    parentId = `${cur.parentId}`
  }

  return parentArr.length ? parentArr.join('/') + '/' : ''
}

function getCurrentPagePath(params, pages = []) {
  if (!pages.length) {
    return ''
  }

  const pagesMap = pages.reduce((acc, cur) => ({ ...acc, [`${cur.id}`]: cur }), {})
  const curPage = pages.find((page) => page.id === params.id)

  return getPaths(curPage, pagesMap)
}

function generateStores({ globalState }) {
  if (!Array.isArray(globalState)) {
    return []
  }

  const filePath = basePaths.store
  const result = "import { defineStore } from 'pinia'\n\n"

  const res = []
  const storeIds = []

  const getStoreFnStrs = (getters = {}) =>
    Object.values(getters)
      .map(({ value }) => value?.replace(/function /, ''))
      .join(',\n')

  globalState.forEach(({ id, state, getters, actions }) => {
    storeIds.push(id)
    const storeCode = `export const ${id} = defineStore({
  id: '${id}',
  state: () => (${JSON.stringify(state)}),
  getters: {
    ${getStoreFnStrs(getters)}
  },
  actions: {
    ${getStoreFnStrs(actions)}
  }
})\n`

    res.push({
      filePath: `${filePath}${id}.js`,
      fileType: FILE_TYPES.Store,
      fileContent: formatScript(`${result}\n${storeCode}`)
    })
  })

  res.push({
    filePath: `${filePath}index.js`,
    fileType: FILE_TYPES.Store,
    fileContent: formatScript(storeIds.map((id) => `export { ${id} } from './${id}'`).join('\n'))
  })

  return res
}

function generatePageFiles(codeList, pagePath = '') {
  const pageFiles = []

  const formatTypePluginMap = {
    babel: [parserBabel],
    vue: [parserHtml, parserBabel, parseCss],
    javascript: [parserBabel],
    css: [parseCss],
    less: [parseCss],
    sass: [parseCss],
    json: [parserBabel]
  }

  const blockList = codeList.filter((item) => item.type === 'Block').map((item) => item.panelName)
  codeList.forEach(({ panelName, panelValue, prettierOpts, type }) => {
    if (panelName && panelValue) {
      if (prettierOpts?.parser && formatTypePluginMap[prettierOpts.parser]) {
        panelValue = prettier.format(panelValue, {
          ...prettierOpts,
          plugins: formatTypePluginMap[prettierOpts.parser]
        })
      }
      if (type === 'Page' && blockList.length) {
        blockList.forEach((blockName) => {
          panelValue = panelValue.replace(`./${blockName}`, `${basePaths.blocks.replace('src/', '@/')}${blockName}`)
        })
      }
      pageFiles.push({
        fileType: type,
        filePath: (type === 'Block' ? basePaths.blocks : basePaths.pages + pagePath) + panelName,
        fileContent: panelValue
      })
    }
  })

  return pageFiles
}

function generateI18n({ i18n }) {
  if (!i18n) {
    return []
  }

  const langMap = {
    en_US: 'en.json',
    zh_CN: 'zh.json'
  }

  const result = []
  Object.keys(i18n).forEach((key) => {
    const fileName = langMap[key]
    if (!fileName) {
      const supportedLocales = Object.keys(this.langMap)
      const message = `failed to generate i18n: invalid locale: ${key}. Only support ${supportedLocales.join('/')}`
      this.logger.error(message)

      throw new Error(message)
    }

    const filePath = basePaths.i18n + fileName
    result.push({
      fileType: FILE_TYPES.I18n,
      filePath,
      fileContent: JSON.stringify(i18n[key], null, 2)
    })
  })

  return result
}

function generateDataSource({ dataSource }) {
  const { dataHandler, list: originList } = dataSource || {}
  if (!originList?.length) {
    return []
  }

  const filePath = basePaths.dataSource

  const list = originList.map(({ id, name, data }) => ({ id, name, ...data }))
  const code = { dataHandler, list }

  return [
    {
      filePath,
      fileType: FILE_TYPES.DataSource,
      fileContent: JSON.stringify(code, null, 2)
    }
  ]
}

function getImportStrsFromImports(imports) {
  const result = []

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

    result.push(`import ${list.join(', ')} from '${key}'`)
  })

  return result
}

function parseExportInfo(utilItem, imports, exportNames, functionStrs) {
  if (utilItem.type === 'npm') {
    const importFrom = `${utilItem.content.package || ''}${utilItem.content.main || ''}`

    if (importFrom) {
      imports[importFrom] = imports[importFrom] || {}
      const importItem = imports[importFrom]

      if (utilItem.content.destructuring) {
        importItem.destructurings = importItem.destructurings || []
        importItem.destructurings.push(utilItem.content.exportName)
        importItem.aliases = importItem.aliases || []
        importItem.aliases.push(utilItem.name)
      } else {
        importItem.exportName = utilItem.name
      }

      exportNames.push(utilItem.name)
    }
  } else if (utilItem.type === 'function') {
    functionStrs.push(`const ${utilItem.name} = ${utilItem.content.value}`)
    exportNames.push(utilItem.name)
  }
}

function generateExport(list) {
  const strs = []
  if (Array.isArray(list)) {
    const exportNames = []
    const functionStrs = []
    const imports = {}

    list.forEach((item) => {
      parseExportInfo(item, imports, exportNames, functionStrs)
    })

    const importStrs = getImportStrsFromImports(imports)

    strs.push(...importStrs, ...functionStrs)

    if (exportNames.length) {
      strs.push(`export { ${exportNames.join(', ')} }`)
    }
  }

  return strs.join('\n')
}

function generateUtils({ utils }) {
  const result = []

  if (utils?.length) {
    const utilStr = generateExport(utils)
    const content = formatScript(utilStr)

    result.push({
      fileType: FILE_TYPES.Utils,
      filePath: basePaths.utils,
      fileContent: formatScript(content)
    })
  }

  return result
}

function generateRoutes(pages) {
  const pagesMap = pages.reduce((acc, cur) => ({ ...acc, [`${cur.id}`]: cur }), {})

  const routes = pages
    .filter((page) => page.isPage)
    .map((page) => {
      const paths = getPaths(page, pagesMap)
      const fileName = `${page.name}.vue`
      return {
        fileName,
        filePath: `${paths}${fileName}`,
        isHome: page.isHome,
        path: `/${paths}${page.route.trim()}`,
        id: page.id,
        name: page.name,
        parentId: page.parentId
      }
    })

  const hasRoot = routes.some(({ path }) => path === '/')

  if (!hasRoot && routes.length) {
    const { path: homePath } = routes.find(({ isHome }) => isHome) || {}

    if (homePath) {
      routes.unshift({ path: '/', redirect: homePath })
    } else {
      routes.unshift({ path: '/', redirect: routes[0].path })
    }
  }

  return routes
}

export function generateRouter(pages) {
  if (!pages?.length) {
    return []
  }

  const routes = generateRoutes(pages)
  const importRoutes = "import { createRouter, createWebHashHistory } from 'vue-router'\n"

  const content = `
  ${importRoutes}

  const routes = [
  ${routes
    .map(
      ({ fileName, path, redirect, filePath }) => `{
        path: '${path}',${redirect ? `redirect: '${redirect}',` : ''}
        ${fileName ? `component: () => import('${basePaths.pages.replace('src/', '@/')}${filePath}'),` : ''}
      }`
    )
    .join(',')}
  ]

  export default createRouter({
    history: createWebHashHistory(),
    routes
  })
  `
  const codeStr = formatScript(content)

  return [
    {
      fileType: FILE_TYPES.Router,
      filePath: basePaths.router,
      fileContent: codeStr
    }
  ]
}

export function generateVuePage({ params, codeList, metaData, pageList }) {
  const pageFiles = generatePageFiles(codeList, getCurrentPagePath(params, pageList))
  const i18nFiles = generateI18n(metaData)
  const utilsFiles = generateUtils(metaData)
  const dataSourceFiles = generateDataSource(metaData)
  const storeFiles = generateStores(metaData)
  const routeFiles = generateRouter(pageList)

  return [...pageFiles, ...i18nFiles, ...utilsFiles, ...dataSourceFiles, ...storeFiles, ...routeFiles]
}

export function generateVueBlock({ params, codeList, metaData }) {
  return generateVuePage({ params, codeList, metaData })
}
