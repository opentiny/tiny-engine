<template>
  <div class="complex-component">
    <tiny-input placeholder="测试输入框"></tiny-input>
  </div>
</template>

<script setup>
import { Input as TinyInput } from '@opentiny/vue'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({ inputValue: '', isLoading: false })
wrap({ state })

const initializeData = wrap(function initializeData() {
  this.isLoading = true
})
const setupEventListeners = wrap(function setupEventListeners() {
  console.log('Setting up listeners')
})
const cleanup = wrap(function cleanup() {
  this.isLoading = false
})
const removeEventListeners = wrap(function removeEventListeners() {
  console.log('Removing listeners')
})
const handleError = wrap(function handleError(error) {
  console.error('Handled error:', error)
})
const reportError = wrap(function reportError(error) {
  console.log('Reporting error:', error)
})

wrap({ initializeData, setupEventListeners, cleanup, removeEventListeners, handleError, reportError })

vue.onMounted(
  wrap(function onMounted() {
    initializeData()
    setupEventListeners()
  })
)
vue.onBeforeUnmount(
  wrap(function onBeforeUnmount() {
    cleanup()
    removeEventListeners()
  })
)
vue.onErrorCaptured(
  wrap(function onErrorCaptured() {
    handleError(error)
    reportError(error)
  })
)
</script>
<style scoped></style>
