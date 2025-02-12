<template>
  <div class="spacing-wrap">
    <div class="spacing-max-icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        width="256"
        height="120"
        style="grid-area: 1 / 1 / -1 / -1"
        class="margin-color"
      >
        <g>
          <g>
            <path
              mode="delta"
              d="
              m0,0
              h256
              l-36,25
              h-151
              l-36,-25z
            "
              data-automation-id="margin-top-button"
              aria-label="Margin top button"
              class="padding-color"
              @click="clickMargin(SPACING_PROPERTY.MarginTop, $event)"
            ></path>
          </g>
        </g>
        <g>
          <g>
            <path
              mode="delta"
              d="
              m256,0
              v120
              l-45,-24
              v-71
              l45,-24z
            "
              data-automation-id="margin-right-button"
              aria-label="Margin right button"
              class="padding-color"
              @click="clickMargin(SPACING_PROPERTY.MarginRight, $event)"
            ></path>
          </g>
        </g>
        <g>
          <g>
            <path
              mode="delta"
              d="
              m0,120
              h256
              l-36,-25
              h-151
              l-36,25z
            "
              data-automation-id="margin-bottom-button"
              aria-label="Margin bottom button"
              class="padding-color"
              @click="clickMargin(SPACING_PROPERTY.MarginBottom, $event)"
            ></path>
          </g>
        </g>
        <g>
          <g>
            <path
              mode="delta"
              d="
              m0,0
              v120
              l45,-24
              v-71
              l-45,-24z
            "
              data-automation-id="margin-left-button"
              aria-label="Margin left button"
              class="margin-color"
              @click="clickMargin(SPACING_PROPERTY.MarginLeft, $event)"
            ></path>
          </g>
        </g>
        <clipPath id="margin-outer" class="margin-color">
          <rect
            x="0"
            y="0"
            width="256"
            height="120"
            fill="currentColor"
            rx="4"
            ry="4"
            style="pointer-events: none"
          ></rect>
        </clipPath>
        <rect
          class="margin-color"
          clip-path="url(#margin-outer)"
          x="0"
          y="0"
          width="256"
          height="120"
          fill="currentColor"
          rx="4"
          ry="4"
          style="pointer-events: none; stroke-width: 0"
        ></rect>
        <clipPath id="margin-inner" class="margin-color">
          <rect
            x="45"
            y="25"
            width="168"
            height="70"
            fill="currentColor"
            rx="4"
            ry="4"
            style="pointer-events: none"
          ></rect>
        </clipPath>
        <rect
          class="padding-color"
          clip-path="url(#margin-inner)"
          x="45"
          y="25"
          width="168"
          height="70"
          fill="currentColor"
          rx="4"
          ry="4"
          style="pointer-events: none; stroke-width: 0"
        ></rect>
      </svg>
      <div
        :class="[
          'spacing-edit',
          'margin-top',
          {
            'is-setting': getSettingFlag(SPACING_PROPERTY.MarginTop),
            'is-show': state.show && state.className === SPACING_PROPERTY.MarginTop
          }
        ]"
        @click="clickMargin(SPACING_PROPERTY.MarginTop, $event)"
      >
        {{ getPropertyText(SPACING_PROPERTY.MarginTop) }}
      </div>
      <div
        :class="[
          'spacing-edit',
          'margin-right',
          {
            'is-setting': getSettingFlag(SPACING_PROPERTY.MarginRight),
            'is-show': state.show && state.className === SPACING_PROPERTY.MarginRight
          }
        ]"
        @click="clickMargin(SPACING_PROPERTY.MarginRight, $event)"
      >
        {{ getPropertyText(SPACING_PROPERTY.MarginRight) }}
      </div>
      <div
        :class="[
          'spacing-edit',
          'margin-bottom',
          {
            'is-setting': getSettingFlag(SPACING_PROPERTY.MarginBottom),
            'is-show': state.show && state.className === SPACING_PROPERTY.MarginBottom
          }
        ]"
        @click="clickMargin(SPACING_PROPERTY.MarginBottom, $event)"
      >
        {{ getPropertyText(SPACING_PROPERTY.MarginBottom) }}
      </div>
      <div
        :class="[
          'spacing-edit',
          'margin-left',
          {
            'is-setting': getSettingFlag(SPACING_PROPERTY.MarginLeft),
            'is-show': state.show && state.className === SPACING_PROPERTY.MarginLeft
          }
        ]"
        @click="clickMargin(SPACING_PROPERTY.MarginLeft, $event)"
      >
        {{ getPropertyText(SPACING_PROPERTY.MarginLeft) }}
      </div>
    </div>
    <div class="spacing-min-icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        width="168"
        height="70"
        style="grid-area: 1 / 1 / -1 / -1"
        class="margin-color"
      >
        <g>
          <g>
            <path
              mode="delta"
              d="
              m5,-4
              h168
              l-36,25
              h-71
              l-36,-25z
            "
              data-automation-id="padding-top-button"
              aria-label="Padding top button"
              class="padding-color"
              @click="clickPadding(SPACING_PROPERTY.PaddingTop, $event)"
            ></path>
          </g>
        </g>
        <g>
          <g>
            <path
              mode="delta"
              d="
              m173,-4
              v70
              l-60,-24
              v-15
              l60,-24z
            "
              data-automation-id="padding-right-button"
              aria-label="Padding right button"
              class="padding-color"
              @click="clickPadding(SPACING_PROPERTY.PaddingRight, $event)"
            ></path>
          </g>
        </g>
        <g>
          <g>
            <path
              mode="delta"
              d="
              m5,66
              h168
              l-36,-25
              h-71
              l-36,25z
            "
              data-automation-id="padding-bottom-button"
              aria-label="Padding bottom button"
              class="padding-color"
              @click="clickPadding(SPACING_PROPERTY.PaddingBottom, $event)"
            ></path>
          </g>
        </g>
        <g>
          <g>
            <path
              mode="delta"
              d="
              m5,-4
              v70
              l60,-24
              v-15
              l-60,-24z
            "
              data-automation-id="padding-left-button"
              aria-label="Padding left button"
              class="margin-color"
              @click="clickPadding(SPACING_PROPERTY.PaddingLeft, $event)"
            ></path>
          </g>
        </g>
        <clipPath id="padding-outer" class="padding-color">
          <rect
            x="5"
            y="-4"
            width="168"
            height="70"
            fill="currentColor"
            rx="4"
            ry="4"
            style="pointer-events: none"
          ></rect>
        </clipPath>
        <rect
          class="stroke padding-color"
          clip-path="url(#padding-outer)"
          x="0"
          y="0"
          width="168"
          height="70"
          fill="currentColor"
          rx="4"
          ry="4"
          style="pointer-events: none; stroke-width: 0"
        ></rect>
        <clipPath id="padding-inner" class="inner-color">
          <rect
            x="64"
            y="25"
            width="48"
            height="20"
            fill="currentColor"
            rx="4"
            ry="4"
            style="pointer-events: none"
          ></rect>
        </clipPath>
        <rect
          class="stroke inner-color"
          clip-path="url(#padding-inner)"
          x="64"
          y="25"
          width="48"
          height="20"
          rx="4"
          ry="4"
          style="pointer-events: none; stroke-width: 0"
        ></rect>
      </svg>
      <div
        :class="[
          'spacing-edit',
          'padding-top',
          {
            'is-setting': getSettingFlag(SPACING_PROPERTY.PaddingTop),
            'is-show': state.show && state.className === SPACING_PROPERTY.PaddingTop
          }
        ]"
        @click="clickPadding(SPACING_PROPERTY.PaddingTop, $event)"
      >
        {{ getPropertyText(SPACING_PROPERTY.PaddingTop) }}
      </div>
      <div
        :class="[
          'spacing-edit',
          'padding-right',
          {
            'is-setting': getSettingFlag(SPACING_PROPERTY.PaddingRight),
            'is-show': state.show && state.className === SPACING_PROPERTY.PaddingRight
          }
        ]"
        @click="clickPadding(SPACING_PROPERTY.PaddingRight, $event)"
      >
        {{ getPropertyText(SPACING_PROPERTY.PaddingRight) }}
      </div>
      <div
        :class="[
          'spacing-edit',
          'padding-bottom',
          {
            'is-setting': getSettingFlag(SPACING_PROPERTY.PaddingBottom),
            'is-show': state.show && state.className === SPACING_PROPERTY.PaddingBottom
          }
        ]"
        @click="clickPadding(SPACING_PROPERTY.PaddingBottom, $event)"
      >
        {{ getPropertyText(SPACING_PROPERTY.PaddingBottom) }}
      </div>
      <div
        :class="[
          'spacing-edit',
          'padding-left',
          {
            'is-setting': getSettingFlag(SPACING_PROPERTY.PaddingLeft),
            'is-show': state.show && state.className === SPACING_PROPERTY.PaddingLeft
          }
        ]"
        @click="clickPadding(SPACING_PROPERTY.PaddingLeft, $event)"
      >
        {{ getPropertyText(SPACING_PROPERTY.PaddingLeft) }}
      </div>
    </div>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      style="grid-area: 3 / 3 / span 3 / span 3; pointer-events: none"
    >
      <text x="12" y="4" fill="#808080" font-weight="normal" font-size="10" dominant-baseline="hanging">Padding</text>
    </svg>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      style="grid-area: 1 / 1 / -1 / -1; pointer-events: none"
    >
      <text x="12" y="4" fill="#808080" font-weight="normal" font-size="10" dominant-baseline="hanging">Margin</text>
    </svg>
  </div>

  <modal-mask v-if="state.showModal" @close="closeModal">
    <spacing-setting :property="state.property" @update="update"></spacing-setting>
  </modal-mask>
