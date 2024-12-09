<template>
  <div class="background-image-gradient">
    <div class="slider" :style="style">
      <div class="slider-inner">
        <div class="delta-right">
          <div class="delta-inner"></div>
        </div>
        <div class="delta-left" :style="{ backgroundColor: state.gradientLeftColor }">
          <div class="delta-inner"></div>
        </div>
      </div>
    </div>
    <div class="repeat">
      <div>
        <tiny-checkbox v-model="state.repeat" @change="changeRepeat">Repeat</tiny-checkbox>
      </div>
      <span><svg-icon name="restart"></svg-icon></span>
    </div>
    <div class="color">
      <label for="">Color</label>
      <color-configurator :modelValue="state.colorValue" @change="colorChange" />
      <tiny-input v-model="state.value" class="color-input" @change="percentChange">
        <template #suffix>
          <span>%</span>
        </template>
      </tiny-input>
    </div>
  </div>
</template>

<script>
import { computed, reactive, watchEffect } from 'vue'
import { Input, Checkbox } from '@opentiny/vue'
import { ColorConfigurator } from '@opentiny/tiny-engine-configurator'

export default {
  components: {
    TinyInput: Input,
    TinyCheckbox: Checkbox,
    ColorConfigurator
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    repeat: {
      type: String,
      default: ''
    },
    colorList: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update'],
  setup(props, { emit }) {
    const state = reactive({
      value: '0',
      repeat: false,
      colorValue: '#000',
      gradientLeftColor: '#D6D6D6',
      gradientRightColor: '#F5F5F5',
      gradientLeftPercent: 0,
      gradientRightPercent: 100
    })

    const style = computed(
      () =>
        `background: linear-gradient(to right, ${state.gradientLeftColor} ${state.gradientLeftPercent}%, ${state.gradientRightColor} ${state.gradientRightPercent}%),url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAKElEQVQoU2O8du3afwY0oKmpiS7EwDgUFP7//x/DM9evX8f0zBBQCACKKzR8WkcGUAAAAABJRU5ErkJggg==);`
    )

    const colorChange = (val) => {
      state.colorValue = val?.target?.value || val || ''
      emit('update', { color: state.colorValue, percent: state.value })
    }

    const percentChange = (val) => {
      state.value = val
      emit('update', { color: state.colorValue, percent: state.value })
    }

    const changeRepeat = (val) => {
      emit('update', { repeat: val ? 'repeat' : '' })
    }

    watchEffect(() => {
      state.repeat = props.repeat === 'repeat'
      state.colorList = props.colorList
    })

    return {
      state,
      style,
      colorChange,
      changeRepeat,
      percentChange
    }
  }
}
</script>

<style lang="less" scoped>
.background-image-gradient {
  padding: 8px 0;
  .slider {
    height: 12px;
    overflow: visible;
    grid-column: 1 / -1;
    position: relative;
    border-width: 0;
    box-sizing: border-box;
    border-style: solid;
    border-color: rgba(0, 0, 0, 0.8);
    border-radius: 2px;
  }
  .repeat {
    display: flex;
    justify-content: space-between;
    margin: 8px 0;
  }
  .color {
    display: grid;
    gap: 8px 8px;
    grid-template-columns: 52px 1fr 65px;
    align-items: center;
    .color-input {
      :deep(.tiny-input__inner) {
        padding-left: 4px;
      }
    }
  }
  .slider-inner {
    position: relative;
    width: 100%;
    height: 16px;
    cursor: default;
  }
  .delta-right {
    position: absolute;
    height: calc(100% - 7px);
    top: 1px;
    right: 0;
    width: 9px;
    border-radius: 10px;
    background-color: rgb(219 219 219);
    box-shadow: rgb(255 255 255) 0px 0px 0px 1px, rgb(0 0 0 / 10%) 0px 0px 0px 2px,
      rgb(219 219 219) 0px 0px 0px 0px inset;
    opacity: 1;
    cursor: ew-resize;
  }
  .delta-left {
    position: absolute;
    height: calc(100% - 4px);
    width: 12px;
    border-radius: 10px;
    left: -1px;
    background-color: rgb(219 219 219);
    box-shadow: rgb(255 255 255) 0px 0px 0px 2px, rgb(0 0 0 / 10%) 0px 0px 0px 3px,
      rgb(219 219 219) 0px 0px 0px 1px inset;
    opacity: 1;
    cursor: ew-resize;
  }
  .delta-inner {
    position: relative;
    border-radius: 10px;
    top: -4px;
    left: -4px;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
  }
}
</style>
