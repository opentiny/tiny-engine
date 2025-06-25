<template>
  <div>
    <tiny-form labelWidth="80px" labelPosition="top">
      <tiny-form-item label="姓">
        <tiny-input placeholder="请输入姓氏" v-model="state.lastName"></tiny-input
      ></tiny-form-item>
      <tiny-form-item label="名">
        <tiny-input placeholder="请输入名字" v-model="state.firstName"></tiny-input
      ></tiny-form-item>
      <tiny-form-item>
        <tiny-button text="提交" type="primary"></tiny-button>
        <tiny-button text="重置" style="margin-left: 10px"></tiny-button></tiny-form-item
    ></tiny-form>
  </div>
</template>

<script setup>
import { Button as TinyButton, Input as TinyInput, Form as TinyForm, FormItem as TinyFormItem } from '@opentiny/vue'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({ name: { type: String, default: '' } })

const emit = defineEmits(['update:name'])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({ firstName: '', lastName: '' })
wrap({ state })

vue.watchEffect(
  wrap(function getter() {
    this.emit('update:name', `${this.state.firstName} ${this.state.lastName}`)
  })
)
vue.watchEffect(
  wrap(function setter() {
    const [firstName, lastName] = this.props.name.split(' ')
    this.state.firstName = firstName
    this.state.lastName = lastName
  })
)
</script>
<style scoped></style>
