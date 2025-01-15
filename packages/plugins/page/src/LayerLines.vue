<template>
  <span v-for="i in level - 1" :key="i" class="gap">
    <svg v-if="lineData[i]" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <line x1="8" y1="0" x2="8" y2="12" stroke="#EBEBEB" stroke-width="1" />
      <line v-if="(lineData[i] & 1) === 1" x1="8" y1="12" x2="20" y2="12" stroke="#EBEBEB" stroke-width="1" />
      <line v-if="((lineData[i] >> 1) & 1) === 1" x1="8" y1="12" x2="8" y2="24" stroke="#EBEBEB" stroke-width="1" />
    </svg>
  </span>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  level: {
    type: Number,
    required: true
  },
  lineData: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.gap {
  width: 24px;
  height: 24px;
}
</style>
