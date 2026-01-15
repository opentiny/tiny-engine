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

import { isVsCodeEnv } from './environments'
import { generateRouter, generatePage } from './vscodeGenerateFile'
import { usePage, useNotify, useBreadcrumb, useMessage } from '@opentiny/tiny-engine-meta-register'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

// ============ 类型定义 ============

/**
 * 埋点事件参数接口
 */
interface EventParams {
  event_type: string // 事件类型，如 'design_error', 'design_JSError' 等
  url: string // 当前页面URL
  unit?: string // URL参数信息
  content?: string // 事件详细内容
  [key: string]: any // 支持其他自定义字段
}

/**
 * 页面内容接口
 */
interface PageContent {
  fileName?: string // 文件名
  lifeCycles?: any // 生命周期
  [key: string]: any // 页面 schema 的其他属性
}

/**
 * 页面参数接口
 */
interface PageParams {
  name?: string // 页面名称
  page_content?: PageContent // 页面内容
  route?: string // 路由信息
  message?: string // 更新消息
  [key: string]: any // 其他页面属性
}

/**
 * 页面更新参数接口
 */
interface UpdateParams {
  id: number | string // 页面ID
  params: PageParams // 页面参数
  routerChange?: boolean // 路由是否改变，默认 false
  isCurEditPage?: boolean // 是否是当前编辑页面，默认 true
  isUpdateTree?: boolean // 是否更新树结构，默认 true
}

// ============ 函数实现 ============

/**
 * 异常情况埋点上传
 * @param { string } url 埋点上传地址
 * @param { EventParams } params 埋点事件参数 {"event_type": "design_error","url": "elit in reprehenderit enim incididunt" }
 * @returns { Promise<T> | undefined } 返回 Promise 或 undefined
 */
export const requestEvent = <T = any>(url: string, params: EventParams): Promise<T> | undefined => {
  if (!url) {
    return
  }

  return getMetaApi(META_SERVICE.Http)
    .post(url, params)
    .catch(() => {})
}

/**
 * 页面更新
 * @param { UpdateParams } updateParams 页面更新参数，包含 id、params、routerChange、isCurEditPage、isUpdateTree
 * @returns { Promise<any> }
 *
 */
export const handlePageUpdate = (updateParams: UpdateParams): Promise<any> => {
  const { id, params, routerChange = false, isCurEditPage = true, isUpdateTree = true } = updateParams

  return (
    getMetaApi(META_SERVICE.Http)
      .post(`/app-center/api/pages/update/${id}`, params)
      // TODO: 优化返回类型
      .then((res: any) => {
        if (isVsCodeEnv) {
          generatePage({
            id: Number(id),
            name: params.name || '',
            page_content: params.page_content
          })

          if (routerChange) {
            generateRouter({
              pageId: String(id),
              componentsTree: params
            })
          }
        }

        if (isUpdateTree) {
          useNotify({ message: '保存成功!', type: 'success' })
        }

        // 发布 Schema 变动通知
        useMessage().publish({
          topic: 'pageOrBlockInit',
          data: params.page_content
        })

        if (isCurEditPage) {
          const { setBreadcrumbPage } = useBreadcrumb()
          setBreadcrumbPage([params.name || ''])
        }

        return res
      })
      .catch((err: any) => {
        useNotify({ title: '保存失败', message: `${err?.message || ''}`, type: 'error' })
      })
      .finally(() => {
        const { pageSettingState } = usePage()
        // 更新页面管理的列表，如果不存在，说明还没有打开过页面管理面板
        if (isUpdateTree) {
          pageSettingState.updateTreeData?.()
        }
        pageSettingState.isNew = false
      })
  )
}
