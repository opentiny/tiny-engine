<template>
  <div class="size-row">
    <div class="size-col">
      <div
        :class="['size-label', { 'is-setting': getSettingFlag(SIZE_PROPERTY.Width) }]"
        @click="openSetting(SIZE_PROPERTY.Width, $event)"
      >
        <span>宽度</span>
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
        <span>高度</span>
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
        <span>最小宽</span>
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
        <span>最小高</span>
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
        <span>最大宽</span>
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
        <span>最大高</span>
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
      :class="[
        'overflow-label',
        { 'is-setting': getSettingFlag(SIZE_PROPERTY.Overflow), selected: Boolean(selectedOverflow) }
      ]"
      @click="openSetting(SIZE_PROPERTY.Overflow, $event)"
    >
      <span>溢出</span>
    </div>
    <tabs-group-configurator
      :options="overflowOpt"
      :modelValue="selectedOverflow"
      :label-width="50"
      :effect="effect"
      :placement="placement"
      @update:modelValue="selectOverflow"
    ></tabs-group-configurator>
  </div>

  <div class="fit-row">
    <div
      :class="[
        'fit-label',
        { 'is-setting': getSettingFlag(SIZE_PROPERTY.ObjectFit), selected: state.value !== 'object-fit:fill' }
      ]"
      title="object-fit"
      @click="openSetting(SIZE_PROPERTY.ObjectFit, $event)"
    >
      <span>适应</span>
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
import { reactive, ref, computed } from 'vue'
import { Tooltip, Popover, Input } from '@opentiny/vue'
import { MaskModal } from '@opentiny/tiny-engine-common'
import { SelectConfigurator, TabsGroupConfigurator } from '@opentiny/tiny-engine-configurator'
import { iconEllipsis } from '@opentiny/vue-icon'
import ModalMask, { useModal } from '../inputs/ModalMask.vue'
import ResetButton from '../inputs/ResetButton.vue'
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
    TabsGroupConfigurator,
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
      default: 'light'
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
    const overflowOpt = [
      {
        icon: 'eye',
        content: 'visible 溢出可见',
        value: OVERFLOW_TYPE.Visible
      },
      {
        icon: 'eye-invisible',
        content: 'hidden 溢出隐藏',
        value: OVERFLOW_TYPE.Hidden
      },
      {
        icon: 'overflow-scroll',
        content: 'overflow 溢出滚动',
        value: OVERFLOW_TYPE.Scroll
      },
      {
        label: 'Auto',
        content: 'auto 溢出才自动滚动',
        value: OVERFLOW_TYPE.Auto
      }
    ]
    const showModal = ref(false)
    const { setPosition } = useModal()
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

    const selectedOverflow = computed(() => {
      return getPropertyValue(SIZE_PROPERTY.Overflow)
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
      overflowOpt,
      selectedOverflow,
      reset,
      showModal,
      updateStyle,
      openSetting,
      getProperty,
      getSettingFlag,
      selectOverflow,
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
span {
  padding: 2px;
}
.size-row {
  display: flex;
  margin-bottom: var(--te-common-vertical-item-spacing-normal);
  &:last-child {
    margin-bottom: 0;
  }
  .size-col {
    flex: 1;
    display: flex;
    align-items: center;
    &:not(:last-child) {
      margin-right: 8px;
    }

    .size-label {
      flex: 0 0 52px;
      margin-right: 2px;
      line-height: 28px;
      color: var(--te-styles-common-text-color-secondary);
    }
  }
}

.overflow-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  &:last-child {
    margin-bottom: 0;
  }
  .overflow-label {
    flex: 0 0 54px;
    line-height: 24px;
    color: var(--te-styles-common-text-color-secondary);
  }
}

.selected-label {
  cursor: pointer;
  border-radius: 2px;
  color: var(--te-styles-common-setting-text-color);
  background-color: var(--te-styles-common-setting-bg-color);
}

.is-setting {
  span {
    .selected-label();
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
          color: var(--te-styles-common-text-color-secondary);
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
  margin-bottom: 8px;
  &:last-child {
    margin-bottom: 0;
  }
  .fit-label {
    flex: 0 0 54px;
    line-height: 28px;
    color: var(--te-styles-common-text-color-secondary);
    span {
      padding: 2px;
    }
    &.selected {
      span {
        .selected-label();
      }
    }
  }
  .more-icon-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    font-size: 18px;
    color: var(--te-styles-common-text-color-secondary);
    margin-left: 4px;
    border-radius: 2px;
    &.selected {
      background: var(--te-styles-common-bg-color-active);
      &.is-setting {
        .selected-label();
      }
    }
  }
}
</style>
