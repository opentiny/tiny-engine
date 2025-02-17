<template>
  <div class="numeric-input">
    <tiny-numeric
      v-model="value"
      :controls-position="controlsPosition"
      :min="min"
      :max="max"
      :step="step"
      @change="change"
    ></tiny-numeric>
    <div v-if="showText" class="text">
      <tiny-select
        v-model="textValue"
        popper-class="select-popper"
        :options="textList"
        size="mini"
        @change="change"
      ></tiny-select>
    </div>
  </div>
</template>

<script>
import { ref, watchEffect } from 'vue'
import { Numeric, Select } from '@opentiny/vue'
import { useProperties } from '@opentiny/tiny-engine-meta-register'
export default {
  components: {
    TinyNumeric: Numeric,
    TinySelect: Select
  },
  inheritAttrs: false,
  props: {
    text: {
      type: String,
      default: 'px'
    },
    controlsPosition: {
      type: String,
      default: 'right'
    },
    max: {
      type: Number,
      default: Infinity
    },
    min: {
      type: Number,
      default: -Infinity
    },
    step: {
      type: Number,
      default: 1
    },
    showText: {
      type: Boolean,
      default: true
    },
    modelValue: {
      type: [String, Number],
      default: ''
    },
    name: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const { setProp } = useProperties()
    const value = ref(0)
    const textList = [
      { value: 'px', label: 'px' },
      { value: '%', label: '%' }
    ]
    const textValue = ref('px')
    const change = (value) => {
      value = textValue.value === '%' ? (value += '%') : value
      setProp(props.name, value)
    }
    watchEffect(() => {
      value.value = props.modelValue || 0
    })
    return {
      change,
      value,
      textList,
      textValue
    }
  }
}
</script>

<style lang="less" scoped>
.numeric-input {
  position: relative;
  .tiny-numeric {
    width: 100%;
    :deep(.tiny-numeric__input-inner) {
      text-align: left;
    }
  }
  .text {
    position: absolute;
    top: 50%;
    right: 32px;
    transform: translateY(-50%);
    span {
      color: var(--te-props-common-text-color-secondary);
      font-size: 14px;
      padding: 4px;
    }
    :deep(.tiny-select) {
      width: 25px;
      float: right;
      .tiny-input__inner {
        color: var(--te-props-common-text-color-secondary);
        padding: 2px;
        border: none;
        font-size: 14px;
        text-align: center;
        &:hover {
          background: var(--te-props-common-bg-color-hover);
        }
      }
      .tiny-input__suffix {
        display: none;
      }
    }
  }
}
</style>
