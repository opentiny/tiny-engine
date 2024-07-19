<template>
  <div class="position-group">
    <div
      :class="['position-label', { 'is-setting': getSettingFlag(POSITION_PROPERTY.Position) }]"
      title="position"
      @click="openSetting(POSITION_PROPERTY.Position, $event)"
    >
      定位
    </div>
    <div class="position-select">
      <select-configurator
        :modelValue="state.selectValue"
        :options="selectOptions"
        @update:modelValue="selectPosition"
      ></select-configurator>
    </div>
    <div v-if="state.showSetting" class="position-dropdown">
      <div v-if="state.showSettingIcon" class="tooltip-wrap">
        <div class="tooltip-icon">
          <tiny-tooltip
            v-for="(item, index) in positionOptions"
            :key="index"
            effect="dark"
            placement="top"
            :open-delay="500"
            :content="item.tip"
          >
            <span
              :class="['icon-wrap', { selected: index === state.selectedIndex }]"
              @click="selectInsetValue(item, index)"
              ><svg-icon :name="item.icon"></svg-icon
            ></span>
          </tiny-tooltip>
        </div>
      </div>
      <div class="setting-wrap">
        <div class="setting">
          <svg xmlns="http://www.w3.org/2000/svg" width="172" height="64" style="grid-area: 1 / 1 / -1 / -1">
            <g>
              <g>
                <path
                  mode="delta"
                  fill="currentColor"
                  d="m1,1h171l-36,24h-99l-36,-24z"
                  data-automation-id="position-top-button"
                  aria-label="Position top button"
                  class="tb-path-color"
                ></path>
              </g>
            </g>
            <g>
              <g>
                <path
                  mode="delta"
                  fill="currentColor"
                  d="m171,1v63l-36,-24v-15l36,-24z"
                  data-automation-id="position-right-button"
                  aria-label="Position right button"
                  class="lr-path-color"
                ></path>
              </g>
            </g>
            <g>
              <g>
                <path
                  mode="delta"
                  fill="currentColor"
                  d="m1,63h171l-36,-24h-99l-36,24z"
                  data-automation-id="position-bottom-button"
                  aria-label="Position bottom button"
                  class="tb-path-color"
                ></path>
              </g>
            </g>
            <g>
              <g>
                <path
                  mode="delta"
                  fill="currentColor"
                  d="m1,1v63l36,-24v-15l-36,-24z"
                  data-automation-id="position-left-button"
                  aria-label="Position left button"
                  class="lr-path-color"
                ></path>
              </g>
            </g>
            <clipPath id="position-outer">
              <rect
                x="0"
                y="0"
                width="172"
                height="64"
                fill="transparent"
                rx="2"
                ry="2"
                style="pointer-events: none"
              ></rect>
            </clipPath>
            <rect
              clip-path="url(#position-outer)"
              x="0"
              y="0"
              width="172"
              height="64"
              fill="transparent"
              rx="2"
              ry="2"
              class="stroke"
              style="pointer-events: none; stroke-width: 2px"
            ></rect>
            <clipPath id="position-inner">
              <rect
                x="36"
                y="24"
                width="100"
                height="16"
                fill="transparent"
                rx="2"
                ry="2"
                style="pointer-events: none"
              ></rect>
            </clipPath>
            <rect
              clip-path="url(#position-inner)"
              x="36"
              y="24"
              width="100"
              height="16"
              fill="transparent"
              rx="2"
              ry="2"
              class="stroke"
              style="pointer-events: none; stroke-width: 2px"
            ></rect>
          </svg>
          <div
            :class="[
              'direction',
              'top',
              {
                'is-setting': getSettingFlag(POSITION_PROPERTY.Top),
                'is-show': state.show && state.className === POSITION_PROPERTY.Top
              }
            ]"
            @click="clickDirection(POSITION_PROPERTY.Top, $event)"
          >
            <span>{{ getDirectionText(POSITION_PROPERTY.Top) }}</span>
          </div>
          <div
            :class="[
              'direction',
              'right',
              {
                'is-setting': getSettingFlag(POSITION_PROPERTY.Right),
                'is-show': state.show && state.className === POSITION_PROPERTY.Right
              }
            ]"
            @click="clickDirection(POSITION_PROPERTY.Right, $event)"
          >
            <span>{{ getDirectionText(POSITION_PROPERTY.Right) }}</span>
          </div>
          <div
            :class="[
              'direction',
              'bottom',
              {
                'is-setting': getSettingFlag(POSITION_PROPERTY.Bottom),
                'is-show': state.show && state.className === POSITION_PROPERTY.Bottom
              }
            ]"
            @click="clickDirection(POSITION_PROPERTY.Bottom, $event)"
          >
            <span>{{ getDirectionText(POSITION_PROPERTY.Bottom) }}</span>
          </div>
          <div
            :class="[
              'direction',
              'left',
              {
                'is-setting': getSettingFlag(POSITION_PROPERTY.Left),
                'is-show': state.show && state.className === POSITION_PROPERTY.Left
              }
            ]"
            @click="clickDirection(POSITION_PROPERTY.Left, $event)"
          >
            <span>{{ getDirectionText(POSITION_PROPERTY.Left) }}</span>
          </div>
        </div>
      </div>
      <div class="relative-wrap">
        <div class="target">
          <svg-icon name="target"></svg-icon>
          <span>{{ state.relativeTo }}</span>
        </div>
        <div class="relative">
          <span>Relative to</span>
        </div>
        <numeric-select
          :name="getProperty(POSITION_PROPERTY.ZIndex).name"
          :numericalText="getProperty(POSITION_PROPERTY.ZIndex).text"
          suffix="-"
          @update="updateStyle"
        />
        <span
          :class="['index', { 'is-setting': getSettingFlag(POSITION_PROPERTY.ZIndex) }]"
          @click="openSetting(POSITION_PROPERTY.ZIndex, $event)"
          >z-Index</span
        >
      </div>
    </div>
  </div>
  <modal-mask v-if="state.showModal" @close="state.showModal = false">
    <reset-button @reset="reset" />
  </modal-mask>
  <modal-mask v-if="state.showDirectionModal" @close="closeDirectionModal">
    <spacing-setting :property="state.property" @update="update"></spacing-setting>
  </modal-mask>
