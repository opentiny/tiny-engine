<template>
  <div class="position-origin">
    <label :class="['position-label', { top: isTop }]">定位</label>
    <div class="position-content">
      <div class="coordinate">
        <div
          v-for="(item, index) in originOptions"
          :key="index"
          :class="['coordinate-origin', { selected: state.originActive === index }]"
          @click="selectOrigin(item, index)"
        >
          <svg-icon v-if="state.originActive !== index" :name="item.pointIcon"></svg-icon>
          <svg-icon v-else :name="item.originIcon"></svg-icon>
        </div>
      </div>
      <div class="input-wrap">
        <input-select
          :modelValue="state.leftValue"
          :suffixValue="state.leftSuffix"
          @input-change="leftChange"
          @select-change="suffixLeftChange"
        ></input-select>
        <input-select
          :modelValue="state.topValue"
          :suffixValue="state.topSuffix"
          @input-change="topChange"
          @select-change="suffixTopChange"
        ></input-select>
        <span class="left">左侧</span>
        <span class="top">上侧</span>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive } from 'vue'
import InputSelect from '../inputs/InputSelect.vue'
import { BACKGROUND_PROPERTY } from '../../js/styleProperty'

export default {
  components: {
    InputSelect
  },
  props: {
    active: {
      type: Number,
      default: 0
    },
    isTop: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const originOptions = [
      {
        pointIcon: 'transform-origin-point',
        originIcon: 'transform-origin-top-left',
        left: '0',
        top: '0'
      },
      {
        pointIcon: 'transform-origin-point',
        originIcon: 'transform-origin-top',
        left: '50',
        top: '0'
      },
      {
        pointIcon: 'transform-origin-point',
        originIcon: 'transform-origin-top-right',
        left: '100',
        top: '0'
      },
      {
        pointIcon: 'transform-origin-point',
        originIcon: 'transform-origin-left',
        left: '0',
        top: '50'
      },
      {
        pointIcon: 'transform-origin-point',
        originIcon: 'transform-origin-center',
        left: '50',
        top: '50'
      },
      {
        pointIcon: 'transform-origin-point',
        originIcon: 'transform-origin-right',
        left: '100',
        top: '50'
      },
      {
        pointIcon: 'transform-origin-point',
        originIcon: 'transform-origin-bottom-left',
        left: '0',
        top: '100'
      },
      {
        pointIcon: 'transform-origin-point',
        originIcon: 'transform-origin-bottom',
        left: '50',
        top: '100'
      },
      {
        pointIcon: 'transform-origin-point',
        originIcon: 'transform-origin-bottom-right',
        left: '100',
        top: '100'
      }
    ]

    const state = reactive({
      leftValue: '0',
      leftSuffix: 'px',
      topValue: '0',
      topSuffix: 'px',
      originActive: 0
    })

    const updateStyle = (property) => {
      emit('update', property)
    }

    const updatePositionStyle = () => {
      const styleObj = {
        [BACKGROUND_PROPERTY.BackgroundPosition]: `${state.leftValue + state.leftSuffix} ${
          state.topValue + state.topSuffix
        }`
      }
      updateStyle(styleObj)
    }

    const selectOrigin = (item, index) => {
      state.originActive = index
      state.topValue = item.top
      state.leftValue = item.left
      state.leftSuffix = '%'
      state.topSuffix = '%'
      updatePositionStyle()
    }

    const leftChange = (val) => {
      state.leftValue = val
      updatePositionStyle()
    }

    const suffixLeftChange = (val) => {
      state.leftSuffix = val
      updatePositionStyle()
    }

    const topChange = (val) => {
      state.topValue = val
      updatePositionStyle()
    }

    const suffixTopChange = (val) => {
      state.topSuffix = val
      updatePositionStyle()
    }

    return {
      state,
      originOptions,
      selectOrigin,
      leftChange,
      suffixLeftChange,
      topChange,
      suffixTopChange
    }
  }
}
</script>

<style lang="less" scoped>
.position-origin {
  .position-content {
    place-items: start center;
    height: 64px;
    display: grid;
    gap: 4px 8px;
    grid-template-columns: auto auto;
    grid-template-rows: 1fr 3fr;
  }
  .coordinate {
    grid-column-start: 1;
    grid-row: 1 / span 3;
    width: 64px;
    height: 64px;
    background: var(--ti-lowcode-fit-coordinate-bg);
    display: inline-grid;
    overflow: hidden;
    justify-items: center;
    border-width: 1px;
    box-sizing: border-box;
    border-style: solid;
    border-color: var(--ti-lowcode-fit-coordinate-border-color);
    border-radius: 2px;
    gap: 0px;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr;
  }
  .coordinate-origin {
    background-color: var(--ti-lowcode-fit-coordinate-bg);
    transition: color 0.1s ease 0s;
    color: var(--ti-lowcode-fit-coordinate-origin-color);
    font-size: 19px;
    &:hover,
    &.selected {
      color: var(--ti-lowcode-fit-label-color);
    }
  }
  .input-wrap {
    grid-column-end: span 1;
    grid-row-start: 2;
    align-items: center;
    box-sizing: border-box;
    display: grid;
    gap: 4px 8px;
    grid-template-columns: auto auto;
    .left-input {
      grid-column-start: 1;
    }
    .top-input {
      grid-column-start: 2;
    }
    .left {
      color: var(--ti-lowcode-fit-label-color);
      justify-self: center;
      grid-column-start: 1;
    }
    .top {
      color: var(--ti-lowcode-fit-label-color);
      justify-self: center;
      grid-column-start: 2;
    }
    :deep(.tiny-select) {
      width: auto;
      max-width: 22px;
    }
  }
  .top {
    align-self: flex-start;
  }
}
</style>
