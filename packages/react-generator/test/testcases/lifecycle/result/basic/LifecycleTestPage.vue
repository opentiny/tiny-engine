<template>
  <div class="lifecycle-container">
    <tiny-button @click="handleClick">点击按钮</tiny-button>
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

const handleClick = wrap(function handleClick() {
  console.log('Button clicked')
})

wrap({ handleClick })

vue.onMounted(
  wrap(function onMounted() {
    console.log('Component mounted')
  })
)
vue.onUnmounted(
  wrap(function onUnmounted() {
    console.log('Component unmounted')
  })
)
vue.onUpdated(
  wrap(function onUpdated() {
    console.log('Component updated')
  })
)
vue.onBeforeMount(
  wrap(function onBeforeMount() {
    console.log('Before mount')
  })
)
</script>
<style scoped></style>
