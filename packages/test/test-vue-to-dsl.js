import { VueToDslConverter } from '@opentiny/tiny-engine-vue-to-dsl'
const converter = new VueToDslConverter({ computed_flag: false })

const vueCode = `
<template>
  <div class="hello">
    <h1>{{ title }}</h1>
    <button @click="handleClick">Click me</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('Hello World')

function handleClick() {
  console.log('Button clicked')
}
</script>

<style scoped>
.hello {
  color: red;
  font-size: 16px;
}
</style>
    `

const result = await converter.convertFromString(vueCode)

console.log(JSON.stringify(result.schema, null, 2)) // result.schema为JSON格式的页面DSL Schema