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

import moment from 'moment'

export const E_SchemaFormatFunc = {
  toLocalTimestamp(time) {
    return moment(time).format('YYYY-MM-DD hh:mm:ss')
  },
  toRootElement(isBody) {
    return isBody ? 'body' : 'div'
  },
  toGroupName(group) {
    // 调整一下group命名
    if (['static', 'public'].includes(group)) {
      return `${group}Pages`
    }
    return group
  },
  toCreatorName(createdBy) {
    // 历史原因 数据库中有页面的createdBy为null
    return (createdBy || {}).username || ''
  },

  // 数字转字符串
  toFormatString(param) {
    return param.toString()
  },

  // 给global_state设置默认值
  toArrayValue(state) {
    return Array.isArray(state) ? state : []
  }
}
