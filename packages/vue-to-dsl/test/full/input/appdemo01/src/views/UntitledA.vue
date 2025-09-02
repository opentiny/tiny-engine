<template>
  <div>
    <div class="page-base-style">
      <h1 class="component-base-style">Hello World!</h1>
    </div>
    <h2 class="component-base-style">Vue -> DSL</h2>
    <tiny-button text="OK" type="success" class="component-base-style"></tiny-button>
  </div>
</template>

<script setup>
import { Button as TinyButton } from '@opentiny/vue'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({})
wrap({ state })
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
