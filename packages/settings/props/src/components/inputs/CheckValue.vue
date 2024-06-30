<template>
  <tiny-checkbox v-model="checked" @change="change"></tiny-checkbox>
</template>

<script>
import { ref, watchEffect } from 'vue'
import { Checkbox } from '@opentiny/vue'
import { useProperties } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinyCheckbox: Checkbox
  },
  inheritAttrs: false,
  props: {
    name: {
      type: String,
      default: ''
    },
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const { setProp } = useProperties()
    const checked = ref(props.modelValue)

    const change = (val) => {
      emit('update:modelValue', val)
      setProp(props.name, val)
    }

    watchEffect(() => {
      checked.value = props.modelValue
    })

    return {
      checked,
      change
    }
  }
}
</script>
