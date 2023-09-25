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

import KoaRouter from 'koa-router'
import * as glob from 'glob'
import path from 'path'
import fs from 'fs-extra'
import Schema2CodeServcice from '../services/schema2code'
import PageService from '../services/pages'
import AppService from '../services/app'
import BlockService from '../services/block'
import SourceService from '../services/source'

const router = new KoaRouter()
const schema2codeService = new Schema2CodeServcice()
export const pageService = new PageService()
export const appService = new AppService()
export const blockService = new BlockService()
export const sourceService = new SourceService()
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
  ctx.body = await appService.lock(ctx.request.query)
})

router.post('/app-center/api/schema2code', (ctx) => {
  const { pageInfo } = ctx.request.body
  ctx.body = schema2codeService.schema2code(pageInfo)
})

router.get('/app-center/api/preview/metadata', (ctx) => {
  ctx.body = appService.getAppPreviewMetaData()
})

router.post('/app-center/api/pages/create', async (ctx) => {
  ctx.body = await pageService.create(ctx.request.body)
})

router.post('/app-center/api/pages/update/:id', async (ctx) => {
  const { id } = ctx.params
  const { body } = ctx.request
  ctx.body = await pageService.update(id, body)
})

router.get('/app-center/api/pages/list/:appId', async (ctx) => {
  const { appId } = ctx.params
  ctx.body = await pageService.list(appId)
})

router.get('/app-center/api/pages/detail/:id', async (ctx) => {
  const { id } = ctx.params
  ctx.body = await pageService.detail(id)
})

router.get('/app-center/api/pages/delete/:id', async (ctx) => {
  const { id } = ctx.params
  ctx.body = await pageService.delete(id)
})

router.get('/material-center/api/block', (ctx)=> {
  ctx.body = blockService.find(ctx.request.query)
})

router.get('/app-center/api/sources/detail/:id', async (ctx) => {
  const { id } = ctx.params
  ctx.body = await sourceService.detail(id)
})

export default router
