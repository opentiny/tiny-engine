<template>
  <div class="edge-case-container">
    <tiny-input placeholder="空字段测试"></tiny-input>
    <tiny-input placeholder="this前缀清理" v-model="state.withThis"></tiny-input>
    <tiny-input placeholder="深层嵌套" v-model="state.level1.level2.level3.deepField"></tiny-input>
  </div>
</template>

<script setup>
import { Input as TinyInput } from '@opentiny/vue'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({ noComponentType: '', withThis: '', level1: { level2: { level3: { deepField: '' } } } })
wrap({ state })
</script>
<style scoped></style>
