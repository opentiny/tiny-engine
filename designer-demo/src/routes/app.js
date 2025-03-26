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

import { db } from '../db'
import { getResponseData } from './commonUtils'

export const appRoutes = [
  // 获取用户信息
    {
      url: "/platform-center/api/user/me",
      method: 'GET',
      response: async () => {
        const userInfo  = await db.user.get(1)
  
        return [200, getResponseData(userInfo)]
      }
    },
    // 获取app的详细信息
    {
      url: /\/app-center\/api\/apps\/detail\/\d+/,
      method: 'GET',
      response: async () => {
        // 忽略传过来的 appid，demo 应用只有一个
        const appDetail = await db.appDetail.get(1)
  
        return [200, getResponseData(appDetail)]
      }
    },
    // 获取 appSchema
    {
      url: /\/app-center\/v1\/api\/apps\/schema\/\d+/,
      method: 'GET',
      response: async () => {
        const appSchema = await db.appSchema.get(1)
        const pages = await db.page.toArray()
        const componentsTree = pages.map(({ page_content, ...rest }) => ({
          ...page_content,
          meta: rest
        }))
        const utilsArr = await db.utils.toArray()
        const utils = utilsArr.map(({ name, type, content }) => ({ name, type, content }))
  
        appSchema.componentsTree = componentsTree
        appSchema.utils = utils
  
        return [200, getResponseData(appSchema)]
      }
    },
    // 获取 app metadata
    {
      // "/app-center/api/preview/metadata"
      url: /\/app-center\/api\/preview\/metadata/,
      method: 'GET',
      response: async () => {
        const appSchema = await db.appSchema.get(1)
        const utilsArr = await db.utils.toArray()
        const utils = utilsArr.map(({ name, type, content }) => ({ name, type, content }))
  
        const res = {
          dataSource: {
            "list": []
          },
          globalState: appSchema.meta.globalState,
          i18n: appSchema.i18n,
          utils
        }
  
        return [200, getResponseData(res)]
      }
    },
    // 更新 app
    {
      url: /\/app-center\/api\/apps\/update\/\d+/,
      method: 'POST',
      response: async (config) => {
        const newAppData = JSON.parse(config.data)
        const appSchema = await db.appSchema.get(1)

        if (newAppData.global_state) {
          await db.appDetail.update(1, { global_state: newAppData.global_state })
          await db.appSchema.update(1, { meta: { ...appSchema.meta, globalState: newAppData.global_state } })
        }

        // TODO: 支持更新数据源

        const appDetail = db.appDetail.get(1)
  
        return [200, getResponseData(appDetail)]
      }
    }
]