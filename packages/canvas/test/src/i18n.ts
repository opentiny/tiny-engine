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

import i18n from '@opentiny/tiny-engine-i18n-host'
import lowcode from '../../render/src/lowcode'
import locale from './locale'

i18n.lowcode = lowcode
i18n.global.mergeLocaleMessage('zh_CN', locale.zh)
i18n.global.mergeLocaleMessage('en_US', locale.en)

export default i18n
