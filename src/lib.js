import { defineCustomElement } from '@opentiny/tiny-engine-webcomponent-core'
import I18nHost from './I18nHost.vue'
import i18n, { defineCustomI18n } from './i18n'

const name = 'tiny-i18n-host'

if (!customElements.get(name)) {
  customElements.define(name, defineCustomElement(I18nHost))
}

export { defineCustomI18n }

export default i18n