</template>

<script>
import { reactive, watchEffect } from 'vue'
import { Tooltip } from '@opentiny/vue'
import { SelectConfigurator } from '@opentiny/tiny-engine-configurator'
import { push } from '@opentiny/vue-renderless/common/array'
import { ModalMask, useModalMask, ResetButton } from '@opentiny/tiny-engine-common'
import SpacingSetting from '../spacing/SpacingSetting.vue'
import NumericSelect from '../inputs/NumericSelect.vue'
import { useProperties } from '../../js/useStyle'
import { POSITION_PROPERTY } from '../../js/styleProperty'

export default {
  components: {
    ModalMask,
    ResetButton,
    SelectConfigurator,
    NumericSelect,
    SpacingSetting,
    TinyTooltip: Tooltip
  },

  props: {
    style: {
      type: Object,
      default: () => ({})
    }
  },

  emits: ['update'],
  setup(props, { emit }) {
    let activedName = ''
    const selectOptions = [
      {
        label: 'Static-默认定位',
        value: 'static'
      },
      {
        label: 'Relative-相对定位',
        value: 'relative'
      },
      {
        label: 'Absolute-绝对定位',
        value: 'absolute'
      },
      {
        label: 'Fixed-固定定位',
        value: 'fixed'
      },
      {
        label: 'Sticky-粘性定位',
        value: 'sticky'
      }
    ]

    const positionOptions = [
      {
        tip: 'Top left',
        icon: 'position-top-left',
        value: '0% auto auto 0%'
      },
      {
        tip: 'Top right',
        icon: 'position-top-right',
        value: '0% 0% auto auto'
      },
      {
        tip: 'Bottom left',
        icon: 'position-bottom-left',
        value: 'auto auto 0% 0%'
      },
      {
        tip: 'Bottom right',
        icon: 'position-bottom-right',
        value: 'auto 0% 0% auto'
      },
      {
        tip: 'Left',
        icon: 'position-left',
        value: '0% auto 0% 0%'
      },
      {
        tip: 'Right',
        icon: 'position-right',
        value: '0% 0% 0% auto'
      },
      {
        tip: 'Bottom',
        icon: 'position-bottom',
        value: 'auto 0% 0% 0%'
      },
      {
        tip: 'Top',
        icon: 'position-top',
        value: '0% 0% auto 0%'
      },
      {
        tip: 'Full',
        icon: 'position-all',
        value: '0%'
      }
    ]

    const state = reactive({
      showModal: false,
      showSetting: false,
      showSettingIcon: false,
      showDirectionModal: false,
      show: false,
      className: '',
      selectedIndex: -1,
      selectValue: 'static',
      relativeTo: '404 Content Wrap',
      activeArr: ['inset'],
      directionText: {
        top: '',
        right: '',
        bottom: '',
        left: ''
      },
      property: {
        type: '',
        name: '',
        value: ''
      }
    })
    watchEffect(() => {
      state.selectValue = props.style?.position || 'static'
    })
    const { setPosition } = useModalMask()

    const updateStyle = (property) => {
      emit('update', property)
    }

    const reset = () => {
      if (activedName === 'position') {
        state.selectValue = 'static'
        state.showSetting = false
        state.selectedIndex = -1
        state.activeArr?.forEach((name) => {
          updateStyle({ [name]: null })
        })
      }

      updateStyle({ [activedName]: null })
      state.showModal = false
    }

    const { getProperty, getSettingFlag, getPropertyValue, getPropertyText } = useProperties({
      names: Object.values(POSITION_PROPERTY),
      parseNumber: true
    })

    const selectPosition = (val) => {
      if (val) {
        state.selectValue = val
        state.showSetting = val !== 'static'
        state.showSettingIcon = val === 'absolute' || val === 'fixed'
        state.relativeTo = val === 'relative' ? 'Itself' : '404 Content Wrap'
        updateStyle({ [POSITION_PROPERTY.Position]: val })
      }
    }

    const selectInsetValue = (item, index) => {
      let directionArr = []

      directionArr = item.value === 'Full' ? ['0%', '0%', '0%', '0%'] : item.value.split(' ')
      Object.keys(state.directionText).forEach((key, index) => {
        state.directionText[key] = directionArr[index]
      })
      state.selectedIndex = index
      updateStyle({ [POSITION_PROPERTY.Inset]: item.value })
    }

    const openSetting = (name, event) => {
      if (getSettingFlag(name)) {
        activedName = name
        setPosition(event)
        state.showModal = true
      }
    }

    const openDirectionSetting = (type, styleName) => {
      state.property = {
        type,
        name: styleName,
        value: getPropertyValue(styleName)
      }

      state.showDirectionModal = true
    }

    const getDirectionText = (name) => state.directionText[name] || getPropertyText(name) || 'auto'

    const clickDirection = (styleName, event) => {
      state.activeArr = push(state.activeArr, styleName)
      state.className = styleName
      state.show = true
      setPosition(event)
      openDirectionSetting(POSITION_PROPERTY.Position, styleName)
    }

    const closeDirectionModal = () => {
      state.show = false
      state.showDirectionModal = false
    }

    const update = (property) => {
      state.property.value = property[state.property.name]
      emit('update', property)
    }

    return {
      state,
      POSITION_PROPERTY,
      selectOptions,
      positionOptions,
      reset,
      update,
      updateStyle,
      getProperty,
      getSettingFlag,
      selectPosition,
      selectInsetValue,
      openSetting,
      getDirectionText,
      clickDirection,
      closeDirectionModal
    }
  }
}
</script>

