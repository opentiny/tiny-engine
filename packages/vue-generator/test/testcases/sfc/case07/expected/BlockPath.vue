<template>
  <div class="page-base-style">
    <span style="display: inline-block" class="component-base-style">测试二级页面使用区块</span>
    <block-test1a class="block-base-style"></block-test1a>
  </div>
</template>

<script setup>
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'
import BlockTest1a from '@/components/BlockTest1a.vue'

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
