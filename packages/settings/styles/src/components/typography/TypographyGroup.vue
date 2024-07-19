<template>
  <div class="typography-wrap">
    <div class="typography-row split">
      <div class="left typography-col">
        <label
          :class="['typography-label', { 'is-setting': getSettingFlag(TYPO_PROPERTY.FontSize) }]"
          @click="openSetting(TYPO_PROPERTY.FontSize, $event)"
          >字号</label
        >
        <numeric-select
          :name="getProperty(TYPO_PROPERTY.FontSize).name"
          :numericalText="getProperty(TYPO_PROPERTY.FontSize).text"
          @update="updateStyle"
        />
      </div>

      <div class="right typography-col">
        <div
          :class="['typography-label', { 'is-setting': getSettingFlag(TYPO_PROPERTY.FontFamily) }]"
          @click="openSetting(TYPO_PROPERTY.FontFamily, $event)"
        >
          字体
        </div>
        <div class="typography-select">
          <select-configurator
            v-model="state.fontFamilyValue"
            :options="fontFamilyOptions"
            @update:modelValue="selectFontFamily"
            allow-create
            filterable
            default-first-option
          ></select-configurator>
        </div>
      </div>
    </div>

    <div class="typography-row split line">
      <div class="left typography-col">
        <label
          :class="['typography-label', { 'is-setting': getSettingFlag(TYPO_PROPERTY.LineHeight) }]"
          @click="openSetting(TYPO_PROPERTY.LineHeight, $event)"
          >行高</label
        >
        <numeric-select
          :name="getProperty(TYPO_PROPERTY.LineHeight).name"
          :numericalText="getProperty(TYPO_PROPERTY.LineHeight).text"
          @update="updateStyle"
        />
      </div>

      <div class="right typography-col">
        <div
          :class="['typography-label', { 'is-setting': getSettingFlag(TYPO_PROPERTY.FontWeight) }]"
          @click="openSetting(TYPO_PROPERTY.FontWeight, $event)"
        >
          字重
        </div>
        <div class="typography-select">
          <select-configurator
            v-model="state.value"
            :options="selectOptions"
            @update:modelValue="selectFontWeight"
            allow-create
            filterable
            default-first-option
          ></select-configurator>
        </div>
      </div>
    </div>

    <div class="typography-row">
      <label
        :class="['typography-label', { 'is-setting': getSettingFlag(TYPO_PROPERTY.Color) }]"
        @click="openSetting(TYPO_PROPERTY.Color, $event)"
        >颜色</label
      >
      <color-configurator :modelValue="getProperty(TYPO_PROPERTY.Color).value" @change="changeColor" />
    </div>
    <div class="typography-row">
      <label
        :class="['typography-label', { 'is-setting': getSettingFlag(TYPO_PROPERTY.TextAlign) }]"
        @click="openSetting(TYPO_PROPERTY.TextAlign, $event)"
        >对齐</label
      >
      <div class="typography-content">
        <tiny-tooltip :effect="effect" :placement="placement" content="Left-左对齐">
          <div :class="['typography-content-item', { selected: isAlignSelected('left') }]" @click="selectAlign('left')">
            <svg-icon name="text-align-left" class="bem-Svg"></svg-icon>
          </div>
        </tiny-tooltip>

        <tiny-tooltip :effect="effect" :placement="placement" content="Center-居中对齐">
          <div
            :class="['typography-content-item', { selected: isAlignSelected('center') }]"
            @click="selectAlign('center')"
          >
            <svg-icon name="text-align-center" class="bem-Svg"></svg-icon>
          </div>
        </tiny-tooltip>

        <tiny-tooltip :effect="effect" :placement="placement" content="Right-右对齐">
          <div
            :class="['typography-content-item', { selected: isAlignSelected('right') }]"
            @click="selectAlign('right')"
          >
            <svg-icon name="text-align-right" class="bem-Svg"></svg-icon>
          </div>
        </tiny-tooltip>

        <tiny-tooltip :effect="effect" :placement="placement" content="Justify-两侧对齐">
          <div
            :class="['typography-content-item', { selected: isAlignSelected('justify') }]"
            @click="selectAlign('justify')"
          >
            <svg-icon name="text-align-justify" class="bem-Svg"></svg-icon>
          </div>
        </tiny-tooltip>
      </div>
    </div>
    <div class="typography-row">
      <label
        :class="['typography-label', { 'is-setting': getSettingFlag(TYPO_PROPERTY.FontStyle) }]"
        title="font-style"
        @click="openSetting(TYPO_PROPERTY.FontStyle, $event)"
        >风格</label
      >
      <div class="typography-style">
        <div class="typography-content italicize">
          <tiny-tooltip :effect="effect" :placement="placement" content="Regular-常规">
            <div
              :class="['typography-content-item', { selected: isFontStyleSelected('normal') }]"
              @click="selectFontStyle('normal')"
            >
              <svg-icon name="font-style-none" class="bem-Svg"></svg-icon>
            </div>
          </tiny-tooltip>

          <tiny-tooltip :effect="effect" :placement="placement" content="Italic-斜体">
            <div
              :class="['typography-content-item', { selected: isFontStyleSelected('italic') }]"
              @click="selectFontStyle('italic')"
            >
              <svg-icon name="font-style-italic" class="bem-Svg"></svg-icon>
            </div>
          </tiny-tooltip>
        </div>
      </div>
    </div>
    <div class="typography-row">
      <label
        :class="['typography-label', { 'is-setting': getSettingFlag(TYPO_PROPERTY.TextDecoration) }]"
        title="font-decoration"
        @click="openSetting(TYPO_PROPERTY.TextDecoration, $event)"
        >修饰</label
      >
      <div class="typography-content decoration">
        <tiny-tooltip :effect="effect" :placement="placement" content="None-无">
          <div
            :class="['typography-content-item', { selected: isTextDecorationSelected('none') }]"
            @click="selectTextDecoration('none')"
          >
            <svg-icon name="cross" class="bem-Svg"></svg-icon>
          </div>
        </tiny-tooltip>

        <tiny-tooltip :effect="effect" :placement="placement" content="Strikethrough-删除线">
          <div
            :class="['typography-content-item', { selected: isTextDecorationSelected('line-through') }]"
            @click="selectTextDecoration('line-through')"
          >
            <svg-icon name="text-decoration-strike" class="bem-Svg"></svg-icon>
          </div>
        </tiny-tooltip>

        <tiny-tooltip :effect="effect" :placement="placement" content="Underline-下划线">
          <div
            :class="['typography-content-item', { selected: isTextDecorationSelected('underline') }]"
            @click="selectTextDecoration('underline')"
          >
            <svg-icon name="text-decoration-underline" class="bem-Svg"></svg-icon>
          </div>
        </tiny-tooltip>

        <tiny-tooltip :effect="effect" :placement="placement" content="Overline-上划线">
          <div
            :class="['typography-content-item', { selected: isTextDecorationSelected('overline') }]"
            @click="selectTextDecoration('overline')"
          >
            <svg-icon name="text-decoration-overline" class="bem-Svg"></svg-icon>
          </div>
        </tiny-tooltip>
      </div>
    </div>

    <modal-mask v-if="showModal" @close="showModal = false">
      <reset-button @reset="reset" />
    </modal-mask>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { Tooltip } from '@opentiny/vue'
