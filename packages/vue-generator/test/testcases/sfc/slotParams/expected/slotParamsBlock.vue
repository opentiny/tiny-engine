<template>
  <div>
    <span>请开启插槽</span>
    <div>
      <slot name="test" :testData="state.personData"></slot>
    </div>
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

const state = vue.reactive({ personData: { name: '李华', age: '20', address: 'china' } })
wrap({ state })
</script>
<style scoped></style>
