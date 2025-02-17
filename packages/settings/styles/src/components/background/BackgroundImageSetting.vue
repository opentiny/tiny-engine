<template>
  <div class="background-image-setting">
    <div class="background-row line">
      <label class="row-label">类型</label>
      <tabs-group-configurator
        :options="state.typeLists"
        :modelValue="state.styleComponent"
        value-key="styleComponent"
        label-width="50"
        :effect="effect"
        :placement="placement"
        @update:modelValue="selectType"
      ></tabs-group-configurator>
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
import { ColorConfigurator, TabsGroupConfigurator } from '@opentiny/tiny-engine-configurator'
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
    ColorConfigurator,
    TabsGroupConfigurator,
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
      styleComponent: 'ColorOverlay',
      typeLists: [
        {
          content: '颜色叠加',
          icon: 'background-color',
          value: {
            styleComponent: 'ColorOverlay',
            imageUrl: 'linear-gradient(#000, #000)'
          }
        },
        {
          content: '线性渐变',
          icon: 'linear-gradient',
          value: {
            styleComponent: 'LinearGradient',
            imageUrl: 'linear-gradient(#000, #fff)'
          }
        },
        {
          content: '径向渐变',
          icon: 'radial-gradient',
          value: {
            styleComponent: 'RadialGradient',
            imageUrl: 'radial-gradient(circle at 50% 50%, #000, #fff)'
          }
        },
        {
          content: '背景图',
          icon: 'image',
          value: {
            styleComponent: 'ImageSetting',
            imageUrl: 'img/bgcModal.png',
            position: '0px 0px',
            size: 'auto'
          }
        }
      ]
    })

    const updateStyle = (property) => {
      emit('update:modelValue', { ...property, type: state.styleComponent })
    }

    const selectType = (value) => {
      let styleObj = {}

      if (value.styleComponent === 'ImageSetting') {
        styleObj = {
          [BACKGROUND_PROPERTY.BackgroundImage]: `url(${value.imageUrl})`,
          [BACKGROUND_PROPERTY.BackgroundPosition]: value.position,
          [BACKGROUND_PROPERTY.BackgroundSize]: value.size
        }
      } else {
        styleObj = {
          [BACKGROUND_PROPERTY.BackgroundImage]: value.imageUrl,
          [BACKGROUND_PROPERTY.BackgroundPosition]: null,
          [BACKGROUND_PROPERTY.BackgroundSize]: null,
          [BACKGROUND_PROPERTY.BackgroundRepeat]: null,
          [BACKGROUND_PROPERTY.BackgroundAttachment]: null
        }
      }

      state.styleComponent = value.styleComponent
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
      border: 1px solid var(--te-styles-common-border-color);
      color: var(--te-styles-common-text-color-primary);
      .row-content-item {
        flex: 1;
        padding: 4px 0;
        color: var(--te-styles-common-text-color-secondary);
        background: var(--te-styles-background-dialog-row-item-bg-color);
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
          background: var(--te-styles-common-border-color);
          display: inline-block;
          position: absolute;
          top: 0;
          right: 0;
        }

        &:hover {
          color: var(--te-styles-common-text-color-primary);
          background-color: var(--te-styles-background-dialog-row-item-bg-color);
        }

        &.selected {
          color: var(--te-styles-common-text-color-primary);
          background-color: var(--te-styles-background-dialog-row-item-bg-color-active);
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
    padding: 6px 0;
    position: relative;
    &::after {
      content: '';
      display: inline-block;
      width: calc(100% + 16px);
      height: 1px;
      background-color: var(--te-styles-background-dialog-line-bg-color);
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
