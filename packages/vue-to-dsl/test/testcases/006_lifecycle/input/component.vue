<template>
  <div class="lifecycle-container">Lifecycle</div>
</template>

<script setup>
import {
  onMounted,
  onUpdated,
  onUnmounted,
  onBeforeMount,
  onBeforeUpdate,
  onBeforeUnmount,
  onActivated,
  onDeactivated
} from 'vue'

onMounted(() => {
  console.log('mounted')
})

onUpdated(() => {
  console.log('updated')
})

onUnmounted(() => {
  console.log('unmounted')
})

onBeforeMount(() => {
  console.log('before mount')
})

onBeforeUpdate(() => {
  console.log('before update')
})

onBeforeUnmount(() => {
  console.log('before unmount')
})

onActivated(() => {
  console.log('activated')
})

onDeactivated(() => {
  console.log('deactivated')
})
</script>

<style scoped>
.lifecycle-container {
  color: #333;
}
</style>
