<template>
  <div>
    <div>
      <span>{{ utils.test() }}</span>
    </div>
    <div>
      <span>{{ `aaaa${utils.test()}` }}</span>
    </div>
    <div>
      <span>{{ utils.test() }}</span>
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

const { utils } = wrap(function () {
  return this
})()
const state = vue.reactive({ firstName: '', lastName: '' })
wrap({ state })
</script>
<style scoped></style>
