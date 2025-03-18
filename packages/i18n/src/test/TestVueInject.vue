<template>
  <h4>inject</h4>
  <p>{{ t('hello') }}</p>
  <hr />
</template>

<script lang="ts">
import { inject } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

export default {
  setup() {
    const {
      global: { t }
    } = inject<any>(I18nInjectionKey)

    return { t }
  }
}
</script>
