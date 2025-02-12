<template>
  <div class="slider-container">
    <input v-model="value" type="range" @change="onSliderStop" />
    <number-configurator
      :min="0"
      :max="100"
      :controls="controls"
      :modelValue="value"
      :selectedUnit="unitRef"
      :showUnit="showUnit"
      :disabled="disabled"
      :unit="[
        { value: 'px', label: 'px' },
        { value: '%', label: '%' }
      ]"
      @numberChange="onNumberCompChange"
      @unitChange="onUnitChange"
    ></number-configurator>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import NumberConfigurator from '../number-configurator/NumberConfigurator.vue'

export default {
  components: {
    NumberConfigurator
  },
  props: {
    modelValue: {
      type: Number,
      default: 0
    },
    controls: {
      type: Boolean,
      default: false
    },
    // 默认选中的单位
    selectedUnit: {
      type: String,
      default: '%'
    },
    // 是否显示单位
    showUnit: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const value = ref(props.modelValue)
    const unitRef = ref(props.selectedUnit || 'px')

    watch(
      () => props.modelValue,
      (val) => {
        value.value = val
      }
    )

    const triggerUpdate = (value, unitValue = unitRef.value) => {
      emit('update:modelValue', value, unitValue)
    }

    const onSliderStop = (event) => {
      triggerUpdate(Number(event.target.value))
    }

    const onNumberCompChange = (val) => {
      value.value = val
      triggerUpdate(val)
    }

    const onUnitChange = (val) => {
      unitRef.value = val
      value.value = 0
      triggerUpdate(0, val)
    }

    return { value, unitRef, onNumberCompChange, onUnitChange, onSliderStop }
  }
}
</script>

<style lang="less" scoped>
.slider-container {
  display: grid;
  grid-template-columns: minmax(80px, 50%) minmax(0, 1fr); // 最后一个元素自适应布局
  column-gap: 6%;
  :deep(.tiny-slider) {
    height: 3px;
    width: 100%;
    border-radius: 2px;
    background-color: var(--te-configurator-slider-bg-color);
    .tiny-slider__handle {
      width: 10px;
      height: 10px;
      margin: -4px -5px 0 -5px;
      border-radius: 50%;
      border: none;
      cursor: ew-resize;
      background-color: var(--te-configurator-common-text-color-secondary);
      box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 1px, rgba(0, 0, 0, 0.3) 0px 0px 0px 0.5px;
    }
    .tiny-slider__range {
      height: 3px;
      border-radius: 3px;
      margin-top: 0;
      background: var(--te-configurator-slider-bg-color);
    }

    .tiny-slider__tips {
      color: var(--te-configurator-common-text-color-weaken);
      background: var(--te-configurator-common-bg-color);
      padding: 4px 6px;
      border-radius: 2px;
      box-shadow: rgb(0 0 0 / 15%) 0px 5px 10px;
      margin-top: -8px;
      &::before,
      &::after {
        border-color: var(--te-configurator-common-bg-color) transparent;
      }
    }
  }
  input[type='range'] {
    height: 4px;
    border-radius: 10px;
    margin: 0.8em 0;
    padding: 0;
    cursor: pointer;
    border: 0;
    background-color: var(--te-configurator-slider-border-bg-color-divider);
    position: relative;
    outline: 0;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }

  input[type='range']::-webkit-slider-thumb {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 0;
    background-color: var(--te-configurator-common-bg-color);
    box-shadow: 0 0 2px 0 var(--te-configurator-common-border-color);
    -webkit-transition: border-color 0.15s, background-color 0.15s;
    transition: border-color 0.15s, background-color 0.15s;
    cursor: pointer;
    background-clip: padding-box;
    box-sizing: border-box;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }
  input[type='range']::-webkit-slider-thumb:active {
    border: 0;
    background-color: var(--te-configurator-common-bg-color);
  }
}
</style>
