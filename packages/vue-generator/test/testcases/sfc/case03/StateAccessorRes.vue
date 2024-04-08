<template>
  <div>
    <tiny-form labelWidth="80px" labelPosition="top">
      <tiny-form-item label="全名">
        <tiny-input placeholder="请输入全名" v-model="state.fullName"></tiny-input
      ></tiny-form-item>
      <tiny-form-item>
        <tiny-button text="提交" type="primary"></tiny-button>
        <tiny-button text="重置" style="margin-left: 10px"></tiny-button></tiny-form-item
    ></tiny-form>
  </div>
</template>

<script setup>
import { Form as TinyForm, FormItem as TinyFormItem, Button as TinyButton, Input as TinyInput } from '@opentiny/vue'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({ firstName: { type: String, default: '' }, lastName: { type: String, default: '' } })

const emit = defineEmits(['update:firstName', 'update:lastName'])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({ fullName: '' })
wrap({ state })

vue.watchEffect(
  wrap(function setter() {
    const [firstName, lastName] = this.state.fullName.split(' ')
    this.emit('update:firstName', firstName)
    this.emit('update:lastName', lastName)
  })
)
vue.watchEffect(
  wrap(function getter() {
    this.state.fullName = `${this.props.firstName} ${this.props.lastName}`
  })
)
</script>
<style scoped></style>
