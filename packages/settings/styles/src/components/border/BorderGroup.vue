<template>
  <div :class="['radius-row', { 'show-border': isRaduisSelected(RADIUS_SETTING.Single) }]">
    <div
      :class="['radius-label', { 'is-setting': isRadiusSetting() }]"
      @click="openSetting(BORDER_RADIUS_PROPERTY.BorderRadius, $event)"
    >
      圆角
    </div>
    <div class="radius-content">
      <tiny-tooltip :effect="effect" :placement="placement" content="所有边框">
        <div
          :class="['radius-content-svg', { selected: isRaduisSelected(RADIUS_SETTING.Single) }]"
          @click="selectRaduis(RADIUS_SETTING.Single)"
        >
          <svg-icon name="border-radius-single" class="bem-svg"></svg-icon>
        </div>
      </tiny-tooltip>

      <tiny-tooltip :effect="effect" :placement="placement" content="分别定义">
        <div
          :class="['radius-content-svg', { selected: isRaduisSelected(RADIUS_SETTING.Multiple) }]"
          @click="selectRaduis(RADIUS_SETTING.Multiple)"
        >
          <svg-icon name="border-radius-multiple" class="bem-svg"></svg-icon>
        </div>
      </tiny-tooltip>

      <div v-show="isRaduisSelected(RADIUS_SETTING.Single)" class="radius-content-input">
        <slider-configurator
          :modelValue="borderRadius.BorderRadius"
          class="adjust-vertical"
          :controls="false"
          :showUnit="true"
          :selectedUnit="'px'"
          @update:modelValue="updateRadiusSingle"
        ></slider-configurator>
      </div>

      <div v-show="isRaduisSelected(RADIUS_SETTING.Multiple)" class="radius-multiple">
        <div class="radius-content">
          <tiny-tooltip :effect="effect" :placement="placement" content="top left corner">
            <!-- <div class="radius-content-svg">
              <svg-icon name="border-radius-topleft" class="bem-svg"></svg-icon>
            </div> -->
            <div class="radius-content-input">
              <numeric-select
                :name="getProperty(BORDER_RADIUS_PROPERTY.BorderTopLeftRadius).name"
                :numericalText="borderRadius.BorderTopLeftRadius"
                :placeholder="0"
                @update="updateStyle"
              />
            </div>
          </tiny-tooltip>
        </div>

        <div class="radius-content">
          <tiny-tooltip :effect="effect" :placement="placement" content="top right corner">
            <div class="radius-content-input">
              <numeric-select
                :name="getProperty(BORDER_RADIUS_PROPERTY.BorderTopRightRadius).name"
                :numericalText="borderRadius.BorderTopRightRadius"
                :placeholder="0"
                @update="updateStyle"
              />
            </div>
          </tiny-tooltip>
        </div>

        <div class="radius-content">
          <tiny-tooltip :effect="effect" :placement="placement" content="bottom left corner">
            <div class="radius-content-input">
              <numeric-select
                :name="getProperty(BORDER_RADIUS_PROPERTY.BorderBottomLeftRadius).name"
                :numericalText="borderRadius.BorderBottomLeftRadius"
                :placeholder="0"
                @update="updateStyle"
              />
            </div>
          </tiny-tooltip>
        </div>

        <div class="radius-content">
          <tiny-tooltip :effect="effect" :placement="placement" content="bottom right corner">
            <div class="radius-content-input">
              <numeric-select
                :name="getProperty(BORDER_RADIUS_PROPERTY.BorderBottomRightRadius).name"
                :placeholder="0"
                :numericalText="borderRadius.BorderBottomRightRadius"
                @update="updateStyle"
              />
            </div>
          </tiny-tooltip>
        </div>
      </div>
    </div>
  </div>

  <div class="border-label">
    <span
      :class="{ 'is-setting': isBorderSetting(), 'set-border-style': true }"
      @click="openSetting(BORDER_PROPERTY.Border, $event)"
      >边框</span
    >
    <div class="border-input-left">
      <div
        :class="['row-item', { selected: isBorderSelected(BORDER_SETTING.All) }]"
        title="全边框"
        @click="selectBorder(BORDER_SETTING.All)"
      >
        <svg-icon name="border-all" class="bem-svg"></svg-icon>
      </div>
      <div
        :class="['row-item', { selected: isBorderSelected(BORDER_SETTING.Left) }]"
        title="左边框"
        @click="selectBorder(BORDER_SETTING.Left)"
      >
        <svg-icon name="border-left" class="bem-svg"></svg-icon>
      </div>

      <div
        :class="['row-item', { selected: isBorderSelected(BORDER_SETTING.Top) }]"
        title="上边框"
        @click="selectBorder(BORDER_SETTING.Top)"
      >
        <svg-icon name="border-top" class="bem-svg"></svg-icon>
      </div>

      <div
        :class="['row-item', { selected: isBorderSelected(BORDER_SETTING.Bottom) }]"
        title="下边框"
        @click="selectBorder(BORDER_SETTING.Bottom)"
      >
        <svg-icon name="border-bottom" class="bem-svg"></svg-icon>
      </div>

      <div
        :class="['row-item', { selected: isBorderSelected(BORDER_SETTING.Right) }]"
        title="右边框"
        @click="selectBorder(BORDER_SETTING.Right)"
      >
        <svg-icon name="border-right" class="bem-svg"></svg-icon>
      </div>
      <div class="row-item"></div>
    </div>
  </div>
  <div class="border-input">
    <div class="border-input-right">
      <div class="border-row">
        <div class="border-label">
          <span
            :class="{ 'is-setting': isBorderColorSetting() }"
            @click="openSetting(BORDER_PROPERTY.BorderColor, $event)"
            >颜色</span
          >
        </div>
        <div class="border-content">
          <color-configurator :modelValue="borderColorValue" @change="changeBorderColor"></color-configurator>
        </div>
      </div>
      <div class="border-row">
        <div class="border-label">
          <span
            :class="{ 'is-setting': isBorderWidthSetting() }"
            @click="openSetting(BORDER_PROPERTY.BorderWidth, $event)"
            >宽度</span
          >
        </div>
        <div class="border-content border-width">
          <numeric-select
            :name="borderWidthValue.name"
            :numericalText="borderWidthValue.text"
            :property="borderWidthValue"
            @update="updateStyle"
          />
        </div>
        <div class="border-label">
          <span
            :class="{ 'is-setting': isBorderStyleSetting() }"
            @click="openSetting(BORDER_PROPERTY.BorderStyle, $event)"
            >样式</span
          >
        </div>
        <div class="border-content style">
          <tiny-tooltip :effect="effect" :placement="placement" content="none-无">
            <div
              :class="['border-content-svg', { selected: isBorderStyleSelected(BORDER_STYLE_TYPE.None) }]"
              @click="selectBorderStyle(BORDER_STYLE_TYPE.None)"
            >
              <svg-icon name="cross" class="bem-svg"></svg-icon>
            </div>
          </tiny-tooltip>
          <tiny-tooltip :effect="effect" :placement="placement" content="solid-实线">
            <div
              :class="['border-content-svg', { selected: isBorderStyleSelected(BORDER_STYLE_TYPE.Solid) }]"
              @click="selectBorderStyle(BORDER_STYLE_TYPE.Solid)"
            >
              <svg-icon name="border-style-solid" class="bem-svg"></svg-icon>
            </div>
          </tiny-tooltip>
          <tiny-tooltip :effect="effect" :placement="placement" content="dashed-虚线">
            <div
              :class="['border-content-svg', { selected: isBorderStyleSelected(BORDER_STYLE_TYPE.Dashed) }]"
              @click="selectBorderStyle(BORDER_STYLE_TYPE.Dashed)"
            >
              <svg-icon name="border-style-dashed" class="bem-svg"></svg-icon>
            </div>
          </tiny-tooltip>
          <tiny-tooltip :effect="effect" :placement="placement" content="dotted-圆点">
            <div
              :class="['border-content-svg', { selected: isBorderStyleSelected(BORDER_STYLE_TYPE.Dotted) }]"
              @click="selectBorderStyle(BORDER_STYLE_TYPE.Dotted)"
            >
              <svg-icon name="border-style-dotted" class="bem-svg"></svg-icon>
            </div>
          </tiny-tooltip>
        </div>
      </div>
      <div class="border-row"></div>
    </div>
  </div>

  <modal-mask v-if="state.showModal" @close="state.showModal = false">
    <reset-button @reset="reset"></reset-button>
  </modal-mask>
