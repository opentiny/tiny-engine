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

import component, { api } from './src/Main.vue'

export default {
  id: 'PageController',
  title: '页面 JS',
  icon: 'plugin-icon-js',
  align: 'top',
  options: {
    width: 1000,
    align: 'leftTop'
  },
  api,
  component,
  confirm: 'close' // 当点击插件栏切换或关闭前是否需要确认, 会调用插件中confirm值指定的方法，e.g. 此处指向 close方法，会调用插件的close方法执行确认逻辑
}
