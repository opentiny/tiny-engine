<template>
  <tiny-switch v-model="value" @change="change"></tiny-switch>
</template>

<script>
import { Switch } from '@opentiny/vue'
import { ref, watchEffect } from 'vue'
import { useProperties } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinySwitch: Switch
  },
  inheritAttrs: false,
  props: {
    modelValue: {
      type: [String, null, Boolean],
      default: () => null
    },
    name: {
      type: String,
      default: ''
    },
    data: {
      type: Object,
      default: () => ({})
    },
    keyVal: {
      type: String,
      default: ''
    },
    checked: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const { setProp } = useProperties()
    const value = ref('')

    watchEffect(() => {
      value.value = props.modelValue
    })

    const change = (value) => setProp(props.name, value)

    return {
      change,
      value
    }
  }
}
</script>
