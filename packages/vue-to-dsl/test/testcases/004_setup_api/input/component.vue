<template>
  <section class="dashboard">
    <h1>{{ title }}</h1>
    <p>Count: {{ count }}</p>
    <p>Double: {{ doubleCount }}</p>
    <button @click="inc">Add</button>
    <button @click="reset" :disabled="!canReset">Reset</button>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

const title = ref('Dashboard')
const state = reactive({ count: 2, threshold: 10 })
const count = computed(() => state.count)
const doubleCount = computed(() => state.count * 2)
const canReset = computed(() => state.count > 0)

function inc() {
  state.count++
}
const reset = () => {
  state.count = 0
}

onMounted(() => {
  /* mounted */
})
onUnmounted(() => {
  /* unmounted */
})
</script>

<style scoped>
.dashboard {
  padding: 12px;
}
button {
  margin-right: 4px;
}
</style>
