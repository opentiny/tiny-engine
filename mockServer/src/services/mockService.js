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
import PageService from './pages'
import IconService from './icons'
import AppService from './app'
import BlockService from './block'
import SourceService from './source'
import BlockGroupService from './blockGroup'
import BlockCategoryService from './blockCategory'
import Schema2CodeServcice from './schema2code'
export default class MockService {
  schema2codeService
  pageService
  iconService
  appService
  blockService
  sourceService
  blockGroupService
  blockCategoryService

  constructor() {
    this.schema2codeService = new Schema2CodeServcice()
    this.pageService = new PageService()
    this.iconService = new IconService()
    this.appService = new AppService()
    this.blockService = new BlockService()
    this.sourceService = new SourceService()
    this.blockGroupService = new BlockGroupService()
    this.blockCategoryService = new BlockCategoryService()
  }
}
