<template>
  <div class="effect-group line opacity-wrap">
    <label
      :class="['opacity-label', { 'is-setting': getSettingFlag(EFFECTS_PROPERTY.Opacity) }]"
      @click="openSetting(EFFECTS_PROPERTY.Opacity, $event)"
      >透明度</label
    >
    <div>
      <slider-configurator
        :modelValue="state.opacity"
        :controls="false"
        :showUnit="true"
        :disabled="true"
        @update:modelValue="updateOpacity"
      ></slider-configurator>
    </div>
  </div>
  <div class="effect-group line outline-wrap">
    <label
      :class="['outline-label', { 'is-setting': getSettingFlag(EFFECTS_PROPERTY.Outline) }]"
      @click="openSetting(EFFECTS_PROPERTY.Outline, $event)"
    >
      轮廓
    </label>
    <div class="outline-content">
      <tiny-tooltip effect="dark" placement="top" content="none-无">
        <div
          :class="['outline-content-svg', { selected: isOutlineStyleSelected(BORDER_STYLE_TYPE.None) }]"
          @click="selectOutlineStyle(BORDER_STYLE_TYPE.None)"
        >
          <svg-icon name="cross"></svg-icon>
        </div>
      </tiny-tooltip>
      <tiny-tooltip effect="dark" placement="top" content="solid-实线">
        <div
          :class="['outline-content-svg', { selected: isOutlineStyleSelected(BORDER_STYLE_TYPE.Solid) }]"
          @click="selectOutlineStyle(BORDER_STYLE_TYPE.Solid)"
        >
          <svg-icon name="border-style-solid"></svg-icon>
        </div>
      </tiny-tooltip>
      <tiny-tooltip effect="dark" placement="top" content="dashed-虚线">
        <div
          :class="['outline-content-svg', { selected: isOutlineStyleSelected(BORDER_STYLE_TYPE.Dashed) }]"
          @click="selectOutlineStyle(BORDER_STYLE_TYPE.Dashed)"
        >
          <svg-icon name="border-style-dashed"></svg-icon>
        </div>
      </tiny-tooltip>
      <tiny-tooltip effect="dark" placement="top" content="dotted-圆点">
        <div
          :class="['outline-content-svg', { selected: isOutlineStyleSelected(BORDER_STYLE_TYPE.Dotted) }]"
          @click="selectOutlineStyle(BORDER_STYLE_TYPE.Dotted)"
        >
          <svg-icon name="border-style-dotted"></svg-icon>
        </div>
      </tiny-tooltip>
    </div>
    <div v-if="state.activedType && state.activedType !== 'none'" class="outline-setting">
      <div class="outline-width">
        <label>宽度</label>
        <input-select
          :modelValue="state.outlineWidth"
          :suffixValue="state.outlineWidthSuffix"
          :options="outlineSuffixOptions"
          @input-change="outlineWidthChange"
          @select-change="outlineWidthSuffixChange"
        ></input-select>
        <label>偏移</label>
        <input-select
          :modelValue="state.outlineOffset"
          :suffixValue="state.outlineOffsetSuffix"
          :options="outlineSuffixOptions"
          @input-change="outlineOffsetChange"
          @select-change="outlineOffsetSuffixChange"
        ></input-select>
      </div>
      <div class="outline-color">
        <label>颜色</label>
        <color-configurator :modelValue="state.outlineColor" @change="changeOutlineColor" />
      </div>
    </div>
  </div>
  <div class="effect-group line cursor-wrap">
    <label
      :class="['cursor-label', { 'is-setting': getSettingFlag(EFFECTS_PROPERTY.Cursor) }]"
      @click="openSetting(EFFECTS_PROPERTY.Cursor, $event)"
      >光标</label
    >
    <div>
      <tiny-select v-model="state.cursorValue" placeholder="请选择" @change="cursorChange">
        <tiny-option-group
          v-for="group in cursorGroup"
          :key="group.label"
          :label="group.label"
          :disabled="group.disabled"
        >
          <tiny-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value">
            <div class="cursor-option">
              <span class="item-icon"><svg-icon :name="item.icon"></svg-icon></span>
              <span class="item-label">{{ item.label }}</span>
            </div>
          </tiny-option>
        </tiny-option-group>
      </tiny-select>
    </div>
  </div>
  <modal-mask v-if="state.showModal" @close="state.showModal = false">
    <reset-button @reset="reset" />
  </modal-mask>
</template>

<script>
import { reactive } from 'vue'
import { Select, Option, OptionGroup, Tooltip } from '@opentiny/vue'
import { ColorConfigurator, SliderConfigurator } from '@opentiny/tiny-engine-configurator'
import { ModalMask, useModalMask, ResetButton } from '@opentiny/tiny-engine-common'
import InputSelect from '../inputs/InputSelect.vue'
import { useProperties } from '../../js/useStyle'
import { EFFECTS_PROPERTY } from '../../js/styleProperty'
import { BORDER_STYLE_TYPE } from '../../js/cssType'

