<template>
  <tiny-date-picker v-model="value" :value-format="valueFormat" @change="change"></tiny-date-picker>
</template>

<script>
import { ref, watchEffect } from 'vue'
import { DatePicker } from '@opentiny/vue'

export default {
  components: {
    TinyDatePicker: DatePicker
  },
  inheritAttrs: false,
  props: {
    name: {
      type: String,
      default: ''
    },
    modelValue: {
      type: [String, Date],
      default: ''
    },
    valueFormat: {
      type: String,
      default: 'yyyy-MM-dd'
    }
  },
  setup(props, { emit }) {
    const value = ref(props.modelValue)

    const change = (val) => {
      emit('update:modelValue', val)
    }

    watchEffect(() => {
      value.value = props.modelValue
    })

    return {
      value,
      change
    }
  }
}
</script>
