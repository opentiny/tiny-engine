<template>
  <div class="background-input">
    <tiny-input v-model="color" placeholder="color value" @change="change">
      <template #prefix>
        <input v-model="color" type="color" class="input-color" @change="changeColor" />
      </template>
    </tiny-input>
  </div>
</template>

<script>
import { ref, watchEffect } from 'vue'
import { Input } from '@opentiny/vue'

export default {
  components: {
    TinyInput: Input
  },
  props: {
    name: {
      type: String,
      default: ''
    },
    modelValue: {
      type: String,
      default: ''
    }
  },
  emits: ['change', 'update:modelValue'],
  setup(props, { emit }) {
    const color = ref(props.modelValue)

    const changeColor = (event) => {
      change(event.target.value)
    }

    const change = (value) => {
      emit('update:modelValue', value)
      emit('change', value)
    }

    watchEffect(() => {
      color.value = props.modelValue
    })

    return {
      color,
      change,
      changeColor
    }
  }
}
</script>

<style lang="less" scoped>
.background-input {
  width: 100%;

  .input-color {
    width: 22px;
    height: 24px;
    border: none;
    background: transparent;
    padding: 0;
    border-radius: 4px;
  }

  :deep(.tiny-input-prefix) {
    .tiny-input__prefix {
      left: 2px;
    }
    .tiny-input__inner {
      padding-left: 24px;
      padding-right: 8px;
      background-color: transparent;
      border: none;
    }
  }
}
</style>
