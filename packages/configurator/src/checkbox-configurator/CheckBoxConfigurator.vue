<template>
  <tiny-checkbox v-model="checked" @change="change"></tiny-checkbox>
</template>

<script>
import { ref, watchEffect } from 'vue'
import { Checkbox } from '@opentiny/vue'

export default {
  components: {
    TinyCheckbox: Checkbox
  },
  props: {
    modelValue: { type: Boolean, default: false }
  },
  inheritAttrs: false,
  setup(props, context) {
    const checked = ref(props.modelValue)

    watchEffect(() => {
      checked.value = props.modelValue
    })

    const change = (val) => {
      context.emit('update:modelValue', val)
    }

    return {
      checked,
      change
    }
  }
}
</script>
