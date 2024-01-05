<template>
  <slot></slot>
</template>

<script>
import { provide, watch, watchEffect } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'
import i18n from './i18n'

export default {
  inheritAttrs: false,
  props: {
    locale: {
      type: String,
      default: 'zh_CN'
    },
    messages: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    // 通过 provide ，可以让 tiny-i18n-host 树结构下的 webcomponent 通过 inject(I18nInjectionKey)，获取 i18n 对象
    provide(I18nInjectionKey, i18n)

    // eslint-disable-next-line vue/no-setup-props-destructure
    i18n.global.locale.value = props.locale

    watch(
      () => props.locale,
      () => {
        i18n.global.locale.value = props.locale
      }
    )

    watchEffect(() => {
      Object.entries(props.messages).forEach(([key, value]) => {
        i18n.global.mergeLocaleMessage(key, value)
      })
    })

    return {}
  }
}
</script>