</template>

<script>
import { computed, reactive, watch } from 'vue'
import { Tooltip } from '@opentiny/vue'
import { ModalMask, useModalMask, ResetButton } from '@opentiny/tiny-engine-common'
import NumericSelect from '../inputs/NumericSelect.vue'
import { ColorConfigurator, SliderConfigurator } from '@opentiny/tiny-engine-configurator'
import useEvent from '../../js/useEvent'
import { useProperties } from '../../js/useStyle'
import { RADIUS_SETTING, BORDER_SETTING, BORDER_STYLE_TYPE } from '../../js/cssType'
import { BORDER_PROPERTY, BORDER_RADIUS_PROPERTY } from '../../js/styleProperty'

const BORDER_STYLE = {
  [BORDER_SETTING.All]: BORDER_PROPERTY.BorderStyle,
  [BORDER_SETTING.Top]: BORDER_PROPERTY.BorderTopStyle,
  [BORDER_SETTING.Right]: BORDER_PROPERTY.BorderRightStyle,
  [BORDER_SETTING.Bottom]: BORDER_PROPERTY.BorderBottomStyle,
  [BORDER_SETTING.Left]: BORDER_PROPERTY.BorderLeftStyle
}

const BORDER_WIDTH = {
  [BORDER_SETTING.All]: BORDER_PROPERTY.BorderWidth,
  [BORDER_SETTING.Top]: BORDER_PROPERTY.BorderTopWidth,
  [BORDER_SETTING.Right]: BORDER_PROPERTY.BorderRightWidth,
  [BORDER_SETTING.Bottom]: BORDER_PROPERTY.BorderBottomWidth,
  [BORDER_SETTING.Left]: BORDER_PROPERTY.BorderLeftWidth
}

