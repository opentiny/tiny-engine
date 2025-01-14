<template>
  <router-view></router-view>
</template>

<script setup>
import { I18nInjectionKey } from 'vue-i18n'
import { provide } from 'vue'
import i18n from './i18n'

provide(I18nInjectionKey, i18n)
</script>
