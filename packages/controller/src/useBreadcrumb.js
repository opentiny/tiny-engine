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
  BLOCKTEXT: '区块',
  TEMPLATE: '模板'
}

const setBreadcrumbPage = (value) => {
  breadcrumbData.value = [CONSTANTS.PAGETEXT, ...value]
  sessionStorage.setItem('pageInfo', value)
}

const setBreadcrumbBlock = (value, histories = []) => {
  breadcrumbData.value = [CONSTANTS.BLOCKTEXT, ...value, histories]
}

const setBreadcrumbTemplate = (value) => {
  breadcrumbData.value = [CONSTANTS.TEMPLATE, ...value]
  sessionStorage.setItem('pageInfo', value) // 用于canvas右键菜单
}
const getBreadcrumbData = () => breadcrumbData

export default () => {
  return {
    CONSTANTS,
    setBreadcrumbPage,
    setBreadcrumbBlock,
    getBreadcrumbData,
    setBreadcrumbTemplate
  }
}
