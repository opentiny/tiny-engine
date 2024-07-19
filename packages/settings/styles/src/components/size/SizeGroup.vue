<template>
  <div class="size-row">
    <div class="size-col">
      <div
        :class="['size-label', { 'is-setting': getSettingFlag(SIZE_PROPERTY.Width) }]"
        @click="openSetting(SIZE_PROPERTY.Width, $event)"
      >
        宽(W)
      </div>
      <numeric-select
        :name="getProperty(SIZE_PROPERTY.Width).name"
        :numericalText="getProperty(SIZE_PROPERTY.Width).text"
        @update="updateStyle"
      />
    </div>
    <div class="size-col">
      <div
        :class="['size-label', { 'is-setting': getSettingFlag(SIZE_PROPERTY.Height) }]"
        @click="openSetting(SIZE_PROPERTY.Height, $event)"
      >
        高(H)
      </div>
      <numeric-select
        :name="getProperty(SIZE_PROPERTY.Height).name"
        :numericalText="getProperty(SIZE_PROPERTY.Height).text"
        @update="updateStyle"
      />
    </div>
  </div>
  <div class="size-row">
    <div class="size-col">
      <div
        :class="['size-label', { 'is-setting': getSettingFlag(SIZE_PROPERTY.MinWidth) }]"
        @click="openSetting(SIZE_PROPERTY.MinWidth, $event)"
      >
        最小宽
      </div>
      <numeric-select
        :name="getProperty(SIZE_PROPERTY.MinWidth).name"
        :numericalText="getProperty(SIZE_PROPERTY.MinWidth).text"
        @update="updateStyle"
      />
    </div>
    <div class="size-col">
      <div
        :class="['size-label', { 'is-setting': getSettingFlag(SIZE_PROPERTY.MinHeight) }]"
        @click="openSetting(SIZE_PROPERTY.MinHeight, $event)"
      >
        最小高
      </div>
      <numeric-select
        :name="getProperty(SIZE_PROPERTY.MinHeight).name"
        :numericalText="getProperty(SIZE_PROPERTY.MinHeight).text"
        @update="updateStyle"
      />
    </div>
  </div>
  <div class="size-row">
    <div class="size-col">
      <div
        :class="['size-label', { 'is-setting': getSettingFlag(SIZE_PROPERTY.MaxWidth) }]"
        @click="openSetting(SIZE_PROPERTY.MaxWidth, $event)"
      >
        最大宽
      </div>
      <numeric-select
        :name="getProperty(SIZE_PROPERTY.MaxWidth).name"
        :numericalText="getProperty(SIZE_PROPERTY.MaxWidth).text"
        @update="updateStyle"
      />
    </div>
    <div class="size-col">
      <div
        :class="['size-label', { 'is-setting': getSettingFlag(SIZE_PROPERTY.MaxHeight) }]"
        @click="openSetting(SIZE_PROPERTY.MaxHeight, $event)"
      >
        最大高
      </div>
      <numeric-select
        :name="getProperty(SIZE_PROPERTY.MaxHeight).name"
        :numericalText="getProperty(SIZE_PROPERTY.MaxHeight).text"
        @update="updateStyle"
      />
    </div>
  </div>

  <div class="overflow-row">
    <div
      :class="['overflow-label', { 'is-setting': getSettingFlag(SIZE_PROPERTY.Overflow) }]"
      @click="openSetting(SIZE_PROPERTY.Overflow, $event)"
    >
      溢出
    </div>
    <div class="overflow-content">
      <tiny-tooltip :effect="effect" :placement="placement" content="visible 溢出可见">
        <div
          :class="['overflow-content-item', { selected: isOverflowSelected(OVERFLOW_TYPE.Visible) }]"
          @click="selectOverflow(OVERFLOW_TYPE.Visible)"
        >
          <svg-icon name="eye" class="overflow-svg"></svg-icon>
        </div>
      </tiny-tooltip>

      <tiny-tooltip :effect="effect" :placement="placement" content="hidden 溢出隐藏">
        <div
          :class="['overflow-content-item', { selected: isOverflowSelected(OVERFLOW_TYPE.Hidden) }]"
          @click="selectOverflow(OVERFLOW_TYPE.Hidden)"
        >
          <svg-icon name="eye-invisible" class="overflow-svg"></svg-icon>
        </div>
      </tiny-tooltip>

      <tiny-tooltip :effect="effect" :placement="placement" content="overflow 溢出滚动">
        <div
          :class="['overflow-content-item', { selected: isOverflowSelected(OVERFLOW_TYPE.Scroll) }]"
          @click="selectOverflow(OVERFLOW_TYPE.Scroll)"
        >
          <svg-icon name="overflow-scroll" class="overflow-svg"></svg-icon>
        </div>
      </tiny-tooltip>
      <tiny-tooltip :effect="effect" :placement="placement" content="auto 溢出才自动滚动">
        <div
          :class="['overflow-content-item', { selected: isOverflowSelected(OVERFLOW_TYPE.Auto) }]"
          @click="selectOverflow(OVERFLOW_TYPE.Auto)"
        >
          <div class="overflow-auto">Auto</div>
        </div>
      </tiny-tooltip>
    </div>
  </div>

  <div class="fit-row">
    <div
      :class="['fit-label', { 'is-setting': getSettingFlag(SIZE_PROPERTY.ObjectFit) }]"
      title="object-fit"
      @click="openSetting(SIZE_PROPERTY.ObjectFit, $event)"
    >
      适应
    </div>
    <div class="fit-select">
      <select-configurator
        :modelValue="state.value"
        :options="selectOptions"
        @update:modelValue="selectFit"
      ></select-configurator>
    </div>
    <tiny-tooltip :effect="effect" :disabled="state.disabled" :placement="placement" content="Object position 设置">
      <tiny-popover
        placement="bottom"
        popper-class="toolbar-media-popper fit-popper"
        @show="showPopover"
        @hide="hidePopover"
      >
        <template #reference>
          <span
            :class="[
              'more-icon-wrap',
              { selected: state.flag, 'is-setting': getSettingFlag(SIZE_PROPERTY.ObjectPosition) }
            ]"
          >
            <icon-ellipsis></icon-ellipsis>
          </span>
        </template>
        <div class="size-fit-content">
          <div
            :class="['fit-content-label', { 'is-setting': getSettingFlag(SIZE_PROPERTY.ObjectPosition) }]"
            @click="openSetting(SIZE_PROPERTY.ObjectPosition, $event)"
          >
            位置
          </div>
          <div class="size-fit-content-main">
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
            <div class="size-input-wrap">
              <div class="input-wrap-row">
                <span class="size-label">Left</span>
                <tiny-input v-model="state.leftValue" class="left-input" @change="leftValueChange">
                  <template #suffix>
                    <span>%</span>
                  </template>
                </tiny-input>
              </div>
              <div class="input-wrap-row">
                <span class="size-label">Top</span>
                <tiny-input v-model="state.topValue" class="top-input" @change="topValueChange">
                  <template #suffix>
                    <span>%</span>
                  </template>
                </tiny-input>
              </div>
            </div>
          </div>
        </div>
      </tiny-popover>
    </tiny-tooltip>
  </div>

  <modal-mask v-if="showModal" @close="showModal = false">
    <reset-button @reset="reset" />
  </modal-mask>
  <mask-modal :visible="state.showMask" @close="state.showMask = false"></mask-modal>
