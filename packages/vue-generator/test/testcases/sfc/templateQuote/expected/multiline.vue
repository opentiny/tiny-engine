<template>
  <div>
    <tiny-button
      multilineJson='{
  "name": "test",
  "value": "data"
}'
      :objWithMultiline="{ template: 'line1\nline2', label: 'normal' }"
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
