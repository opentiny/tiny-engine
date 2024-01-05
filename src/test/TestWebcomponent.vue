<template>
  <h4>webcomponent</h4>
  <p>{{ t('hello') }}</p>
  <hr />
</template>

<script>
import { inject } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

export default {
  setup() {
    const {
      global: { t }
    } = inject(I18nInjectionKey)

    return { t }
  }
}
</script>
