<template>
  <div>
    <tiny-popover class="block-link-field" popper-class="option-popper block-new-attr-popover">
      <tiny-input placeholder="请输入字段名称"></tiny-input>
    </tiny-popover>
    <div>
      <slot name="menu" :title="state.title">
        <span>TinyEngine 前端可视化设计器，为设计器开发者提供定制服务，在线构建出自己专属的设计器。</span>
      </slot>
    </div>
  </div>
</template>

<script setup>
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'
import { Input as TinyInput, Popover as TinyPopover } from '@opentiny/vue'

const props = defineProps({ testSlot: { type: Object, default: () => ({}) } })
const emit = defineEmits([])

const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit }, t)

const state = vue.reactive({
  title: 'test slot params'
})

wrap({
  stores,
  state
})
</script>

<style scoped>
body {
  background-color: #fff;
}
.test {
  width: 100px;
  padding: 10px;
  margin: 10px;
  color: #191919;
}
</style>