const BORDER_COLOR = {
  [BORDER_SETTING.All]: BORDER_PROPERTY.BorderColor,
  [BORDER_SETTING.Top]: BORDER_PROPERTY.BorderTopColor,
  [BORDER_SETTING.Right]: BORDER_PROPERTY.BorderRightColor,
  [BORDER_SETTING.Bottom]: BORDER_PROPERTY.BorderBottomColor,
  [BORDER_SETTING.Left]: BORDER_PROPERTY.BorderLeftColor
}

export default {
  components: {
    SliderConfigurator,
    ModalMask,
    ResetButton,
    ColorConfigurator,
    NumericSelect,
    TinyTooltip: Tooltip
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

    const state = reactive({
      showModal: false,
      activedRadius: RADIUS_SETTING.Single,
      activedBorder: BORDER_SETTING.All,
      // 标记是否从 props 来的更新
      isUpdateFromProps: false
    })

    const { setPosition } = useModalMask()

    const { getProperty, getSettingFlag, getPropertyValue } = useProperties({
      names: Object.values({ ...BORDER_RADIUS_PROPERTY, ...BORDER_PROPERTY }),
      parseNumber: true
    })

    const updateStyle = (properties) => {
      emit('update', properties)
    }

    const reset = () => {
      const properties = {}

      if (BORDER_RADIUS_PROPERTY.BorderRadius === activedName) {
        Object.values(BORDER_RADIUS_PROPERTY).forEach((name) => {
          properties[name] = null
        })
      } else if (BORDER_PROPERTY.Border === activedName) {
        Object.values(BORDER_PROPERTY).forEach((name) => {
          properties[name] = null
        })
      } else {
        properties[activedName] = null
      }

      updateStyle(properties)
      state.showModal = false
    }

    const borderRadius = reactive({
      BorderRadius: 0,
      BorderTopLeftRadius: 0,
      BorderTopRightRadius: 0,
      BorderBottomLeftRadius: 0,
      BorderBottomRightRadius: 0
    })

    watch(
      () => props.style,
      () => {
        state.isUpdateFromProps = true
        borderRadius.BorderRadius = parseInt(props.style.borderRadius || 0)
        borderRadius.BorderTopLeftRadius = parseInt(props.style.borderTopLeftRadius || 0)
        borderRadius.BorderTopRightRadius = parseInt(props.style.borderTopRightRadius || 0)
        borderRadius.BorderBottomLeftRadius = parseInt(props.style.borderBottomLeftRadius || 0)
        borderRadius.BorderBottomRightRadius = parseInt(props.style.borderBottomRightRadius || 0)
      },
      { immediate: true }
    )

    const selectRaduis = (type) => {
      if (type) {
        state.activedRadius = type

        // 切换圆角设置类型时，需要将上一个类型设置的值重置，不然会有设置不统一的问题
        if (type === RADIUS_SETTING.Multiple) {
          updateStyle({
            [BORDER_RADIUS_PROPERTY.BorderRadius]: 0
          })
        } else {
          updateStyle({
            [BORDER_RADIUS_PROPERTY.BorderTopLeftRadius]: 0,
            [BORDER_RADIUS_PROPERTY.BorderTopRightRadius]: 0,
            [BORDER_RADIUS_PROPERTY.BorderBottomLeftRadius]: 0,
            [BORDER_RADIUS_PROPERTY.BorderBottomRightRadius]: 0
          })
        }
      }
    }

    const isRaduisSelected = (type) => type === state.activedRadius

    const isRadiusSetting = () => {
      let isSetting = false

      Object.values(BORDER_RADIUS_PROPERTY).forEach((name) => {
        if (getSettingFlag(name)) {
          isSetting = true
        }
      })

      return isSetting
    }

    const updateRadiusSingle = (value, unit = 'px') => {
      /**
       * 考虑如下场景：
       * 1. 用户在 monacoEditor 更新了样式 border-radius: 9px 然后保存，该组件接收并同步改值
       * 2. 用户在 monacoEditor 删除了 border-radius: 9px 的样式，然后 watch 函数（props.style），重新计算得到值 0
       * 3. 0 更新后，会再触发改函数更新，导致自动加上了 border-radius: 0px 的样式
       * 所以从 props 来的更新不需要再调用一遍 updateStyle（更新 props 数据）
       */
      if (state.isUpdateFromProps) {
        state.isUpdateFromProps = false
        return
      }
      borderRadius.BorderRadius = value

      updateStyle({
        [BORDER_RADIUS_PROPERTY.BorderRadius]: `${value}${unit}`
      })
    }

    const isBorderSetting = () => {
      let isSetting = false

      Object.values(BORDER_PROPERTY).forEach((name) => {
        if (getSettingFlag(name)) {
          isSetting = true
        }
      })

      return isSetting
    }

    const selectBorder = (type) => {
      if (type) {
        state.activedBorder = type
      }
    }

    const isBorderSelected = (type) => type === state.activedBorder

    const isBorderStyleSetting = () => {
      let isSetting = false
      const propertyName = BORDER_STYLE[state.activedBorder]

      if (propertyName) {
        isSetting = getSettingFlag(propertyName)
      }

      return isSetting
    }

    const selectBorderStyle = (type) => {
      if (type) {
        const propertyName = BORDER_STYLE[state.activedBorder]

        if (propertyName) {
          updateStyle({ [propertyName]: type })
        }
      }
    }

    const isBorderStyleSelected = (type) => {
      let flag = false
      const propertyName = BORDER_STYLE[state.activedBorder]

      if (propertyName) {
        flag = type === getPropertyValue(propertyName)
      }

      return flag
    }

    const borderWidthValue = computed(() => {
      let property = {}
      const propertyName = BORDER_WIDTH[state.activedBorder]

      if (propertyName) {
        property = getProperty(propertyName)
      }

      return property
    })

    const isBorderWidthSetting = () => {
      let isSetting = false
      const propertyName = BORDER_WIDTH[state.activedBorder]

      if (propertyName) {
        isSetting = getSettingFlag(propertyName)
      }

      return isSetting
    }

    const isBorderColorSetting = () => {
      let isSetting = false
      const propertyName = BORDER_COLOR[state.activedBorder]

      if (propertyName) {
        isSetting = getSettingFlag(propertyName)
      }

      return isSetting
    }

    const borderColorValue = computed(() => {
      let color = ''
      const propertyName = BORDER_COLOR[state.activedBorder]

      if (propertyName) {
        color = getPropertyValue(propertyName)
      }

      return color
    })

    const changeBorderColor = (value) => {
      const propertyName = BORDER_COLOR[state.activedBorder]
      const val = value?.target?.value || value || ''

      if (propertyName) {
        updateStyle({ [propertyName]: val })
      }
    }

    const shouldOpenSetting = (propertyName) => {
      const checkMethodMap = {
        [BORDER_RADIUS_PROPERTY.BorderRadius]: isRadiusSetting,
        [BORDER_PROPERTY.Border]: isBorderSetting,
        [BORDER_PROPERTY.BorderStyle]: isBorderStyleSetting,
        [BORDER_PROPERTY.BorderWidth]: isBorderWidthSetting,
        [BORDER_PROPERTY.BorderColor]: isBorderColorSetting
      }

      return checkMethodMap[propertyName]?.()
    }

    const openSetting = (propertyName, event) => {
      if (shouldOpenSetting(propertyName)) {
        activedName = propertyName
        setPosition(event)
        state.showModal = true
      }
    }

    return {
      borderColorValue,
      borderWidthValue,
      RADIUS_SETTING,
      BORDER_SETTING,
      BORDER_STYLE_TYPE,
      BORDER_PROPERTY,
      BORDER_RADIUS_PROPERTY,
      state,
      reset,
      borderRadius,
      updateStyle,
      openSetting,
      getProperty,
      getSettingFlag,
      selectRaduis,
      isRaduisSelected,
      isRadiusSetting,
      updateRadiusSingle,
      isBorderSetting,
      selectBorder,
      isBorderSelected,
      isBorderStyleSetting,
      selectBorderStyle,
      isBorderStyleSelected,
      isBorderWidthSetting,
      isBorderColorSetting,
      changeBorderColor
    }
  }
}
</script>

