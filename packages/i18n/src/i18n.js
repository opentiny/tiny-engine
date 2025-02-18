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

import { createI18n } from 'vue-i18n'

// 这里需要展开才能再下面进行合并操作，要不然会报错
const i18n = {
  ...createI18n({
    locale: 'zh_CN',
    messages: {},
    legacy: false
  })
}

export const defineCustomI18n = (customI18n) => {
  Object.assign(i18n, customI18n)
}

export default i18n
