<template>
  <h4>useI18n</h4>
  <p>{{ t('hello') }}</p>
  <hr />
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  setup() {
    const { t } = useI18n()

    return { t }
  }
}
</script>
