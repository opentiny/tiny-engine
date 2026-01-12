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

import { apiService } from './api'

const logger = console

/**
 * AI搜索功能
 * @param content 搜索内容
 * @returns 搜索结果字符串
 */
export const search = async (content: string): Promise<string> => {
  let result = ''
  const MAX_SEARCH_LENGTH = 8000

  try {
    const res = await apiService.aiSearch(content)

    res.forEach((item: { content: string }) => {
      if (result.length + item.content.length > MAX_SEARCH_LENGTH) {
        return
      }
      result += item.content
    })
  } catch (error) {
    // 静默处理错误，返回空字符串
    logger.warn('AI search failed:', error)
  }

  return result
}

/**
 * 获取资源列表
 * @returns 格式化的资源列表
 */
export const fetchAssets = async (appId: string) => {
  try {
    const res = (await apiService.getResourceList(appId)) || []
    return res
      .map((group: any) => group.resources)
      .flat()
      .filter((item: any) => item.description)
      .map((item: any) => ({
        url: item.resourceUrl,
        describe: item.description
      }))
  } catch (error) {
    logger.warn('Fetch assets failed:', error)
    return []
  }
}
