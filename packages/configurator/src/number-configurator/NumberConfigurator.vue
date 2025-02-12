<template>
  <div class="meta-numeric-input">
    <tiny-numeric
      v-model="numberRef"
      :controls="controls"
      :controls-position="controlsPosition"
      :min="min"
      :max="max"
      :step="step"
      :allow-empty="allowEmpty"
      :disabled="disabled"
      @change="change"
    ></tiny-numeric>
    <div v-if="!addonAfter && showUnit && units?.length" class="meta-numeric-unit" :style="{ width: unitSelectWidth }">
      <tiny-select
        v-model="unitRef"
        popper-class="select-popper"
        :options="units"
        :disabled="disabled"
        size="mini"
        :title="unitRef"
        @change="changeUnit"
      ></tiny-select>
    </div>
    <div v-if="addonAfter" class="meta-numeric-addon-after">
      {{ addonAfter }}
    </div>
  </div>
</template>

<script>
import { ref, watchEffect } from 'vue'
import { Numeric, Select } from '@opentiny/vue'

export default {
  components: {
    TinyNumeric: Numeric,
    TinySelect: Select
  },
  // 2.4.0 新增的属性，关闭默认绑定属性的默认行为
  inheritAttrs: false,
  props: {
    // 控制按钮显示位置
    controlsPosition: {
      type: String,
      default: 'right'
    },
    controls: {
      type: Boolean,
      default: true
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
    // 是否显示单位
    showUnit: {
      type: Boolean,
      default: false
    },
    // 单位列表
    units: {
      type: Array,
      default: () => [
        { value: 'px', label: 'px' },
        { value: '%', label: '%' }
      ]
    },
    // 默认选中的单位
    selectedUnit: {
      type: String,
      default: 'px'
    },
    unitSelectWidth: {
      type: String,
      default: '25px'
    },
    // 初始默认值
    modelValue: {
      type: [Number, String],
      default: ''
    },
    // 默认设置的属性名称
    attrName: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    allowEmpty: {
      type: Boolean,
      default: false
    },
    addonAfter: {
      type: String,
      default: ''
    }
  },
  emits: ['numberChange', 'unitChange', 'update:modelValue'],
  setup(props, { emit }) {
    const parseNumberWithUnit = (inputValue) => {
      if (typeof inputValue !== 'string') {
        return { value: typeof inputValue === 'number' ? inputValue : null, unit: null }
      }

      const regex = /^([\d.]+)([a-zA-Z/°²³]+)$/
      const match = inputValue.trim().match(regex)

      if (match) {
        const value = parseFloat(match[1]) // 数字部分
        const unit = match[2] // 单位部分

        return { value, unit }
      } else {
        // 如果匹配失败，则将整个字符串解析为数字
        const value = parseFloat(inputValue)

        return { value: isNaN(value) ? null : value, unit: null }
      }
    }
    const numberRef = ref(parseNumberWithUnit(props.modelValue).value)
    const unitRef = ref(parseNumberWithUnit(props.modelValue).unit || props.addonAfter || props.selectedUnit)

    watchEffect(() => {
      numberRef.value = parseNumberWithUnit(props.modelValue).value
      unitRef.value = parseNumberWithUnit(props.modelValue).unit || props.addonAfter || props.selectedUnit
    })

    const change = () => {
      const attrValue = props.showUnit ? `${numberRef.value}${unitRef.value}` : numberRef.value
      emit('numberChange', numberRef.value)
      emit('update:modelValue', attrValue)
    }

    const changeUnit = (selected) => {
      unitRef.value = selected
      emit('unitChange', selected)
      emit('update:modelValue', `${numberRef.value}${selected}`)
    }

    return {
      change,
      changeUnit,
      numberRef,
      unitRef
    }
  }
}
</script>

<style lang="less" scoped>
.meta-numeric-input {
  position: relative;
  display: flex;
  align-items: center;
  .tiny-numeric {
    flex: 1;
    user-select: none;
    :deep(.tiny-numeric__input-inner) {
      text-align: left;
    }
    :deep(.is-disabled) {
      background-color: var(--te-configurator-common-bg-color-disabled);
    }
    &.is-without-controls {
      :deep(.tiny-numeric__input-inner) {
        padding-left: 8px;
        padding-right: 8px;
      }
      & + .meta-numeric-unit {
        right: 1px;
      }
    }
  }
  .meta-numeric-unit {
    position: absolute;
    top: 2px;
    height: calc(100% - 2px);
    span {
      color: var(--te-configurator-common-text-color-primary);
      font-size: 14px;
      padding: 4px;
    }
    :deep(.tiny-select) {
      width: 100%;
      .tiny-input__inner {
        height: 100%;
        color: var(--te-configurator-common-text-color-primary);
        padding: 2px;
        border: none;
        font-size: 14px;
        text-align: center;
      }
      .tiny-input__suffix {
        display: none;
      }
      .tiny-input.is-disabled .tiny-input__inner {
        background-color: var(--te-configurator-number-bg-color);
      }
    }
  }
  .meta-numeric-addon-after {
    margin-left: 4px;
  }
}
</style>
