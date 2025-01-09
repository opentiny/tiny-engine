<template>
  <div>block test aaaa</div>
</template>

<script>
import { onMounted } from 'vue'

export default {
  setup() {
    onMounted(() => {
      console.log('onMounted')
    })
  }
}
</script>
