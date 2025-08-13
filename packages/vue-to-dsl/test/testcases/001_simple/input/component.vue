<template>
  <div class="simple-counter">
    <h1>计数器: {{ count }}</h1>
    <button @click="increment">增加</button>
    <button @click="decrement">减少</button>
    <button @click="reset">重置</button>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'SimpleCounter',
  setup() {
    const count = ref(0)

    const increment = () => {
      count.value++
    }

    const decrement = () => {
      count.value--
    }

    const reset = () => {
      count.value = 0
    }

    return {
      count,
      increment,
      decrement,
      reset
    }
  }
}
</script>

<style scoped>
.simple-counter {
  text-align: center;
  padding: 20px;
}

button {
  margin: 0 5px;
  padding: 10px 15px;
  background: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #369870;
}
</style>