export default {
  components: {
    TinySelect: Select,
    TinyOption: Option,
    TinyOptionGroup: OptionGroup,
    TinyTooltip: Tooltip,
    SliderConfigurator,
    ColorConfigurator,
    ModalMask,
    ResetButton,
    InputSelect
  },
  props: {
    style: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update'],
  setup(props, { emit }) {
    let activedName = []

    const cursorGroup = [
      {
        label: 'General',
        options: [
          {
            value: 'auto',
            label: 'auto',
            icon: 'cursor-auto'
          },
          {
            value: 'default',
            label: 'default',
            icon: 'cursor-auto'
          },
          {
            value: 'none',
            label: 'none',
            icon: 'cursor-none'
          }
        ]
      },
      {
        label: 'Links & Status',
        options: [
          {
            value: 'pointer',
            label: 'pointer',
            icon: 'cursor-pointer'
          },
          {
            value: 'not-allowed',
            label: 'not-allowed',
            icon: 'cursor-not-allowed'
          },
          {
            value: 'wait',
            label: 'wait',
            icon: 'cursor-wait'
          },
          {
            value: 'progress',
            label: 'progress',
            icon: 'cursor-progress'
          },
          {
            value: 'help',
            label: 'help',
            icon: 'cursor-help'
          },
          {
            value: 'context-menu',
            label: 'context-menu',
            icon: 'cursor-context-menu'
          }
        ]
      },
      {
        label: 'Selection',
        options: [
          {
            value: 'cell',
            label: 'cell',
            icon: 'cursor-cell'
          },
          {
            value: 'crosshair',
            label: 'crosshair',
            icon: 'cursor-crosshair'
          },
          {
            value: 'text',
            label: 'text',
            icon: 'cursor-text'
          },
          {
            value: 'vertical-text',
            label: 'vertical-text',
            icon: 'cursor-vertical-text'
          }
        ]
      },
      {
        label: 'Drag & Drop',
        options: [
          {
            value: 'grab',
            label: 'grab',
            icon: 'cursor-grab'
          },
          {
            value: 'grabbing',
            label: 'grabbing',
            icon: 'cursor-grabbing'
          },
          {
            value: 'alias',
            label: 'alias',
            icon: 'cursor-alias'
          },
          {
            value: 'copy',
            label: 'copy',
            icon: 'cursor-copy'
          },
          {
            value: 'move',
            label: 'move',
            icon: 'cursor-move'
          }
        ]
      },
      {
        label: 'Zoom',
        options: [
          {
            value: 'zoom-in',
            label: 'zoom-in',
            icon: 'cursor-zoom-in'
          },
          {
            value: 'zoom-out',
            label: 'zoom-out',
            icon: 'cursor-zoom-out'
          }
        ]
      },
      {
        label: 'Resize',
        options: [
          {
            value: 'col-resize',
            label: 'col-resize',
            icon: 'cursor-col-resize'
          },
          {
            value: 'row-resize',
            label: 'row-resize',
            icon: 'cursor-row-resize'
          },
          {
            value: 'nesw-resize',
            label: 'nesw-resize',
            icon: 'cursor-nesw-resize'
          },
          {
            value: 'nwse-resize',
            label: 'nwse-resize',
            icon: 'cursor-nwse-resize'
          },
          {
            value: 'ew-resize',
            label: 'ew-resize',
            icon: 'cursor-ew-resize'
          },
          {
            value: 'ns-resize',
            label: 'ns-resize',
            icon: 'cursor-ns-resize'
          },
          {
            value: 'n-resize',
            label: 'n-resize',
            icon: 'cursor-n-resize'
          },
          {
            value: 'w-resize',
            label: 'w-resize',
            icon: 'cursor-w-resize'
          },
          {
            value: 's-resize',
            label: 's-resize',
            icon: 'cursor-s-resize'
          },
          {
            value: 'e-resize',
            label: 'e-resize',
            icon: 'cursor-e-resize'
          },
          {
            value: 'nw-resize',
            label: 'nw-resize',
            icon: 'cursor-nw-resize'
          },
          {
            value: 'ne-resize',
            label: 'ne-resize',
            icon: 'cursor-ne-resize'
          },
          {
            value: 'sw-resize',
            label: 'sw-resize',
            icon: 'cursor-sw-resize'
          },
          {
            value: 'se-resize',
            label: 'se-resize',
            icon: 'cursor-se-resize'
          }
        ]
      }
    ]

    const outlineSuffixOptions = [
      {
        label: 'PX',
        value: 'px'
      },
      {
        label: 'EM',
        value: 'em'
      },
      {
        label: 'REM',
        value: 'rem'
      },
      {
        label: 'CH',
        value: 'ch'
      },
      {
        label: 'VW',
        value: 'vw'
      },
      {
        label: 'VH',
        value: 'vh'
      }
    ]

    const state = reactive({
      opacity: 100,
      cursorValue: 'auto',
      activedType: null,
      outlineWidth: 3,
      outlineWidthSuffix: 'px',
      outlineOffset: 0,
      outlineOffsetSuffix: 'px',
      outlineColor: '#333333',
      showModal: false
    })

    const { setPosition } = useModalMask()

    const { getSettingFlag, getProperty } = useProperties({
      names: Object.values(EFFECTS_PROPERTY),
      parseNumber: true
    })

    const updateStyle = (properties) => {
      emit('update', properties)
    }

    const updateOpacity = (value) => {
      state.opacity = value
      updateStyle({
        [EFFECTS_PROPERTY.Opacity]: `${value / 100}`
      })
    }

    const cursorChange = (value) => {
      updateStyle({
        [EFFECTS_PROPERTY.Cursor]: value
      })
    }

    const openSetting = (name, event) => {
      if (getSettingFlag(name)) {
        if (name === 'outline') {
          activedName = [EFFECTS_PROPERTY.Outline, EFFECTS_PROPERTY.OutlineOffset]
        } else {
          activedName = [name]
        }
        setPosition(event)
        state.showModal = true
      }
    }

    const setOutlineStyle = () => {
      updateStyle({
        [EFFECTS_PROPERTY.Outline]: `${state.outlineWidth + state.outlineWidthSuffix} ${state.activedType} ${
          state.outlineColor
        }`
      })
    }

    const setOutlineOffset = () => {
      updateStyle({
        [EFFECTS_PROPERTY.OutlineOffset]: `${state.outlineOffset + state.outlineOffsetSuffix}`
      })
    }

    const isOutlineStyleSelected = (type) => {
      return state.activedType === type
    }

    const selectOutlineStyle = (type) => {
      state.activedType = type

      if (type === 'none') {
        updateStyle({ [EFFECTS_PROPERTY.Outline]: null, [EFFECTS_PROPERTY.OutlineOffset]: null })
      } else {
        setOutlineStyle()
        setOutlineOffset()
      }
    }

    const outlineWidthChange = (val) => {
      state.outlineWidth = val
      setOutlineStyle()
    }

    const outlineWidthSuffixChange = (val) => {
      state.outlineWidthSuffix = val
      setOutlineStyle()
    }

    const outlineOffsetChange = (val) => {
      state.outlineOffset = val
      setOutlineOffset()
    }

    const outlineOffsetSuffixChange = (val) => {
      state.outlineOffsetSuffix = val
      setOutlineOffset()
    }

    const changeOutlineColor = (val) => {
      state.outlineColor = val?.target?.value || val || ''
      setOutlineStyle()
    }

    const reset = () => {
      activedName?.forEach((name) => {
        updateStyle({ [name]: null })
      })
      state.cursorValue = 'auto'
      state.activedType = null
      state.outlineWidth = 3
      state.outlineOffset = 0
      state.outlineColor = '#333333'
      state.outlineWidthSuffix = 'px'
      state.outlineOffsetSuffix = 'px'
      state.showModal = false
    }

    return {
      state,
      cursorGroup,
      EFFECTS_PROPERTY,
      BORDER_STYLE_TYPE,
      outlineSuffixOptions,
      updateOpacity,
      getSettingFlag,
      openSetting,
      reset,
      cursorChange,
      isOutlineStyleSelected,
      selectOutlineStyle,
      outlineWidthChange,
      outlineWidthSuffixChange,
      outlineOffsetChange,
      outlineOffsetSuffixChange,
      changeOutlineColor,
      getProperty
    }
  }
}
</script>

<style lang="less" scoped>
.effect-group {
  display: grid;
  gap: 8px;
  grid-template-columns: 44px auto;
  align-items: center;
  padding: 8px 0;

  .opacity-label,
  .outline-label,
  .cursor-label {
    color: var(--ti-lowcode-component-setting-panel-label-color);
  }

  .is-setting {
    color: var(--ti-lowcode-style-setting-label-color);
    background-color: var(--ti-lowcode-style-setting-label-bg);
  }

  :deep(.slider-container) {
    .mate-numeric-input .mate-numeric-unit .tiny-select .tiny-input .tiny-input__inner {
      background-color: transparent;
    }
  }

  .outline-content {
    display: flex;
    color: var(--ti-lowcode-component-setting-panel-icon-color);
    .outline-content-svg {
      flex: 1;
      padding: 4px;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      &:hover,
      &.selected {
        svg {
          color: var(--ti-lowcode-property-active-color);
        }
      }
    }
  }
  .outline-setting {
    grid-column: 1 / -1;
    .outline-width {
      display: grid;
      grid-template-columns: 44px 1fr 1fr 1fr;
      gap: 8px;
      align-items: center;
    }
    .outline-color {
      display: grid;
      grid-template-columns: 44px auto;
      gap: 8px;
      align-items: center;
      margin-top: 8px;
    }
  }
}
</style>