</template>

<script>
import { computed, reactive } from 'vue'
import SpacingSetting from './SpacingSetting.vue'
import ModalMask, { useModal } from '../inputs/ModalMask.vue'
import useEvent from '../../js/useEvent'
import { SPACING_PROPERTY } from '../../js/styleProperty'

export default {
  components: {
    ModalMask,
    SpacingSetting
  },
  props: {
    style: {
      type: Object,
      default: () => ({})
    }
  },
  emits: useEvent(),
  setup(props, { emit }) {
    const { setPosition } = useModal()

    const state = reactive({
      className: '',
      show: false,
      showModal: false,
      property: {
        type: '',
        name: '',
        value: ''
      }
    })

    // 在 style 对象中获取 padding margin 的属性值
    const spacing = computed(() => {
      const properties = {}

      Object.values(SPACING_PROPERTY).forEach((name) => {
        const value = props.style[name]

        properties[name] = {
          value,
          text: value === 'auto' ? 'auto' : String(Number.parseInt(value) || 0), // 界面 box 中显示的数值
          setting: Boolean(value) // 属性是否已设置值
        }
      })

      return reactive(properties)
    })

    const getSettingFlag = (styleName) => Boolean(spacing.value[styleName]?.setting)
    const getPropertyText = (styleName) => spacing.value[styleName]?.text || 0
    const getPropertyValue = (styleName) => spacing.value[styleName]?.value

    // 打开单个属性设置弹窗
    const openSetting = (type, styleName) => {
      state.property = {
        type,
        name: styleName,
        value: getPropertyValue(styleName)
      }

      state.showModal = true
    }

    const clickMargin = (styleName, event) => {
      state.className = styleName
      state.show = true

      setPosition(event)
      openSetting(SPACING_PROPERTY.Margin, styleName)
    }

    const clickPadding = (styleName, event) => {
      state.className = styleName
      state.show = true

      setPosition(event)
      openSetting(SPACING_PROPERTY.Padding, styleName)
    }

    const closeModal = () => {
      state.show = false
      state.showModal = false
    }

    // 向父级传递更新 style 对象
    const update = (property) => {
      // 更新属性设置弹窗的属性值
      state.property.value = property[state.property.name]
      emit('update', property)
    }

    return {
      state,
      spacing,
      SPACING_PROPERTY,
      update,
      closeModal,
      clickMargin,
      clickPadding,
      getSettingFlag,
      getPropertyText
    }
  }
}
</script>

