<template>
  <div>
    <tiny-grid :columns="state.columns"></tiny-grid>
  </div>
</template>

<script setup lang="jsx">
import { Grid as TinyGrid } from '@opentiny/vue'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({
  columns: [
    { field: 'info', title: '信息', slots: { default: ({ row }, h) => <span title='{"key": "value"}'></span> } }
  ]
})
wrap({ state })
</script>
<style scoped></style>