</template>

<script>
import { reactive, ref } from 'vue'
import { Tooltip, Popover, Input } from '@opentiny/vue'
import { MaskModal } from '@opentiny/tiny-engine-common'
import { SelectConfigurator } from '@opentiny/tiny-engine-configurator'
import { iconEllipsis } from '@opentiny/vue-icon'
import { ModalMask, useModalMask, ResetButton } from '@opentiny/tiny-engine-common'
import NumericSelect from '../inputs/NumericSelect.vue'
import useEvent from '../../js/useEvent'
import { useProperties } from '../../js/useStyle'
import { OVERFLOW_TYPE } from '../../js/cssType'
import { SIZE_PROPERTY } from '../../js/styleProperty'

export default {
  components: {
    ModalMask,
    ResetButton,
    NumericSelect,
    SelectConfigurator,
    MaskModal,
    TinyPopover: Popover,
    TinyInput: Input,
    TinyTooltip: Tooltip,
    IconEllipsis: iconEllipsis()
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
    const selectOptions = [
      {
        label: 'fill-填充',
        value: 'object-fit:fill'
      },
      {
        label: 'contain-包含',
        value: 'object-fit:contain'
      },
      {
        label: 'cover-原比例填充',
        value: 'object-fit:cover'
      },
      {
        label: 'none-无',
        value: 'object-fit:none'
      },
      {
        label: 'scale-down-缩小',
        value: 'object-fit:scale-down'
      }
    ]
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
    const showModal = ref(false)
    const { setPosition } = useModalMask()
    const state = reactive({
      flag: false,
      disabled: false,
      showMask: false,
      value: 'object-fit:fill',
      leftValue: '50',
      topValue: '50',
      originActive: 4
    })

    const { getProperty, getSettingFlag, getPropertyValue } = useProperties({
      names: Object.values(SIZE_PROPERTY),
      parseNumber: true
    })

    const updateStyle = (property) => {
      emit('update', property)
    }

    const reset = () => {
      updateStyle({ [activedName]: null })
      state.value = 'object-fit:fill'
      state.topValue = '50'
      state.leftValue = '50'
      state.originActive = 4
      showModal.value = false
    }

    const updatePositionStyle = () => {
      const styleObj = { 'object-position': `${state.leftValue}% ${state.topValue}%` }
      updateStyle(styleObj)
    }

    const openSetting = (name, event) => {
      if (getSettingFlag(name)) {
        activedName = name
        setPosition(event)
        showModal.value = true
      }
    }

    const selectOverflow = (type) => {
      if (type) {
        updateStyle({ overflow: type })
      }
    }

    const isOverflowSelected = (type) => type === getPropertyValue(SIZE_PROPERTY.Overflow)

    const showPopover = () => {
      state.flag = true
      state.disabled = true
      state.showMask = true
    }

    const hidePopover = () => {
      state.flag = false
      state.disabled = false
      state.showMask = false
    }

    const selectOrigin = (item, index) => {
      state.originActive = index
      state.topValue = item.top
      state.leftValue = item.left
      updatePositionStyle()
    }

    const selectFit = (val) => {
      if (val?.includes(':')) {
        const styleArr = val.split(':')
        state.value = val
        updateStyle({ [styleArr[0]]: styleArr[1] })
      }
    }

    const leftValueChange = (val) => {
      state.leftValue = val
      updatePositionStyle()
    }

    const topValueChange = (val) => {
      state.topValue = val
      updatePositionStyle()
    }

    return {
      state,
      OVERFLOW_TYPE,
      SIZE_PROPERTY,
      selectOptions,
      originOptions,
      reset,
      showModal,
      updateStyle,
      openSetting,
      getProperty,
      getSettingFlag,
      selectOverflow,
      isOverflowSelected,
      showPopover,
      hidePopover,
      selectOrigin,
      selectFit,
      leftValueChange,
      topValueChange
    }
  }
}
</script>

