<template>
  <div>
    <tiny-form labelWidth="80px" labelPosition="top">
      <tiny-form-item label="全名">
        <state-accessor :firstName="state.firstName" :lastName="state.lastName"></state-accessor>
      </tiny-form-item>
    </tiny-form>
  </div>
</template>

<script setup>
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'
import { Form as TinyForm, FormItem as TinyFormItem } from '@opentiny/vue'
import StateAccessor from '../components/StateAccessor.vue'

const props = defineProps({})
const emit = defineEmits([])

const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit }, t)

const state = vue.reactive({
  firstName: '',
  lastName: ''
})

wrap({
  stores,
  state
})
</script>

<style scoped></style>
