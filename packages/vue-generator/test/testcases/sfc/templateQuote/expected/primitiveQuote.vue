<template>
  <div>
    <tiny-button
      noQuotes="plain text value"
      onlyDouble='{"name": "test", "id": "main"}'
      onlySingle="it's a 'test' value"
      bothQuotes='She said "hello" and it&apos;s fine'
      htmlAttr='class="primary" id="btn-1"'
      emptyStr=""
    ></tiny-button>
  </div>
</template>

<script setup>
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({})
wrap({ state })
</script>
<style scoped></style>
