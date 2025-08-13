<template>
  <div class="test-container">
    <tiny-input placeholder="请输入用户名" v-model="state.username"></tiny-input>
    <tiny-select placeholder="请选择角色" v-model="state.role"></tiny-select>
    <input type="checkbox" v-model="state.agreed" />
  </div>
</template>

<script setup>
import { Input as TinyInput, Select as TinySelect } from '@opentiny/vue'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({ username: '', role: '', agreed: false })
wrap({ state })
</script>
<style scoped></style>
