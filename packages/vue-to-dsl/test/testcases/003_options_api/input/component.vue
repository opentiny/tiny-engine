<template>
  <div>
    <p>{{ message }}</p>
    <button @click="updateMessage">更新</button>
  </div>
</template>

<script>
export default {
  name: 'OptionsSample',
  data() {
    return {
      message: 'Hello from Options API'
    }
  },
  methods: {
    updateMessage() {
      this.message = 'Updated!'
    }
  },
  mounted() {
    // lifecycle demo
  }
}
</script>

<style scoped>
div {
  padding: 10px;
}
</style>