<style lang="less" scoped>
.position-group {
  display: grid;
  gap: 8px;
  grid-template-columns: 48px 1fr;
  align-items: center;
  .position-label {
    color: var(--ti-lowcode-component-setting-panel-label-color);
  }
  .position-dropdown {
    grid-column: 1 / -1;
  }
  .tooltip-wrap,
  .setting-wrap {
    grid-column: 1 / -1;
    align-items: center;
    display: grid;
    gap: 8px;
    grid-template-columns: 48px 1fr;
    padding: 0px;
  }
  .tooltip-icon {
    grid-area: 1 / 2 / -1 / 3;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .tooltip-wrap {
    margin-bottom: 8px;
  }
  .setting-wrap {
    .setting {
      grid-area: 1 / 2 / -1 / 3;
      display: grid;
      grid-template-columns: 36px 1fr 36px;
      grid-template-rows: 24px minmax(16px, 1fr) 24px;
      justify-items: center;
      width: 172px;
      height: 64px;
    }
    .direction {
      cursor: default;
      user-select: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 10px;
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell,
        'Helvetica Neue', Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
      font-weight: 400;
      line-height: 10px;
      letter-spacing: -0.2px;
      display: flex;
      color: var(--ti-lowcode-position-direction-color);
      background: transparent;
      padding: 2px;
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
        background-color: var(--ti-lowcode-style-setting-label-bg);
      }

      &.is-show {
        background-color: var(--ti-lowcode-position-direction-bg);
      }
    }
    .top {
      grid-area: 1 / 2 / 2 / 3;
    }
    .right {
      grid-area: 2 / 3 / 3 / 4;
    }
    .bottom {
      grid-area: 3 / 2 / 4 / 3;
    }
    .left {
      grid-area: 2 / 1 / 3 / 2;
    }
  }
  .icon-wrap {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    font-size: 16px;
    &:hover {
      background-color: var(--ti-lowcode-position-direction-bg);
    }
    &.selected {
      background-color: var(--ti-lowcode-position-selected-bg);
    }
  }
  .relative-wrap {
    grid-column: 1 / -1;
    align-items: center;
    display: grid;
    gap: 4px 8px;
    grid-template-columns: 48px 1fr 1fr 1fr;
    margin-top: 8px;
    .target {
      height: 28px;
      border: 1px solid var(--ti-lowcode-position-relative-to-border-color);
      background-color: var(--ti-lowcode-position-relative-to-bg);
      color: var(--ti-lowcode-position-relative-to-color);
      grid-column: 2 / span 2;
      align-items: center;
      display: grid;
      gap: 4px;
      grid-template-columns: 16px auto 1fr;
      padding: 0px 4px;
      .svg-icon {
        font-size: 16px;
      }
      span {
        display: inline-block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    .relative {
      grid-column: 2 / span 2;
      justify-self: center;
    }
    .style-numeric {
      grid-column-start: 4;
      grid-row-start: 1;
    }
    .index {
      grid-column-start: 4;
      grid-row-start: 2;
      justify-self: center;
    }
  }
  .is-setting {
    color: var(--ti-lowcode-style-setting-label-color);
    background-color: var(--ti-lowcode-style-setting-label-bg);
  }
  .lr-path-color {
    color: var(--ti-lowcode-spacing-lr-color);
    cursor: default;
    &:hover {
      color: var(--ti-lowcode-spacing-lr-hover-color);
    }
  }

  .tb-path-color {
    color: var(--ti-lowcode-spacing-tb-color);
    cursor: default;
    &:hover {
      color: var(--ti-lowcode-spacing-tb-hover-color);
    }
  }

  .stroke {
    stroke: var(--ti-lowcode-spacing-border-color);
  }
}
</style>