<style lang="less" scoped>
.border-row {
  display: flex;

  .border-col {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 5px 0;

    .border-label {
      color: var(--ti-lowcode-component-setting-panel-label-color);
      flex: 0 0 40px;
      padding-left: 2px;
      margin-right: 2px;
      line-height: 28px;
    }
  }
  svg {
    color: var(--ti-lowcode-toolbar-breadcrumb-color);
  }
}

.radius-row {
  display: flex;
  align-items: center;
  padding-bottom: 8px;
  position: relative;
  &.show-border::after {
    content: '';
    height: 1px;
    width: calc(100% + 32px);
    background: var(--ti-lowcode-toolbar-border-color);
    position: absolute;
    bottom: 0;
    left: -16px;
  }

  svg {
    color: var(--ti-lowcode-input-icon-color);
    font-size: 16px;
  }

  .radius-label {
    flex: 0 0 45px;
    padding: 0 2px;
    line-height: 24px;
    color: var(--ti-lowcode-component-setting-panel-label-color);

    &.selected {
      color: var(--ti-lowcode-style-setting-label-color);
      background: var(--ti-lowcode-style-setting-label-bg);
    }
  }

  .radius-content {
    flex: auto;
    align-items: center;
    display: grid;
    grid-template-columns: 16px 16px 1fr;
    column-gap: 4px;

    .radius-content-svg {
      &:hover,
      &.selected {
        svg {
          color: var(--ti-lowcode-property-active-color);
        }
      }

      .radius-svg {
        margin: auto;
      }

      .radius-auto {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: center;
      }
    }

    .radius-content-input {
      margin-left: 4px;

      :deep(.tiny-input__suffix) {
        right: 0;
      }
    }
  }
}

