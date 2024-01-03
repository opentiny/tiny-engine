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
