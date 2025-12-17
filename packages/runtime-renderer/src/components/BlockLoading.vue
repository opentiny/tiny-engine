<template>
  <div>区块 {{ name }} 加载中</div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  name: {
    type: String,
    default: ''
  }
})
</script>
