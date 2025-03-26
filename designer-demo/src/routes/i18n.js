import { db } from '../db'
import { getResponseData } from './commonUtils'

export const i18nRoutes = [
  /*---------- i18n ---------------*/
  {
    url: /\/app-center\/api\/i18n\/entries/,
    method: 'GET',
    response: async () => {
      const appSchema = await db.appSchema.get(1)

      const locales = [
        { lang: 'zh_CN', label: 'zh_CN' },
        { lang: 'en_US', label: 'en_US' }
      ]

      return [
        200,
        getResponseData({
          locales,
          messages: appSchema.i18n
        })
      ]
    }
  },
  // 新增一条 i18n
  {
    url: /\/app-center\/api\/i18n\/entries\/create/,
    method: 'POST',
    response: async (config) => {
      const data = JSON.parse(config.data)
      const appSchema = await db.appSchema.get(1)
      const i18n = appSchema.i18n
      const { key, contents } = data
      const { en_US, zh_CN } = contents || {}

      if (!key || (!en_US && !zh_CN)) {
        return [200, { error: '缺少必要参数' }]
      }

      i18n.en_US[key] = contents.en_US
      i18n.zh_CN[key] = contents.zh_CN

      await db.appSchema.update(1, {
        i18n
      })

      return [200, getResponseData({  })]
    }
  },
  {
    url: /\/app-center\/api\/i18n\/entries\/update/,
    method: 'POST',
    response: async (config) => {
      const data = JSON.parse(config.data)
      const appSchema = await db.appSchema.get(1)
      const i18n = appSchema.i18n
      const { key, contents } = data
      const { en_US, zh_CN } = contents || {}

      if (!key || (!en_US && !zh_CN)) {
        return [200, { error: '缺少必要参数' }]
      }

      i18n.en_US[key] = contents.en_US
      i18n.zh_CN[key] = contents.zh_CN

      await db.appSchema.update(1, {
        i18n
      })

      return [200, getResponseData({  })]
    }
  },
  {
    url: /\/app-center\/api\/i18n\/entries\/bulk\/delete/,
    method: 'POST',
    response: async (config) => {
      const data = JSON.parse(config.data)
      const appSchema = await db.appSchema.get(1)
      const i18n = appSchema.i18n
      const { key_in } = data
      const newEnUsI18n = Object.fromEntries(Object.entries(i18n.en_US).filter(([key]) => !key_in.includes(key)))
      const newZhCNI18n = Object.fromEntries(Object.entries(i18n.zh_CN).filter(([key]) => !key_in.includes(key)))

      await db.appSchema.update(1, {
        i18n: {
          en_US: newEnUsI18n,
          zh_CN: newZhCNI18n
        }
      })

      return [200, getResponseData({  })]
    }
  },
  // 批量新增 i18n
  {
    // /app-center/api/i18n/entries/batch/create
    url: /\/app-center\/api\/i18n\/entries\/batch\/create/,
    method: 'POST',
    response: async (config) => {
      const data = JSON.parse(config.data) || {}
      // 新增区块词条，demo 应用忽略
      if (data.host_type === 'block') {
        return [200, getResponseData({  })]
      }

      const newData = {
        en_US: {},
        zh_CN: {}
      }

      data.entries.forEach(({ key, contents }) => {
        newData.en_US[key] = contents.en_US
        newData.zh_CN[key] = contents.zh_CN
      })

      const appSchema = await db.appSchema.get(1)

      await db.appSchema.update(1, {
        i18n: {
          en_US: {
            ...appSchema.i18n.en_US,
            ...newData.en_US
          },
          zh_CN: {
            ...appSchema.i18n.zh_CN,
            ...newData.zh_CN
          }
        }
      })

      return [200, getResponseData([])]
    }
  }
]
