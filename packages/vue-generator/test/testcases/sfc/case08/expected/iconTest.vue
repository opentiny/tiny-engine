<template>
  <div class="page-base-style">
    <tiny-button text="按钮文案" :resetTime="0" type="success" class="" :icon="TinyIconEdit"></tiny-button>
    <tiny-dropdown
      class=""
      :suffix-icon="TinyIconMore"
      :menu-options="{
        options: [
          { name: '老友粉', disabled: true },
          { name: '狮子头', divided: true },
          { name: '黄金糕', divided: true }
        ]
      }"
    ></tiny-dropdown>
    <tiny-icon-custom fill="currentColor" class=""></tiny-icon-custom>
  </div>
</template>

<script setup>
import { Button as TinyButton, Dropdown as TinyDropdown } from '@opentiny/vue'
import { IconEdit, IconMore, IconCustom } from '@opentiny/vue-icon'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'
const TinyIconEdit = IconEdit()
const TinyIconMore = IconMore()
const TinyIconCustom = IconCustom()
const props = defineProps({})
const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, {
  emit
})
wrap({
  stores
})
const state = vue.reactive({})
wrap({
  state
})
</script>
<style scoped>
.page-base-style {
  display: flex;
  margin: 0;
  gap: 12px;
  padding: 24px;
}
</style>
