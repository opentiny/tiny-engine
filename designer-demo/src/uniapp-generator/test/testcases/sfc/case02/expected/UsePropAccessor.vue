<template>
  <div>
    <tiny-form labelWidth="80px" labelPosition="top">
      <tiny-form-item label="全名"> <prop-accessor v-model:name="state.fullName"></prop-accessor></tiny-form-item
    ></tiny-form>
  </div>
</template>

<script setup>
import { Form as TinyForm, FormItem as TinyFormItem } from '@opentiny/vue'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'
import PropAccessor from '../components/PropAccessor.vue'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({ fullName: '' })
wrap({ state })
</script>
<style scoped></style>
