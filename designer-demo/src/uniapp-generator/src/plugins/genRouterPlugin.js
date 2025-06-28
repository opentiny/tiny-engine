import { mergeOptions } from '../utils/mergeOptions'
import { pagesConfig } from '../config'

const defaultOption = {
  fileName: 'pages.json',
  path: './src'
}

const convertToUniappPages = (schema) => {
  const pageSchema = schema.pageSchema || []
  const pages = []
  // 从全局状态中获取 tabBar 配置，并添加默认值
  let tabBar = pagesConfig.tabList
    ? {
        color: '#7A7E83',
        selectedColor: '#3cc51f',
        borderStyle: 'black',
        backgroundColor: '#ffffff',
        height: '50px',
        fontSize: '10px',
        iconWidth: '24px',
        spacing: '3px',
        ...(pagesConfig.tabList || {})
      }
    : null

  // 验证和规范化 tabBar 配置
  if (tabBar) {
    if (!Array.isArray(tabBar.list) || tabBar.list.length === 0) {
      tabBar = null
    } else {
      tabBar.list = tabBar.list.filter((item, index) => {
        if (!item.pagePath || !item.text) {
          return false
        }
        // 确保 pagePath 格式正确
        if (!item.pagePath.startsWith('pages/')) {
          item.pagePath = `pages/${item.pagePath}`
        }
        return true
      })

      // 如果过滤后列表为空，将 tabBar 设置为 null
      if (tabBar.list.length === 0) {
        tabBar = null
      }
    }
  }

  pageSchema.forEach((item) => {
    if (!item.meta?.router) return

    // 移除开头的斜杠，因为uniapp不需要
    const path = item.meta.router.startsWith('/') ? item.meta.router.slice(1) : item.meta.router

    // 构建页面配置
    const page = {
      path: `pages/${path}`,
      style: {
        navigationBarTitleText: item.meta.title || ''
      }
    }

    // 如果页面有特殊配置，添加到style中
    if (item.meta.style) {
      Object.assign(page.style, item.meta.style)
    }

    pages.push(page)
  })

  // 确保首页在第一位
  const homePageIndex = pages.findIndex((page) =>
    pageSchema.find(
      (schema) =>
        `pages/${schema.meta?.router?.replace(/^\//, '')}` === page.path &&
        (schema.meta?.isHome || schema.meta?.isDefault)
    )
  )

  if (homePageIndex > 0) {
    const homePage = pages.splice(homePageIndex, 1)[0]
    pages.unshift(homePage)
  }

  debugger
  return { pages, tabBar }
}

// 生成uniapp的pages.json配置
function genRouterPlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)
  const { path, fileName } = realOptions

  return {
    name: 'tinyEngine-generateCode-plugin-uniapp-pages',
    description: 'transform schema to uniapp pages.json plugin',
    /**
     * 根据页面生成uniapp的pages.json配置
     * @param {import('@opentiny/tiny-engine-dsl-uniapp').IAppSchema} schema
     * @returns
     */
    run(schema) {
      const { pages, tabBar } = convertToUniappPages(schema)

      // 构建pages.json对象
      const pagesConfig = {
        pages,
        globalStyle: {
          navigationBarTextStyle: 'black',
          navigationBarTitleText: schema.name || 'uni-app',
          navigationBarBackgroundColor: '#F8F8F8',
          backgroundColor: '#F8F8F8'
        }
      }

      // 如果有tabBar配置，添加到pages.json中
      if (tabBar && tabBar.list && tabBar.list.length >= 2) {
        pagesConfig.tabBar = tabBar
      }

      // 如果schema中有全局样式配置，覆盖默认配置
      if (schema.globalStyle) {
        Object.assign(pagesConfig.globalStyle, schema.globalStyle)
      }

      const res = {
        fileType: 'json',
        fileName,
        path,
        fileContent: JSON.stringify(pagesConfig, null, 2)
      }

      return res
    }
  }
}

export default genRouterPlugin
