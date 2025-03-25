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

// 获取课程列表
export const fetchTutorialList = (params) =>
  getMetaApi(META_SERVICE.Http).get('platform-center/api/courses', { params })
// 获取课程详情
export const fetchTutorialDetail = (courseId) =>
  getMetaApi(META_SERVICE.Http).get(`platform-center/api/courses/${courseId}`)
