<template>
  <div class="advanced-form-container">
    <tiny-input placeholder="请输入用户名" v-model="state.formData.username"></tiny-input>
    <tiny-switch v-model="state.formData.enabled"></tiny-switch>
    <tiny-radio value="male" v-model="state.formData.gender"></tiny-radio>
    <tiny-radio value="female" v-model="state.formData.gender"></tiny-radio>
    <textarea placeholder="请输入备注" v-model="state.formData.remarks"></textarea>
    <select v-model="state.formData.category"></select>
    <tiny-input placeholder="详细地址" v-model="state.formData.address.detail"></tiny-input>
    <tiny-input placeholder="邮政编码" v-model="state.formData.address.zipCode"></tiny-input>
  </div>
</template>

<script setup>
import { Input as TinyInput, Switch as TinySwitch, Radio as TinyRadio } from '@opentiny/vue'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({
  formData: {
    username: '',
    enabled: false,
    gender: '',
    remarks: '',
    category: '',
    address: { detail: '', zipCode: '' }
  }
})
wrap({ state })
</script>
<style scoped></style>
