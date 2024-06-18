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

const getBaseUrl = () => 'https://opentiny.design/tiny-engine#/help-center/course/engine/'

const helpState = {
  docsUrl: {
    block: 3,
    bridge: 13,
    data: 7,
    datasource: 11,
    i18n: 12,
    page: 2,
    script: 8,
    stylePanel: 6
  }
}

const getDocsUrl = (plugin) => {
  return `${getBaseUrl()}${helpState.docsUrl[plugin]}`
}

export default () => ({
  getBaseUrl,
  getDocsUrl
})
