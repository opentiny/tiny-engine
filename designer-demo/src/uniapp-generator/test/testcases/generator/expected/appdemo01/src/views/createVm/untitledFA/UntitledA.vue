<template>
  <div class="page-base-style"></div>
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
<style scoped>
.page-base-style {
  padding: 24px;
  background: #ffffff;
}

.block-base-style {
  margin: 16px;
}

.component-base-style {
  margin: 8px;
}
</style>
