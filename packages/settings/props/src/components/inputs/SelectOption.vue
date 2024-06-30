<template>
  <tiny-select v-model="value" placeholder="请选择" no-data-text="none" @change="change">
    <tiny-option v-for="(item, index) in data" :key="index" :label="item.text" :value="item.value"> </tiny-option>
  </tiny-select>
</template>

<script>
import { Select, Option } from '@opentiny/vue'
import { useProperties } from '@opentiny/tiny-engine-meta-register'
import { computed } from 'vue'

export default {
  components: {
    TinySelect: Select,
    TinyOption: Option
  },
  inheritAttrs: false,
  props: {
    name: {
      type: String,
      default: ''
    },
    modelValue: {
      type: String,
      default: ''
    },
    data: {
      type: Array,
      default: () => []
    },
    changeEvt: {
      type: Boolean,
      default: true
    }
  },

  setup(props, { emit }) {
    const { setProp } = useProperties()
    const value = computed(() => props.modelValue)

    const change = (value) => {
      emit('update:modelValue', value)
      setProp(props.name, value)
    }

    return {
      value,
      change
    }
  }
}
</script>
