<template>
  <div class="background-input">
    <tiny-input v-model="color" placeholder="请输入颜色" @change="change">
      <template #prefix>
        <input v-model="inputColor" type="color" class="input-color" @change="changeColor" />
      </template>
    </tiny-input>
  </div>
</template>

<script>
import { Input } from '@opentiny/vue'
import { ref, computed, watchEffect } from 'vue'

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
    const inputColor = computed(() => color.value || '#FFFFFF')

    const change = (value) => {
      emit('update:modelValue', value)
      emit('change', value)
    }

    watchEffect(() => {
      color.value = props.modelValue
    })

    const changeColor = (event) => {
      change(event.target.value)
    }

    return {
      color,
      inputColor,
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
    width: 20px;
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
    }
  }
}
</style>
