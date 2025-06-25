<template>
  <div>
    <block-slot-params>
      <template #test="{ testData }">
        <span>{{ testData.name }}</span></template
      ></block-slot-params
    >
  </div>
</template>

<script setup>
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'
import BlockSlotParams from '../components/BlockSlotParams.vue'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({})
wrap({ state })
</script>
<style scoped></style>
