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

import fs from 'fs-extra'
import * as glob from 'glob'
import KoaRouter from 'koa-router'
import path from 'path'
import MockService from '../services/mockService'
import { getResponseData } from '../tool/Common'

const router = new KoaRouter()
export const mockService = new MockService()
const getJsonPathData = (jpath, method = 'get') => {
  const usefulPath = jpath.split(`${method}${path.sep}`)[1]
  const apipath = usefulPath.split(path.sep)
  const lastSegment = apipath[apipath.length - 1]
  const lastdirname = lastSegment.split('.')[0]
  apipath[apipath.length - 1] = lastdirname
  const [center, version, ...routes] = apipath
  let api = ''
  if (version === 'v1') {
    api = `/${center}/${version}/api/${routes.join('/')}`
  } else {
    api = `/${center}/api/${version}/${routes.join('/')}`
  }
  const data = fs.readJSONSync(path.resolve(__dirname, path.relative(__dirname, jpath)))
  return {
    api,
    data
  }
}

const mockPath = path.resolve(__dirname, '../mock')
// 注册路由
glob.globSync(`${mockPath}/get/**/*.json`).forEach((jpath) => {
  const { api, data } = getJsonPathData(jpath)
  router.get(api, (ctx, next) => {
    ctx.body = data
  })
})

glob.globSync(`${mockPath}/post/**/*.json`).forEach((jpath) => {
  const { api, data } = getJsonPathData(jpath, 'post')
  router.post(api, (ctx, next) => {
    ctx.body = data
  })
})

router.get('/app-center/api/apps/canvas/lock', async (ctx) => {
  ctx.body = await mockService.appService.lock(ctx.request.query)
})

router.post('/app-center/api/schema2code', (ctx) => {
  const { pageInfo } = ctx.request.body
  ctx.body = mockService.schema2codeService.schema2code(pageInfo)
})

router.get('/app-center/api/preview/metadata', (ctx) => {
  ctx.body = mockService.appService.getAppPreviewMetaData()
})

router.post('/app-center/api/pages/create', async (ctx) => {
  ctx.body = await mockService.pageService.create(ctx.request.body)
})

router.post('/app-center/api/pages/update/:id', async (ctx) => {
  const { id } = ctx.params
  const { body } = ctx.request
  ctx.body = await mockService.pageService.update(id, body)
})

router.get('/app-center/api/pages/list/:appId', async (ctx) => {
  const { appId } = ctx.params
  ctx.body = await mockService.pageService.list(appId)
})

router.get('/app-center/api/pages/detail/:id', async (ctx) => {
  const { id } = ctx.params
  ctx.body = await mockService.pageService.detail(id)
})

router.get('/app-center/api/pages/delete/:id', async (ctx) => {
  const { id } = ctx.params
  ctx.body = await mockService.pageService.delete(id)
})

router.get('/material-center/api/block/detail/:id', async (ctx) => {
  const { id } = ctx.params
  ctx.body = await mockService.blockService.detail(id)
})

router.get('/material-center/api/blocks', async (ctx) => {
  const { appId } = ctx.params
  ctx.body = await mockService.blockService.list(appId)
})

router.post('/material-center/api/block/create', async (ctx) => {
  const result = mockService.blockService.create(ctx.request.body)
  const categoriesId = ctx.request.body.categories[0]
  const _id = result.id
  await mockService.blockCategoryService.update(categoriesId, { _id })
  ctx.body = getResponseData(result)
})

router.post('/material-center/api/block/update/:id', async (ctx) => {
  const { id } = ctx.params
  const { body } = ctx.request
  ctx.body = await mockService.blockService.update(id, body)
})

router.get('/material-center/api/block/delete/:id', async (ctx) => {
  const { id } = ctx.params
  ctx.body = await mockService.blockService.delete(id)
})

router.post('/material-center/api/block-groups/create', async (ctx) => {
  ctx.body = await mockService.blockGroupService.create(ctx.request.body)
})

router.post('/material-center/api/block-groups/update/:id', async (ctx) => {
  const { id } = ctx.params
  const { body } = ctx.request
  ctx.body = await mockService.blockGroupService.update(id, body)
})

router.get('/material-center/api/block-groups/delete/:id', async (ctx) => {
  const { id } = ctx.params
  ctx.body = await mockService.blockGroupService.delete(id)
})

router.get('/material-center/api/block-groups', async (ctx) => {
  const result = await mockService.blockGroupService.find(ctx.query)
  let blockGroup
  if (result.data.length === 0) {
    ctx.body = result
  } else if (result.data.length > 1) {
    blockGroup = await Promise.all(
      result.data.map(async (group) => {
        group.blocks = await Promise.all(
          group.blocks.map(async (block) => {
            const blockData = await mockService.blockService.detail(block.id)
            return blockData
          })
        )
        return group
      })
    )
    ctx.body = getResponseData(blockGroup)
  } else if (result.data.length === 1) {
    blockGroup = result.data[0]
    const blocks = await Promise.all(
      blockGroup.blocks.map(async (item) => {
        const blockData = await mockService.blockService.detail(item)
        return blockData
      })
    )

    blockGroup.blocks = blocks
    ctx.body = getResponseData([blockGroup])
  }
})

router.post('/material-center/api/block-categories', async (ctx) => {
  ctx.body = await mockService.blockCategoryService.create(ctx.request.body)
})

router.put('/material-center/api/block-categories/:id', async (ctx) => {
  const { id } = ctx.params
  const { body } = ctx.request
  ctx.body = await mockService.blockCategoryService.update(id, body)
})

router.delete('/material-center/api/block-categories/:id', async (ctx) => {
  const { id } = ctx.params
  ctx.body = await mockService.blockCategoryService.delete(id)
})

router.get('/material-center/api/block-categories', async (ctx) => {
  const result = await mockService.blockCategoryService.find(ctx.query)
  const blockCategories = await Promise.all(
    result.data.map(async (group) => {
      const blocks = await Promise.all(
        group.blocks.map(async (block) => {
          const blockData = await mockService.blockService.detail(block)
          return blockData
        })
      )
      group.blocks = blocks
      return group
    })
  )
  ctx.body = getResponseData(blockCategories)
})

router.get('/app-center/api/sources/detail/:id', async (ctx) => {
  const { id } = ctx.params
  ctx.body = await mockService.sourceService.detail(id)
})

router.post('/material-center/api/block/deploy', async (ctx) => {
  ctx.body = await mockService.blockBuildService.build(ctx.request.body)
})

router.get('/material-center/api/tasks/:id', async (ctx) => {
  const { id } = ctx.params
  ctx.body = await mockService.taskService.detail(id)
})

router.get('/block-history', async (ctx) => {
  const { id } = ctx.params
  ctx.body = await mockService.blockHistoryService.find(id)
})

router.post('block-history/create', async (ctx) => {
  ctx.body = await mockService.blockHistoryService.create(ctx.request.body)
})

export default router
