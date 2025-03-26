import { db } from '../db'
import { formatDateTime, getResponseData, occupier } from './commonUtils'

export const pageRoutes = [
    /**********-------- 页面 -----------***********/
    // 页面管理 - 获取应用下所有的页面
    {
      url: /\/app-center\/api\/pages\/list\/\d+/,
      method: 'GET',
      response: async () => {
        const pages = await db.page.toArray()
        return [200, getResponseData(pages)]
      }
    },
    // 根据页面 id 获取页面详情
    {
      url: /\/app-center\/api\/pages\/detail\/\d+/,
      method: 'GET',
      response: async (config) => {
        const pageId = config.url.split('/').at(-1)
        const pageDetail = await db.page.get(Number(pageId))
  
        return [200, getResponseData(pageDetail)]
      }
    },
    // 页面管理 -- 保存页面，暂时还不支持页面备份记录
    {
      url: /\/app-center\/api\/pages\/update\/\d+/,
      method: 'POST',
      response: async (config) => {
        const id = config.url.split('/').at(-1)
  
        await db.page.update(Number(id), JSON.parse(config.data))
        const page = await db.page.get(Number(id))
        return [200, page]
      }
    },
    // 页面管理 -- 创建页面
    {
      url: /\/app-center\/api\/pages\/create/,
      method: 'POST',
      response: async (config) => {
        const params = JSON.parse(config.data)
        const time = formatDateTime()

        if (!params.isPage) {
          const {
            parentId,
            route,
            name,
            app,
            isPage
          } = params
          

          const data = {
            createdBy: 1,
            lastUpdatedBy: 1,
            tenantId: 1,
            renterId: null,
            siteId: 1,
            name,
            app,
            route,
            isBody: true,
            parentId,
            group: "staticPages",
            depth: 1,
            isPage,
            occupierBy: 1,
            isDefault: false,
            contentBlocks: [],
            latestVersion: null,
            latestHistoryId: null,
            occupier,
            isHome: null,
            assets: null,
            message: null,
            created_at: time,
            updated_at: time,
            page_content: {}
          }
          const res = await db.page.add(data)
          const page = await db.page.get(res)
  
          return [200, getResponseData(page)]
        }
  
        const { 
          app,
          name,
          route,
          isHome,
          parentId,
          isBody,
          group,
          message,
          page_content,
          isPage
        } = params
  
        const data = {
          createdBy: "1",
          lastUpdatedBy: "1",
          tenantId: "1",
          renterId: null,
          siteId: "1",
          name,
          app,
          route,
          isBody,
          parentId,
          group,
          depth: 0,
          isPage,
          occupierBy: "1",
          isDefault: false,
          contentBlocks: [],
          latestVersion: null,
          latestHistoryId: null,
          occupier,
          isHome,
          assets: null,
          message,
          created_at: time,
          updated_at: time,
          page_content,
        }
  
        const res = await db.page.add(data)
        const page = await db.page.get(res)

        return [200, getResponseData(page)]
      }
    },
    // 页面管理——删除页面
    {
      url: /\/app-center\/api\/pages\/delete\/\d+/,
      method: 'GET',
      response: async (config) => {
        const id = Number(config.url.split('/').at(-1))
  
        const page = await db.page.get(id)
        await db.page.delete(id)
  
        return [200, page]
      }
    },
    /*-------------------------------------------------------------*/
]