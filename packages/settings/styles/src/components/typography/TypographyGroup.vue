<template>
  <div class="typography-wrap">
    <div class="typography-font-row split">
      <div class="font-left typography-col">
        <label
          :class="[
            'typography-label',
            { 'is-setting': getSettingFlag(TYPO_PROPERTY.FontWeight) || getSettingFlag(TYPO_PROPERTY.FontFamily) }
          ]"
          @click="openSetting(`${TYPO_PROPERTY.FontFamily},${TYPO_PROPERTY.FontWeight}`, $event)"
        >
          <span>Font</span>
        </label>

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

      <div class="font-right typography-col">
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

    <div class="typography-row font-split">
      <div class="left typography-col">
        <label
          :class="['typography-label', { 'is-setting': getSettingFlag(TYPO_PROPERTY.FontSize) }]"
          @click="openSetting(TYPO_PROPERTY.FontSize, $event)"
        >
          <span>Size</span>
        </label>
        <div class="font-size">
          <select-configurator
            v-model="state.sizeValue"
            :options="sizeOptions"
            @update:modelValue="selectFontSize"
            allow-create
            filterable
            default-first-option
          ></select-configurator>
          px
        </div>
      </div>

      <div class="right typography-col">
        <label
          :class="['typography-label', { 'is-setting': getSettingFlag(TYPO_PROPERTY.LineHeight) }]"
          @click="openSetting(TYPO_PROPERTY.LineHeight, $event)"
        >
          <span>Height</span>
        </label>
        <numeric-select
          :name="getProperty(TYPO_PROPERTY.LineHeight).name"
          :numericalText="getProperty(TYPO_PROPERTY.LineHeight).text"
          @update="updateStyle"
        />
      </div>
    </div>

    <div class="typography-row">
      <div class="left">
        <label
          :class="['typography-label', { 'is-setting': getSettingFlag(TYPO_PROPERTY.Color) }]"
          @click="openSetting(TYPO_PROPERTY.Color, $event)"
        >
          <span>Color</span>
        </label>
        <div class="color-wrap">
          <color-configurator :modelValue="getProperty(TYPO_PROPERTY.Color).value" @change="changeColor" />
        </div>
      </div>
    </div>
    <div class="typography-row">
      <div class="left">
        <label
          :class="['typography-label', { 'is-setting': getSettingFlag(TYPO_PROPERTY.TextAlign) }]"
          @click="openSetting(TYPO_PROPERTY.TextAlign, $event)"
        >
          <span>对齐</span>
        </label>
      </div>
      <tabs-group-configurator
        :options="alignOptions"
        :modelValue="selectedAlign"
        :label-width="52"
        :effect="effect"
        :placement="placement"
        @update:modelValue="selectAlign"
      ></tabs-group-configurator>
    </div>
    <div class="typography-style-row">
      <div class="style-left">
        <label
          :class="[
            'typography-label',
            { 'is-setting': getSettingFlag(TYPO_PROPERTY.FontStyle) || getSettingFlag(TYPO_PROPERTY.TextDecoration) }
          ]"
          title="font-style"
          @click="openSetting(`${TYPO_PROPERTY.FontStyle},${TYPO_PROPERTY.TextDecoration}`, $event)"
        >
          <span>样式</span>
        </label>
      </div>
      <div class="style-decoration-wrap">
        <tabs-group-configurator
          :options="styleOptions"
          :modelValue="selectedFontStyle"
          :label-width="32"
          :effect="effect"
          :placement="placement"
          @update:modelValue="selectFontStyle"
        ></tabs-group-configurator>
        <tabs-group-configurator
          :options="decorationOptions"
          :modelValue="selectedTextDecoration"
          :label-width="32"
          :effect="effect"
          :placement="placement"
          @update:modelValue="selectTextDecoration"
        ></tabs-group-configurator>
      </div>
    </div>
    <modal-mask v-if="showModal" @close="showModal = false">
      <reset-button @reset="reset" />
    </modal-mask>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import NumericSelect from '../inputs/NumericSelect.vue'
