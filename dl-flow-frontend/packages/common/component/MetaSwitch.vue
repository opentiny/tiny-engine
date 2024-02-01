<template>
  <tiny-switch v-model="valueRef" @change="change"></tiny-switch>
</template>

<script>
import { Switch } from '@opentiny/vue'
import { ref, watchEffect } from 'vue'

export default {
  components: {
    TinySwitch: Switch
  },
  inheritAttrs: false,
  props: {
    // switch 默认传递的值
    modelValue: {
      type: [String, null, Boolean],
      default: () => null
    }
  },
  setup(props, { emit }) {
    const valueRef = ref(props.modelValue)

    watchEffect(() => {
      valueRef.value = props.modelValue
    })

    const change = (val) => {
      emit('update:modelValue', val)
    }

    return {
      change,
      valueRef
    }
  }
}
</script>