import NumericSelect from '../inputs/NumericSelect.vue'
import { ColorConfigurator, SelectConfigurator } from '@opentiny/tiny-engine-configurator'
import { TYPO_PROPERTY } from '../../js/styleProperty'
import useEvent from '../../js/useEvent'
import { useProperties } from '../../js/useStyle'
import { ModalMask, useModalMask, ResetButton } from '@opentiny/tiny-engine-common'

export default {
  components: {
    NumericSelect,
    ModalMask,
    ResetButton,
    ColorConfigurator,
    TinyTooltip: Tooltip,
    SelectConfigurator
  },
  props: {
    style: {
      type: Object,
      default: () => ({})
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
  emits: useEvent(),
  setup(props, { emit }) {
    let activedName = ''
    const showModal = ref(false)
    const { getProperty, getSettingFlag, getPropertyValue } = useProperties({
      names: Object.values(TYPO_PROPERTY),
      parseNumber: true
    })
    const { setPosition } = useModalMask()

    const fontFamilyOptions = [
      {
        label: 'Arial',
        value: 'Arial, "Helvetica Neue", Helvetica'
      },
      {
        label: 'Bitter',
        value: 'Bitter'
      },
      {
        label: 'Changa One',
        value: '"Changa One", Impact'
      },
      {
        label: 'Droid Sans',
        value: '"Droid Sans"'
      },
      {
        label: 'Droid Serif',
        value: '"Droid Serif"'
      },
      {
        label: 'Exo',
        value: 'Exo'
      },
      {
        label: 'Georgia',
        value: 'Georgia, Times, "Times New Roman"'
      },
      {
        label: 'Great Vibes',
        value: '"Great Vibes"'
      },
      {
        label: 'Impact',
        value: 'Impact, Haettenschweiler, "Franklin Gothic Bold", Charcoal'
      },
      {
        label: 'Inconsolata',
        value: 'Inconsolata'
      },
      {
        label: 'Lato',
        value: 'Lato'
      },
      {
        label: 'Merriweather',
        value: 'Merriweather'
      },
      {
        label: 'Montserrat',
        value: 'Montserrat'
      },
      {
        label: 'Open Sans',
        value: '"Open Sans"'
      },
      {
        label: 'Oswald',
        value: 'Oswald'
      },
      {
        label: 'PT Sans',
        value: '"PT Sans"'
      },
      {
        label: 'PT Serif',
        value: '"PT Serif"'
      },
      {
        label: 'Palatino Linotype',
        value: '"Palatino Linotype", "Book Antiqua", Palatino'
      },
      {
        label: 'Tahoma',
        value: 'Tahoma, Verdana, Segoe'
      },
      {
        label: 'Times New Roman',
        value: '"Times New Roman", TimesNewRoman, Times, Baskerville, Georgia'
      },
      {
        label: 'Trebuchet MS',
        value: '"Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", "Lucida Sans", Tahoma'
      },
      {
        label: 'Ubuntu',
        value: 'Ubuntu, Helvetica'
      },
      {
        label: 'Varela',
        value: 'Varela'
      },
      {
        label: 'Varela Round',
        value: '"Varela Round"'
      },
      {
        label: 'Verdana',
        value: 'Verdana, Geneva'
      },
      {
        label: 'Vollkorn',
        value: 'Vollkorn'
      },
      {
        label: 'system-ui',
        value:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue"'
      }
    ]

    const selectOptions = [
      {
        label: '100-Thin',
        value: '100'
      },
      {
        label: '400-Normal',
        value: '400'
      },
      {
        label: '700-Bold',
        value: '700'
      },
      {
        label: '900-Black',
        value: '900'
      }
    ]

    const openSetting = (name, event) => {
      if (getSettingFlag(name)) {
        setPosition(event)
        activedName = name
        showModal.value = true
      }
    }

    const state = reactive({
      value: '400',
      fontFamilyValue: 'Arial, "Helvetica Neue", Helvetica'
    })

    const updateStyle = (property) => {
      emit('update', property)
    }

    const reset = () => {
      updateStyle({ [activedName]: null })
      state.value = '400'
      showModal.value = false
    }

    const changeColor = (value) => {
      const propertyName = TYPO_PROPERTY.Color
      const val = value?.target?.value || value || ''

      if (propertyName) {
        updateStyle({ [propertyName]: val })
      }
    }

    const isAlignSelected = (type) => type === getPropertyValue(TYPO_PROPERTY.TextAlign)

    const selectAlign = (type) => {
      if (type) {
        updateStyle({ 'text-align': type })
      }
    }

    const isFontStyleSelected = (type) => type === getPropertyValue(TYPO_PROPERTY.FontStyle)

    const selectFontStyle = (type) => {
      if (type) {
        updateStyle({ 'font-style': type })
      }
    }

    const isTextDecorationSelected = (type) => type === getPropertyValue(TYPO_PROPERTY.TextDecoration)

    const selectTextDecoration = (type) => {
      if (type) {
        updateStyle({ 'text-decoration': type })
      }
    }

    const selectFontWeight = (type) => {
      if (type) {
        updateStyle({ 'font-weight': type })
      }
    }

    const selectFontFamily = (type) => {
      if (type) {
        updateStyle({ [TYPO_PROPERTY.FontFamily]: type })
      }
    }

    return {
      reset,
      showModal,
      TYPO_PROPERTY,
      getProperty,
      getSettingFlag,
      updateStyle,
      changeColor,
      isAlignSelected,
      selectAlign,
      isFontStyleSelected,
      selectFontStyle,
      selectTextDecoration,
      isTextDecorationSelected,
      openSetting,
      selectOptions,
      state,
      selectFontWeight,
      fontFamilyOptions,
      selectFontFamily
    }
  }
}
</script>

<style lang="less" scoped>
.typography-wrap {
  .typography-row {
    display: grid;
    gap: 4px 20px;
    grid-template-columns: 15px 1fr;
    align-items: center;
    margin-bottom: 8px;

    &.line {
      position: relative;
      padding-bottom: 10px;
      &::after {
        content: '';
        height: 1px;
        width: calc(100% + 32px);
        background: var(--ti-lowcode-toolbar-border-color);
        position: absolute;
        bottom: 0;
        left: -16px;
      }
    }

    &.split {
      grid-template-columns: 45% auto;
    }

    &.more {
      grid-template-columns: 1fr;
    }

    .typography-label {
      margin-right: -16px;
      align-self: flex-start;
      line-height: 26px;
      color: var(--ti-lowcode-component-setting-panel-label-color);
    }

    .typography-content {
      flex: auto;
      display: flex;

      .typography-content-item {
        padding: 4px 5px;
        font-size: 16px;
        color: var(--ti-lowcode-component-setting-panel-icon-color);
        position: relative;
        display: flex;
        justify-content: center;

        &:hover {
          color: var(--ti-lowcode-property-hover-color);
        }

        &.selected {
          color: var(--ti-lowcode-property-active-color);
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

    .typography-style {
      display: grid;
      gap: 4px 8px;
      grid-template-columns: 2fr 4fr;
    }

    .typography-italicize {
      grid-row-start: 2;
      justify-self: center;
      cursor: default;
    }

    .typography-decoration {
      justify-self: center;
      cursor: default;
    }

    .left {
      display: grid;
      align-items: center;
      gap: 4px 20px;
    }
    .right {
      display: grid;
      align-items: center;
      gap: 4px 8px;
    }

    .left {
      grid-template-columns: 15px 1fr;
    }

    .right {
      grid-template-columns: auto 1fr;
      .typography-label {
        margin-right: 0;
      }
    }

    & > div {
      width: 100%;
    }

    .is-setting {
    }
  }
}

:deep(.tiny-select .tiny-input .tiny-input__inner) {
  padding: 0 var(--ti-input-suffix-padding-right) 0 var(--ti-input-suffix-padding-left);
}
</style>
