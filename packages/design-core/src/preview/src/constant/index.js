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

const PanelType = {
  VUE: 'vue',
  REACT: 'jsx'
}

const PreviewTips = {
  ERROR_WHEN_COMPILE: '预览时，代码解析、预编译报错',
  // 为了保持一致的 return，仅用作开发提示，相当于注释
  READY_FOR_PREVIEW: 'schema 生成的代码，装载成功，即将在线编译预览'
}

export { PanelType, PreviewTips }
