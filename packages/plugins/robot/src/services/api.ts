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

import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import type { LLMRequestBody, RequestOptions } from '../types'

/**
 * AI聊天相关API
 */
export const aiChatApi = {
  /**
   * 聊天补全请求
   * @param body 请求体
   * @param options 请求选项
   */
  chatCompletions: (body: LLMRequestBody, options: RequestOptions = {}) => {
    return getMetaApi(META_SERVICE.Http).post(options?.url || '/app-center/api/chat/completions', body, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })
  },

  /**
   * Agent聊天请求
   * @param body 请求体
   * @param options 请求选项
   */
  agentChat: (body: LLMRequestBody, options: RequestOptions = {}) => {
    return getMetaApi(META_SERVICE.Http).post('/app-center/api/ai/chat', body, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })
  },

  /**
   * AI搜索请求
   * @param content 搜索内容
   */
  aiSearch: (content: string) => {
    return getMetaApi(META_SERVICE.Http).post('/app-center/api/ai/search', { content })
  }
}

/**
 * 资源管理相关API
 */
export const resourceApi = {
  /**
   * 上传文件
   * @param formData 文件表单数据
   */
  uploadFile: (formData: FormData) => {
    return getMetaApi(META_SERVICE.Http).post('/material-center/api/resource/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * 获取资源列表
   * @param resourceId 资源ID，默认为'1'
   */
  getResourceList: (resourceId: string = '1') => {
    return getMetaApi(META_SERVICE.Http).get(`/material-center/api/resource/find/${resourceId}`)
  }
}

/**
 * HTTP客户端相关API
 */
export const httpApi = {
  /**
   * 获取HTTP客户端
   */
  getHttpClient: () => {
    return getMetaApi(META_SERVICE.Http)?.getHttp()
  }
}

export const encryptApi = {
  encryptKey: (apiKey: string): Promise<{ token: string }> =>
    getMetaApi(META_SERVICE.Http).post('/app-center/api/encrypt-key', { apiKey })
}

export const apiService = {
  ...aiChatApi,
  ...resourceApi,
  ...httpApi,
  ...encryptApi
}

export default apiService
