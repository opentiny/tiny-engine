<script setup>
import { onMounted } from 'vue'
import { init } from '@opentiny/tiny-engine'
import registry from '../registry.js'

onMounted(() => {
  init('#engine-app', registry)
})
</script>

<template>
  <div id="engine-app"></div>
</template>

<style scoped></style>
