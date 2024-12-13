<template>
  <span>我是自定义的 input configurator</span>
  <tiny-input v-model="value" :type="type" :placeholder="placeholder" :rows="rows" @update:modelValue="change">
  </tiny-input>
</template>

<script>
import { ref } from 'vue'
import { Input } from '@opentiny/vue'

export default {
  name: 'MyInputConfigurator',
  components: {
    TinyInput: Input
  },
  props: {
    modelValue: {
      type: String
    },
    type: {
      type: String
    },
    placeholder: {
      type: String
    },
    suffixIcons: {
      type: Array,
      default: () => []
    },
    dataType: {
      type: String
    },
    rows: {
      type: Number,
      default: 10
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const value = ref(props.modelValue)

    const change = (val) => {
      emit('update:modelValue', props.dataType === 'Array' ? val.split(',') : val)
    }

    return {
      value,
      change
    }
  }
}
</script>

<style lang="less" scoped>
.tiny-svg-size {
  margin-left: 10px;
  font-size: 16px;
  &:hover {
    cursor: pointer;
    color: var(--te-common-text-primary);
  }
}
</style>
