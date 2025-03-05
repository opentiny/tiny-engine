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

import { ref } from 'vue'

let breadcrumbData = ref([])
const CONSTANTS = {
  PAGETEXT: '页面',
  BLOCKTEXT: '区块'
}

const setBreadcrumbPage = (value) => {
  breadcrumbData.value = [CONSTANTS.PAGETEXT, ...value]
  sessionStorage.setItem('pageInfo', value)
}

const setBreadcrumbBlock = (value) => {
  breadcrumbData.value = [CONSTANTS.BLOCKTEXT, ...value]
}

const getBreadcrumbData = () => breadcrumbData

export default () => {
  return {
    CONSTANTS,
    setBreadcrumbPage,
    setBreadcrumbBlock,
    getBreadcrumbData
  }
}
