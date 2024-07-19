<template>
  <div :class="['content-wrap', { 'is-margin': isMargin, 'is-padding': isPadding }]">
    <div class="content-input">
      <span class="icon">
        <svg-icon v-show="isMargin" name="margin"></svg-icon>
        <svg-icon v-show="isPadding" name="padding"></svg-icon>
      </span>
      <numeric-select :name="property.name" :numericalText="numericalText" @update="inputChange" />
    </div>
    <div class="content-value">
      <div v-show="isMargin" :class="['auto', { active: 'auto' === propertyValue }]" @click="select('auto')">Auto</div>
      <ul :class="['custom', { 'is-padding': isPadding }]">
        <li
          v-for="item in options"
          :key="item"
          :class="['option', { active: item === propertyValue }]"
          @click="select(item)"
        >
          {{ item }}
        </li>
      </ul>
    </div>
  </div>
  <reset-button v-show="isReset" class="reset" @reset="reset" />
</template>

<script>
import { computed } from 'vue'
import { ResetButton } from '@opentiny/tiny-engine-common'
import NumericSelect from '../inputs/NumericSelect.vue'
import useEvent from '../../js/useEvent'
import { SPACING_PROPERTY, POSITION_PROPERTY } from '../../js/styleProperty'

export default {
  components: {
    ResetButton,
    NumericSelect
  },
  props: {
    property: {
      type: Object,
      default: () => ({})
    }
  },
  emits: useEvent(),
  setup(props, { emit }) {
    let sliderFlag = true
    const options = [0, 10, 20, 40, 60, 100, 140, 220]
    const isReset = computed(() => Boolean(props.property.value))
    const isMargin = computed(
      () => props.property.type === SPACING_PROPERTY.Margin || props.property.type === POSITION_PROPERTY.Position
    )
    const isPadding = computed(() => props.property.type === SPACING_PROPERTY.Padding)

    const propertyValue = computed(() =>
      props.property.value === 'auto' ? 'auto' : Number.parseInt(props.property.value)
    )
    const sliderValue = computed(() => Number.parseInt(props.property.value || 0))

    const numericalText = computed(() =>
      props.property.value?.indexOf('px') > -1 ? Number.parseInt(props.property.value) : props.property.value
    )

    const updateStyle = (value) => {
      emit('update', { [props.property.name]: value })
    }

    const sliderChange = () => {
      if (sliderFlag) {
        updateStyle(`${sliderValue.value}px`)
      }

      sliderFlag = true
    }

    // 选中已定义的值
    const select = (value) => {
      sliderFlag = false
      if (typeof value === 'number') {
        value = Number.isNaN(value) ? '' : `${value}px`
      } else {
        value = value || ''
      }

      updateStyle(value)
    }

    const reset = () => {
      sliderFlag = false
      updateStyle('')
    }

    const inputChange = (property) => {
      updateStyle(property[props.property.name])
    }

    return {
      options,
      isReset,
      isMargin,
      isPadding,
      sliderValue,
      propertyValue,
      numericalText,
      reset,
      select,
      inputChange,
      sliderChange
    }
  }
}
</script>

<style lang="less" scoped>
.content-wrap {
  .content-input {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    .icon {
      font-size: 16px;
      color: var(--ti-lowcode-toolbar-breadcrumb-color);
      margin-right: 18px;
    }

    & > div {
      flex: 1 1 0;
      display: flex;
      align-items: center;
    }
  }

  .content-value {
    display: flex;
    align-items: center;
    margin-top: 12px;

    .auto {
      width: 60px;
      height: 60px;
      line-height: 60px;
      text-align: center;
      border: 1px solid var(--ti-lowcode-toolbar-border-color);
      background: var(--ti-lowcode-canvas-wrap-bg);
      cursor: pointer;
      box-sizing: border-box;

      &:hover,
      &.active {
        color: var(--ti-lowcode-style-setting-label-color);
        background: var(--ti-lowcode-style-setting-label-bg);
      }
    }

    .custom {
      width: calc(100% - 60px);
      height: 60px;
      display: flex;
      flex-wrap: wrap;
      align-content: space-between;

      &.is-padding {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        column-gap: 3%;
        .option {
          width: auto;
          margin-left: 0;
        }
      }

      .option {
        width: 22%;
        height: 26px;
        line-height: 26px;
        margin-left: 3%;
        text-align: center;
        border: 1px solid var(--ti-lowcode-toolbar-border-color);
        background: var(--ti-lowcode-canvas-wrap-bg);
        cursor: pointer;
        transition: 0.3s;
        box-sizing: border-box;

        &:hover,
        &.active {
          color: var(--ti-lowcode-style-setting-label-color);
          background: var(--ti-lowcode-style-setting-label-bg);
        }
      }
    }
  }

  :deep(.tiny-slider__input) {
    display: flex;
    flex: 1 1 0;
    border: 1px solid var(--ti-lowcode-dialog-tip-border-color);
    border-radius: 4px;
    background-color: var(--ti-lowcode-breadcrumb-hover-bg);

    input {
      border: none;
    }

    span {
      padding: 0 4px;
      position: relative;
      &::before {
        content: 'PX';
        display: inline-block;
        background: var(--ti-lowcode-breadcrumb-hover-bg);
        word-break: keep-all;
        position: absolute;
        top: 0;
      }
    }
  }

  .content-wrap {
    &.is-padding {
      .custom {
        width: 100%;
        justify-content: space-between;

        .option {
          width: 23%;
          margin-left: 0;
        }
      }
    }
  }
}

.reset {
  margin-top: 10px;
}
</style>
