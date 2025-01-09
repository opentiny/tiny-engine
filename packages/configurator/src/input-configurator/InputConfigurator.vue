<template>
  <tiny-input v-model="value" :type="type" :placeholder="placeholder" :rows="rows" @update:modelValue="change">
    <template #suffix>
      <div v-for="item in suffixIcons" :key="item.icon">
        <svg-icon v-if="item.icon" :name="item.icon" class="tiny-svg-size" @click="item.onClick.action"></svg-icon>
      </div>
    </template>
  </tiny-input>
</template>

<script>
import { ref, watchEffect } from 'vue'
import { Input } from '@opentiny/vue'
import { useProperties } from '@opentiny/tiny-engine-meta-register'

export default {
  name: 'InputConfigurator',
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

    watchEffect(() => {
      value.value = useProperties().translateProp(props.modelValue)
    })

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