<style lang="less" scoped>
.size-row {
  display: flex;

  .size-col {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 5px 0;

    &:not(:last-child) {
      margin-right: 8px;
    }

    .size-label {
      flex: 0 0 52px;
      padding-left: 2px;
      margin-right: 2px;
      line-height: 28px;
      color: var(--ti-lowcode-component-setting-panel-label-color);
    }
  }
}

.overflow-row {
  display: flex;
  align-items: center;

  .overflow-label {
    flex: 0 0 54px;
    padding: 0 2px;
    line-height: 24px;

    &.selected {
      color: var(--ti-lowcode-style-setting-label-color);
      background-color: var(--ti-lowcode-style-setting-label-bg);
    }
  }

  .overflow-content {
    display: flex;

    .overflow-content-item {
      min-width: 30px;
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 4px 0;
      font-size: 16px;
      color: var(--ti-lowcode-component-setting-panel-icon-color);
      position: relative;

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
        cursor: default;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: center;
        font-size: 14px;
      }
    }
  }
}
.size-fit-content {
  display: block;
  padding: 10px;
  width: 180px;
  .fit-content-label {
    margin-bottom: 10px;
  }
  .size-fit-content-main {
    display: flex;
    .coordinate {
      margin-right: 15px;
    }
    .size-input-wrap {
      flex: 1;
      .input-wrap-row {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
        .size-label {
          padding-right: 5px;
          display: inline-block;
          color: var(--ti-lowcode-toolbar-breadcrumb-color);
        }

        :deep(.tiny-input) {
          flex: 1;
        }
      }
    }
  }
}

.fit-row {
  display: flex;
  align-items: center;
  padding: 5px 0;
  .fit-label {
    flex: 0 0 54px;
    padding: 0 2px;
    line-height: 28px;
  }
  .more-icon-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    font-size: 18px;
    color: var(--ti-lowcode-description-minor-color);
    margin-left: 4px;
    border-radius: 2px;
    &.selected {
      background: var(--ti-lowcode-more-icon-selected-bg);
      &.is-setting {
        color: var(--ti-lowcode-style-setting-label-color);
        background-color: var(--ti-lowcode-style-setting-label-bg);
      }
    }
  }
}
</style>
