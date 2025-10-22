<template>
  <div>
    <tiny-switch v-model="state.switchStatus" class="component-base-style"></tiny-switch>
    <tiny-button text="按钮文案" class="component-base-style" @click="onClickNew"></tiny-button>
  </div>
</template>

<script setup>
import { Switch as TinySwitch, Button as TinyButton } from '@opentiny/vue'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({ switchStatus: true })
wrap({ state })

const onClickNew = wrap(function onClickNew(event) {
  this.state.switchStatus = !this.state.switchStatus
})

wrap({ onClickNew })

const setup = wrap(function setup({ props, state, watch, onMounted }) {
  console.log('setup')
  state.switchStatus = false
})
setup({ props, context: { emit }, state, ...vue })
</script>
<style scoped>
.page-base-style {
  padding: 24px;
  background: #ffffff;
}

.block-base-style {
  margin: 16px;
}

.component-base-style {
  margin: 8px;
}
</style>
