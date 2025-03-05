<template>
  <div>
    <h1 class="head-title">这里是头部</h1>
    <block-menu></block-menu>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import BlockMenu from './BlockMenu.vue'

onMounted(() => {
  console.log('blockhead mounted')
})
</script>

<style scoped>
.head-title {
  color: red;
}
</style>