.radius-multiple {
  display: flex;
  flex-wrap: wrap;
  position: relative;
  &::after {
    content: '';
    height: 1px;
    width: calc(100% + 32px);
    background: var(--ti-lowcode-toolbar-border-color);
    position: absolute;
    bottom: 0;
    left: -16px;
  }

  svg {
    color: var(--ti-lowcode-toolbar-breadcrumb-color);
    font-size: 16px;
  }

  .radius-content {
    flex: 1;
    display: flex;
    align-items: center;
    margin: 5px 0;

    .radius-content-svg {
      flex: 0 0 24px;
      padding: 4px;
      margin: 0 1px;
    }
    :deep(.tiny-input__inner) {
      background: var(--ti-lowcode-tabs-active-bg);
      padding: 0 20px 0 0;
      border-radius: 0;
      border-width: 0;
      &:hover,
      &:focus {
        border-bottom: 1px solid var(--ti-lowcode-property-active-color);
      }
    }
  }
}

.border-label {
  width: 100%;
  margin: 10px 0 5px 0;
  color: var(--ti-lowcode-component-setting-panel-label-color);
  .set-border-style {
    line-height: 24px;
    float: left;
  }
}
.border-input-left {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-right: 5px;
  font-size: 16px;

  .border-input-left__row {
    text-align: center;
    &.center {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  }
  .row-item {
    padding: 5px;
    border-radius: 3px;
    &:hover {
      svg {
        color: var(--ti-lowcode-toolbar-icon-color);
      }
    }

    &.selected {
      // background-color: var(--ti-lowcode-tabs-bg);
      svg {
        color: var(--ti-lowcode-property-active-color);
      }
    }
  }
}
.border-input {
  // display: flex;
  // justify-content: flex-start;
  // align-items: center;

  svg {
    color: var(--ti-lowcode-toolbar-breadcrumb-color);
    font-size: 16px;
  }

  .border-input-right {
    .border-row {
      display: flex;
      align-items: center;
      margin: 5px 0;

      .border-label {
        flex: 0 0 40px;
      }
      .border-content {
        flex: 1;
        display: flex;

        .border-content-svg {
          flex: 1;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          &.selected,
          &:hover {
            svg {
              color: var(--ti-lowcode-property-active-color);
            }
          }

          .bem-svg {
            margin: auto;
          }
        }
      }
      .border-width {
        width: 50px;
        flex: none;
        margin-right: 15px;
      }
    }
  }
}

.adjust-vertical {
  margin-top: 5px;
}

.is-setting {
  color: var(--ti-lowcode-style-setting-label-color);
  background: var(--ti-lowcode-style-setting-label-bg);
  padding: 2px;
}
</style>
