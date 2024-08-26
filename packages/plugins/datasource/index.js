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

import { fetchDataSourceList, fetchDataSourceDetail } from './src/js/http'
import component from './src/Main.vue'

export default {
  id: 'Collections',
  title: '数据源',
  icon: 'plugin-icon-data',
  align: 'top',
  option: {},
  component
}

export { fetchDataSourceList, fetchDataSourceDetail }