<style lang="less" scoped>
.spacing-wrap {
  position: relative;
  display: grid;
  grid-template-columns: 45px 0px 60px 1fr 60px 0px 45px;
  grid-template-rows: 25px 0px 25px 1fr 25px 0px 25px;
  width: 256px;
  height: 120px;
  margin: 0 auto;
  outline-style: none;
  cursor: default;
  user-select: none;
  .spacing-max-icon {
    grid-area: 1 / 1 / -1 / -1;
    display: grid;
    grid-template-columns: 45px 1fr 45px;
    grid-template-rows: 25px minmax(16px, 1fr) 25px;
    justify-items: center;
    width: 256px;
    height: 120px;
  }

  .spacing-min-icon {
    grid-area: 3 / 3 / span 3 / span 3;
    display: grid;
    grid-template-columns: 56px 54px 56px;
    grid-template-rows: 25px minmax(16px, 1fr) 25px;
    justify-items: center;
    width: 168px;
    height: 70px;
  }

  .spacing-edit {
    cursor: pointer;
    user-select: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell,
      'Helvetica Neue', Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
    font-weight: 400;
    line-height: 10px;
    letter-spacing: -0.2px;
    display: flex;
    color: var(--te-styles-common-text-color-primary);
    background: transparent;
    padding: 2px 4px;
    margin-left: -2px;
    border-radius: 2px;
    max-width: 100%;
    box-sizing: content-box;
    place-self: center;
    position: relative;
    opacity: 1;
    align-items: center;
    justify-content: center;

    &.is-setting {
      background-color: var(--te-styles-common-setting-bg-color);
    }

    &.is-show {
      background-color: var(--te-styles-spacing-bg-color);
    }

    &.margin-top,
    &.padding-top {
      grid-area: 1 / 2 / 2 / 3;
    }

    &.margin-right,
    &.padding-right {
      grid-area: 2 / 3 / 3 / 4;
    }
    &.margin-bottom,
    &.padding-bottom {
      grid-area: 3 / 2 / 4 / 3;
    }

    &.margin-left,
    &.padding-left {
      grid-area: 2 / 1 / 3 / 2;
    }
    .reference-wrapper {
      & > div {
        padding: 2px;
      }
    }
  }

  .margin-color {
    cursor: pointer;
    color: var(--te-styles-spacing-margin-bg-color);
  }
  .padding-color {
    cursor: pointer;
    color: var(--te-styles-spacing-padding-bg-color);
  }
  .inner-color {
    color: var(--te-styles-spacing-inner-bg-color);
  }
}
</style>
