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

import { defineCustomElement } from '@opentiny/tiny-engine-webcomponent-core'
import I18nHost from './I18nHost.vue'
import i18n, { defineCustomI18n } from './i18n'

const name = 'tiny-i18n-host'

if (!customElements.get(name)) {
  customElements.define(name, defineCustomElement(I18nHost))
}

export { defineCustomI18n }

export default i18n
