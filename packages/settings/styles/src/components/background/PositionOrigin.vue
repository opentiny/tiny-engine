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
        <div class="input-item-wrap">
          <label class="input-label">左侧</label>
          <input-select
            :modelValue="state.leftValue"
            :suffixValue="state.leftSuffix"
            @input-change="leftChange"
            @select-change="suffixLeftChange"
          ></input-select>
        </div>
        <div class="input-item-wrap">
          <label class="input-label">上侧</label>
          <input-select
            :modelValue="state.topValue"
            :suffixValue="state.topSuffix"
            @input-change="topChange"
            @select-change="suffixTopChange"
          ></input-select>
        </div>
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
    height: 68px;
    display: grid;
    gap: 4px 8px;
    grid-template-columns: auto auto;
    grid-template-rows: 1fr 3fr;
  }
  .coordinate {
    grid-column-start: 1;
    grid-row: 1 / span 3;
    width: 68px;
    height: 68px;
    background: var(--te-styles-common-bg-color);
    display: inline-grid;
    overflow: hidden;
    justify-items: center;
    border-width: 1px;
    box-sizing: border-box;
    border-style: solid;
    border-color: var(--te-styles-common-border-color);
    border-radius: 4px;
    gap: 0px;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr;
  }
  .coordinate-origin {
    background-color: var(--te-styles-common-bg-color);
    transition: color 0.1s ease 0s;
    color: var(--te-styles-common-icon-color);
    font-size: 14px;
    &:hover,
    &.selected {
      color: var(--te-styles-background-icon-color-primary);
    }
  }
  .input-wrap {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .input-item-wrap {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 4px 0;
      margin-right: 2px;

      .input-label {
        flex: 0 0 51px;
        margin-right: 10px;
        text-align: right;
      }
    }
  }
  .top {
    align-self: flex-start;
  }
}
</style>
