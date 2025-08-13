import { describe, it, expect } from 'vitest'
import { VueToDslConverter } from '../../src/converter.js'

describe('VueToDslConverter', () => {
  const converter = new VueToDslConverter()

  it('should convert simple Vue SFC to DSL', async () => {
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

    expect(result.errors).toHaveLength(0)
    expect(result.schema).toBeDefined()
    expect(result.schema.componentName).toBe('Page')
    expect(result.schema.state).toBeDefined()
    expect(result.schema.methods).toBeDefined()
    expect(result.schema.css).toBeDefined()
    expect(result.schema.children).toBeDefined()
  })

  it('should handle Vue Options API', async () => {
    const vueCode = `
<template>
  <div>
    <p>{{ message }}</p>
  </div>
</template>

<script>
export default {
  name: 'TestComponent',
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
    console.log('Component mounted')
  }
}
</script>
    `

    const result = await converter.convertFromString(vueCode)

    expect(result.errors).toHaveLength(0)
    expect(result.schema).toBeDefined()
    expect(result.schema.state).toBeDefined()
    expect(result.schema.methods).toBeDefined()
    expect(result.schema.lifecycle).toBeDefined()
  })

  it('should handle conversion errors gracefully', async () => {
    const invalidVueCode = `
<template>
  <div>Invalid template</
</template>

<script>
  invalid javascript code here
</script>
    `

    const result = await converter.convertFromString(invalidVueCode)

    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.schema).toBeNull()
  })
})