import { ColorConfigurator, SelectConfigurator, TabsGroupConfigurator } from '@opentiny/tiny-engine-configurator'
import { TYPO_PROPERTY } from '../../js/styleProperty'
import useEvent from '../../js/useEvent'
import { useProperties } from '../../js/useStyle'
import ModalMask, { useModal } from '../inputs/ModalMask.vue'
import ResetButton from '../inputs/ResetButton.vue'

export default {
  components: {
    NumericSelect,
    ModalMask,
    ResetButton,
    ColorConfigurator,
    SelectConfigurator,
    TabsGroupConfigurator
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
    const { getProperty, getSettingFlag } = useProperties({
      names: Object.values(TYPO_PROPERTY),
      parseNumber: true
    })
    const { setPosition } = useModal()

    const fontFamilyOptions = [
      {
        label: '微软雅黑',
        value: '"Microsoft YaHei", "微软雅黑", sans-serif'
      },
      {
        label: '苹方',
        value: 'PingFang SC'
      },
      {
        label: '黑体',
        value: 'SimHei'
      },
      {
        label: '宋体',
        value: 'SimSun'
      },
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

    const sizes = ['9', '10', '11', '12', '14', '16', '18', '20', '24']
    const sizeOptions = sizes.map((size) => ({ label: size, value: size }))

    const alignOptions = [
      {
        icon: 'text-align-left',
        content: 'Left-左对齐',
        value: 'left'
      },
      {
        icon: 'text-align-center',
        content: 'Center-居中对齐',
        value: 'center'
      },
      {
        icon: 'text-align-right',
        content: 'Right-右对齐',
        value: 'right'
      },
      {
        icon: 'text-align-justify',
        content: 'Justify-两侧对齐',
        value: 'justify'
      }
    ]

    const styleOptions = [
      {
        icon: 'font-style-none',
        content: 'Regular-常规',
        value: 'normal'
      },
      {
        icon: 'font-style-italic',
        content: 'Italic-斜体',
        value: 'italic'
      }
    ]

    const decorationOptions = [
      {
        icon: 'cross',
        content: 'None-无',
        value: 'none'
      },
      {
        icon: 'text-decoration-strike',
        content: 'Strikethrough-删除线',
        value: 'line-through'
      },
      {
        icon: 'text-decoration-underline',
        content: 'Underline-下划线',
        value: 'underline'
      },
      {
        icon: 'text-decoration-overline',
        content: 'Overline-上划线',
        value: 'overline'
      }
    ]

    const openSetting = (name, event) => {
      let hasSettingFlag = false
      if (name.includes(',')) {
        hasSettingFlag = name.split(',').some((item) => {
          return getSettingFlag(item)
        })
      } else {
        hasSettingFlag = Boolean(getSettingFlag(name))
      }
      if (hasSettingFlag) {
        setPosition(event)
        activedName = name
        showModal.value = true
      }
    }

    const state = reactive({
      value: '400',
      fontFamilyValue: '"Microsoft YaHei", "微软雅黑", sans-serif',
      sizeValue: ''
    })

    const selectedAlign = ref('')

    const selectedFontStyle = ref('')

    const selectedTextDecoration = ref('')

    const updateStyle = (property) => {
      emit('update', property)
    }

    const reset = () => {
      if (activedName.includes(',')) {
        activedName.split(',').forEach((name) => {
          updateStyle({ [name]: null })
        })
      } else {
        updateStyle({ [activedName]: null })
      }
      if (activedName.includes(TYPO_PROPERTY.FontFamily) || activedName.includes(TYPO_PROPERTY.FontWeight)) {
        state.value = '400'
        state.fontFamilyValue = 'Arial, "Helvetica Neue", Helvetica'
      }
      if (activedName.includes(TYPO_PROPERTY.FontStyle) || activedName.includes(TYPO_PROPERTY.TextDecoration)) {
        selectedFontStyle.value = ''
        selectedTextDecoration.value = ''
      }
      if (activedName.includes(TYPO_PROPERTY.TextAlign)) {
        selectedAlign.value = ''
      }
      showModal.value = false
    }

    const changeColor = (value) => {
      const propertyName = TYPO_PROPERTY.Color
      const val = value?.target?.value || value || ''

      if (propertyName) {
        updateStyle({ [propertyName]: val })
      }
    }

    const selectAlign = (type) => {
      if (type) {
        selectedAlign.value = type
        updateStyle({ 'text-align': type })
      }
    }

    const selectFontStyle = (type) => {
      if (type) {
        selectedFontStyle.value = type
        updateStyle({ 'font-style': type })
      }
    }

    const selectTextDecoration = (type) => {
      if (type) {
        selectedTextDecoration.value = type
        updateStyle({ 'text-decoration': type })
      }
    }

    const selectFontWeight = (type) => {
      if (type) {
        updateStyle({ 'font-weight': type })
      }
    }

    const selectFontSize = (type) => {
      if (type) {
        updateStyle({ 'font-size': type + 'px' })
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
      selectedAlign,
      selectAlign,
      selectedFontStyle,
      selectFontStyle,
      selectedTextDecoration,
      selectTextDecoration,
      selectFontSize,
      openSetting,
      selectOptions,
      sizeOptions,
      state,
      selectFontWeight,
      fontFamilyOptions,
      styleOptions,
      decorationOptions,
      alignOptions,
      selectFontFamily
    }
  }
}
</script>

<style lang="less" scoped>
.typography-wrap {
  span {
    color: var(--te-styles-common-text-color-secondary);
    padding: 2px;
  }
  .typography-row {
    display: grid;
    gap: 4px 20px;
    grid-template-columns: 15px 1fr;
    align-items: center;
    margin-bottom: var(--te-common-vertical-item-spacing-normal);
    &:last-child {
      margin-bottom: 0;
    }

    &.split {
      grid-template-columns: 45% auto;
    }

    &.font-split {
      gap: 4px 8px;
      grid-template-columns: 56% auto;
    }

    &.more {
      grid-template-columns: 1fr;
    }

    .typography-label {
      margin-right: -16px;
      line-height: 16px;

      .font-family-col {
        width: 118px;
      }

      .font-weight-col {
        width: 84px;
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
      grid-template-columns: 23px 1fr;
    }

    .right {
      grid-template-columns: 40px 1fr;
      .typography-label {
        margin-right: 0;
      }
    }

    & > div {
      width: 100%;
    }
    .color-wrap {
      width: 210px;
    }
    .font-size {
      display: flex;
      font-size: 12px;
      color: var(--te-styles-common-text-color-weaken);
      align-items: center;
      gap: 4px;
    }
  }

  .typography-font-row {
    display: grid;
    gap: 4px 8px;
    grid-template-columns: 63% 1fr;
    align-items: center;
    margin-bottom: 8px;

    .font-left {
      display: grid;
      align-items: center;
      gap: 4px 20px;
    }
    .font-right {
      display: grid;
      align-items: center;
      gap: 4px 8px;
    }

    .font-left {
      grid-template-columns: 23px 1fr;
    }
  }

  .typography-style-row {
    display: grid;
    gap: 4px 20px;
    grid-template-columns: 15px 1fr;
    align-items: center;
    margin-bottom: 8px;
    color: var(--te-styles-common-text-color-secondary);

    .style-left {
      display: grid;
      align-items: center;
      gap: 4px 15px;
    }
    .style-right {
      display: grid;
      align-items: center;
      gap: 4px 8px;
    }

    .style-left {
      grid-template-columns: 28px 1fr;
    }

    .style-decoration-wrap {
      display: flex;
      gap: 18px;
    }
  }

  .typography-label {
    color: var(--te-styles-common-text-color-secondary);
  }
  .is-setting {
    span {
      cursor: pointer;
      border-radius: 2px;
      color: var(--te-styles-common-setting-text-color);
      background-color: var(--te-styles-common-setting-bg-color);
    }
  }
}

:deep(.tiny-select .tiny-input .tiny-input__inner) {
  padding: 0 var(--ti-input-suffix-padding-right) 0 var(--ti-input-suffix-padding-left);
}
</style>
