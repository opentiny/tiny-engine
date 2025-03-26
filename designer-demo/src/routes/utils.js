import { db } from '../db'
import { formatDateTime, getResponseData } from './commonUtils'

export const utilsRoutes = [
  /** ------------ utils -------------------- **/
  // 获取工具类 utils
  {
    url: /\/app-center\/api\/apps\/extension\/list/,
    method: 'GET',
    response: async (config) => {
      const query = new URLSearchParams(config.url.split('?')[1])
      const category = query.get('category')

      if (category === 'utils') {
        const list = await db.utils.toArray()
        return [200, getResponseData(list)]
      }
    }
  },
  // 新增 utils
  {
    url: "/app-center/api/apps/extension/create",
    method: 'POST',
    response: async (config) => {
      const data = JSON.parse(config.data)
      const time = formatDateTime()

      if (data?.category === 'utils') {
        const res = await db.utils.add({
          ...data,
          createdBy: 1,
          lastUpdatedBy: 1,
          tenantId: 1,
          renterId: 1,
          siteId: 1,
          category: "utils",
          created_at: time,
          updated_at: time
        })
        const resData = await db.utils.get(res)

        return [200, getResponseData(resData)]
      }
    }
  },
  {
    url: "/app-center/api/apps/extension/update",
    method: 'POST',
    response: async (config) => {
      const data = JSON.parse(config.data)
      const time = formatDateTime()

      if (data?.category === 'utils') {
        const id = Number(data.id)
        const originData = await db.utils.get(id)
        await db.utils.update(id, {
          ...originData,
          ...data,
          updated_at: time
        })

        const resData = await db.utils.get(id)

        return [200, getResponseData(resData)]
      }
    }
  },
  {
    url: /\/app-center\/api\/apps\/extension\/delete/,
    method: 'GET',
    response: async (config) => {
      const query = new URLSearchParams(config.url.split('?')[1])
      const id = Number(query.get('id'))
      const res = await db.utils.get(id)
      await db.utils.delete(id)

      return [200, getResponseData(res)]
    }
  }
]