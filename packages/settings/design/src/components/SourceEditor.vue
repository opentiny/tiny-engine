<template>
  <div>
    <monaco-editor class="source-code-content" :value="value" :options="options" @change="change"></monaco-editor>
  </div>
</template>

<script>
import { VueMonaco } from '@opentiny/tiny-engine-common'
import { watchEffect, ref } from 'vue'
import store from '../store'

export default {
  components: {
    MonacoEditor: VueMonaco
  },
  props: {},
  setup(props, { emit }) {
    const value = ref('')
    let content
    let changeFlag = false

    const close = () => {
      changeFlag = false
      emit('close')
    }

    const change = (value) => {
      if (typeof value === 'string') {
        changeFlag = true
        content = value
      }
    }

    const save = () => {
      if (changeFlag) {
        changeFlag = false
        emit('save', content)
      }
    }
    watchEffect(() => {
      value.value = JSON.stringify(store.currentSchema || [], null, 2)
    })

    return {
      value,
      save,
      close,
      change,
      options: {
        language: 'json',
        minimap: {
          enabled: false
        }
      }
    }
  }
}
</script>

<style lang="less" scoped>
.source-code-content {
  height: 100%;
}
</style>
