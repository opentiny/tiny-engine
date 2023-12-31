<template>
  <div class="background-image-setting">
    <div class="background-row line">
      <label class="row-label">类型</label>
      <div class="row-content">
        <tiny-tooltip
          v-for="item in state.typeLists"
          :key="item.tipContent"
          :effect="effect"
          :placement="placement"
          :content="item.tipContent"
          popper-class="background-type-tooltip"
        >
          <div
            :class="[
              'row-content-item background-type-item',
              { selected: state.styleComponent === item.styleComponent }
            ]"
            @click="selectType(item)"
          >
            <svg-icon :name="item.iconName"></svg-icon>
          </div>
        </tiny-tooltip>
      </div>
    </div>
    <div class="background-image-content">
      <component
        :is="state.styleComponent"
        :style="style"
        :effect="effect"
        :placement="placement"
        @updateStyle="updateStyle"
      />
    </div>
  </div>
</template>

<script>
import { reactive, onMounted } from 'vue'
import { Tooltip, Checkbox } from '@opentiny/vue'
import { MetaColor } from '@opentiny/tiny-engine-common'
import InputSelect from '../inputs/InputSelect.vue'
import PositionOrigin from './PositionOrigin.vue'
import ImageSetting from './ImageSetting.vue'
import LinearGradient from './LinearGradient.vue'
import RadialGradient from './RadialGradient.vue'
import ColorOverlay from './ColorOverlay.vue'
import BackgroundImageGradient from './BackgroundImageGradient.vue'
import { BACKGROUND_PROPERTY } from '../../js/styleProperty'

export default {
  components: {
    TinyTooltip: Tooltip,
    TinyCheckbox: Checkbox,
    InputSelect,
    MetaColor,
    PositionOrigin,
    ImageSetting,
    LinearGradient,
    RadialGradient,
    ColorOverlay,
    BackgroundImageGradient
  },
  props: {
    style: {
      type: Object,
      default: () => {}
    },
    effect: {
      type: String,
      default: 'dark'
    },
    placement: {
      type: String,
      default: 'top'
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const state = reactive({
      style: {},
      styleComponent: 'ImageSetting',
      typeLists: [
        {
          tipContent: '背景图',
          styleComponent: 'ImageSetting',
          iconName: 'background-image',
          value: {
            imageUrl: 'img/bgcModal.png',
            position: '0px 0px',
            size: 'auto'
          }
        },
        {
          tipContent: '线性渐变',
          styleComponent: 'LinearGradient',
          iconName: 'linear-gradient',
          value: 'linear-gradient(#000, #fff)'
        },
        {
          tipContent: '径向渐变',
          styleComponent: 'RadialGradient',
          iconName: 'radial-gradient',
          value: 'radial-gradient(circle at 50% 50%, #000, #fff)'
        },
        {
          tipContent: '颜色叠加',
          styleComponent: 'ColorOverlay',
          iconName: 'background-color',
          value: 'linear-gradient(#000, #000)'
        }
      ]
    })

    const updateStyle = (property) => {
      emit('update:modelValue', { ...property, type: state.styleComponent })
    }

    const selectType = (item) => {
      let styleObj = {}

      if (item.styleComponent === 'ImageSetting') {
        styleObj = {
          [BACKGROUND_PROPERTY.BackgroundImage]: `url(${item.value.imageUrl})`,
          [BACKGROUND_PROPERTY.BackgroundPosition]: item.value.position,
          [BACKGROUND_PROPERTY.BackgroundSize]: item.value.size
        }
      } else {
        styleObj = {
          [BACKGROUND_PROPERTY.BackgroundImage]: item.value,
          [BACKGROUND_PROPERTY.BackgroundPosition]: null,
          [BACKGROUND_PROPERTY.BackgroundSize]: null,
          [BACKGROUND_PROPERTY.BackgroundRepeat]: null,
          [BACKGROUND_PROPERTY.BackgroundAttachment]: null
        }
      }

      state.styleComponent = item.styleComponent
      updateStyle(styleObj)
    }

    onMounted(() => {
      state.styleComponent = props.style.type
    })

    return {
      state,
      BACKGROUND_PROPERTY,
      selectType,
      updateStyle
    }
  }
}
</script>

<style lang="less" scoped>
.background-image-setting {
  :deep(.background-row) {
    display: grid;
    gap: 4px 20px;
    grid-template-columns: 40px 1fr;
    align-items: center;
    .row-label {
      margin-right: -16px;
      align-self: flex-start;
      line-height: 26px;
    }

    .row-content {
      flex: auto;
      display: flex;
      border: 1px solid var(--ti-lowcode-tabs-border-color);

      .row-content-item {
        flex: 1;
        padding: 4px 0;
        color: var(--ti-lowcode-toolbar-breadcrumb-color);
        background: var(--ti-lowcode-canvas-wrap-bg);
        position: relative;
        display: flex;
        justify-content: center;
        &.background-type-item {
          font-size: 16px;
        }
        &:not(:last-child)::after {
          content: '';
          width: 1px;
          height: 100%;
          background: var(--ti-lowcode-tabs-border-color);
          display: inline-block;
          position: absolute;
          top: 0;
          right: 0;
        }

        &:hover {
          color: var(--ti-lowcode-toolbar-icon-color);
          background-color: var(--ti-lowcode-button-hover-bg);
        }

        &.selected {
          color: var(--ti-lowcode-toolbar-icon-color);
          background-color: var(--ti-lowcode-radio-button-active-bg);
        }

        .overflow-svg {
          margin: auto;
        }

        .overflow-auto {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: center;
        }
      }
    }
  }
  :deep(.line) {
    padding: 8px 0;
    position: relative;
    &::after {
      content: '';
      display: inline-block;
      width: calc(100% + 16px);
      height: 1px;
      background-color: var(--ti-lowcode-optionitem-background-color);
      position: absolute;
      left: -8px;
      bottom: 0px;
    }
  }
  .background-image-content {
    .linear-gradient {
      .angle-wrap {
        display: grid;
        gap: 8px 4px;
        grid-template-columns: 1fr 65px;
        align-items: center;
        .angle-select {
          :deep(.tiny-select) {
            cursor: not-allowed;
            pointer-events: none;
          }
        }
      }
      .angle-icon {
        display: grid;
        gap: 8px;
        grid-template-columns: 24px auto auto 1fr;
        align-items: center;
      }
    }
  }
}
</style>
