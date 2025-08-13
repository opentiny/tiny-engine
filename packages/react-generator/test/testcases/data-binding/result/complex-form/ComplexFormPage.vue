<template>
  <div class="complex-form">
    <div class="user-section">
      <tiny-input placeholder="姓名" v-model="state.user.profile.name"></tiny-input>
      <tiny-input type="email" placeholder="邮箱" v-model="state.user.profile.email"></tiny-input>
    </div>
    <div class="preferences-section">
      <tiny-select placeholder="语言偏好" v-model="state.user.preferences.language"></tiny-select>
      <tiny-checkbox label="接收邮件通知" v-model="state.user.preferences.emailNotifications"></tiny-checkbox>
    </div>
  </div>
</template>

<script setup>
import { Input as TinyInput, Select as TinySelect, Checkbox as TinyCheckbox } from '@opentiny/vue'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({
  user: { profile: { name: '', email: '' }, preferences: { language: '', emailNotifications: false } }
})
wrap({ state })
</script>
<style scoped></style>
