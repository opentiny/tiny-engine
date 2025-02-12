<template>
  <div class="tab-container">
    <div class="tabs-wrap">
      <tiny-button-group>
        <div class="button-wrap" v-for="(item, index) in uncollapsedOptions" :key="item.label || item.icon">
          <tiny-button
            :style="{ width: getItemWidth() + 'px' }"
            :class="['tab-item', { selected: picked === (valueKey ? item.value[valueKey] : item.value) }]"
            @click.stop="change(item)"
          >
            <span class="label-text" :title="item?.content">
              <span v-if="item?.label">{{ item.label }}</span>
              <svg-icon v-if="item?.icon" :name="item.icon" class="bem-Svg"></svg-icon>
            </span>
          </tiny-button>
          <span :class="[{ 'border-right': collapsedOptions.length || index < uncollapsedOptions.length - 1 }]"></span>
        </div>
        <tiny-dropdown
          v-if="collapsedOptions.length"
          trigger="click"
          :class="[
            'drop-down-options',
            { selected: collapsedOptions.find((item) => picked === (valueKey ? item.value[valueKey] : item.value)) }
          ]"
          :style="{ width: getItemWidth(true) + 'px' }"
        >
          <span
            class="selected-option"
            :title="selectedCollapsedOption?.content"
            @click.stop="change(selectedCollapsedOption)"
          >
            <span v-if="selectedCollapsedOption?.label">{{ selectedCollapsedOption.label }}</span>
            <svg-icon
              v-if="selectedCollapsedOption?.icon"
              :name="selectedCollapsedOption.icon"
              class="bem-Svg"
            ></svg-icon>
          </span>
          <template #dropdown>
            <tiny-dropdown-menu popper-class="dropdown-menu-list">
              <tiny-dropdown-item
                v-for="item in foldsOptions"
                :key="item.label || item.icon"
                @click.stop="change(item)"
              >
                <span :title="item?.content">
                  <span v-if="item?.label">{{ item.label }}</span>
                  <svg-icon v-if="item?.icon" :name="item.icon" class="bem-Svg"></svg-icon>
                </span>
              </tiny-dropdown-item>
            </tiny-dropdown-menu>
          </template>
        </tiny-dropdown>
      </tiny-button-group>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import {
  ButtonGroup as TinyButtonGroup,
  Button as TinyButton,
  Dropdown as TinyDropdown,
  DropdownMenu as TinyDropdownMenu,
  DropdownItem as TinyDropdownItem
} from '@opentiny/vue'

const props = defineProps({
  // tab选中值，用于默认选中的tab
  modelValue: {
    type: String,
    default: ''
  },
  // tab选中值如果是对象，valueKey是对象内的某个key
  valueKey: {
    type: String,
    default: ''
  },
  // tabItem宽度
  labelWidth: {
    type: [Number, String],
    default: '63'
  },
  // tab的选项，如果选项中包含collapsed，则会折叠为下拉
  options: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const picked = ref(null)
const uncollapsedOptions = computed(() => props.options.filter((option) => !option.collapsed))
const collapsedOptions = computed(() => props.options.filter((option) => option.collapsed))
const foldsOptions = ref([])
const selectedCollapsedOption = ref(null)
const isCollapsedSelected = ref(false)

const getItemWidth = (collapsed = false) => {
  return `${parseInt(props.labelWidth, 10) + (collapsed ? 15 : 0)}`
}

const findMatchingFoldValue = (value) => {
  selectedCollapsedOption.value =
    foldsOptions.value.find((item) => (props.valueKey ? item.value[props.valueKey] === value : item.value === value)) ??
    selectedCollapsedOption.value
}

const filterNonMatchingValues = (value) =>
  collapsedOptions.value.filter((item) =>
    props.valueKey ? item.value[props.valueKey] !== value : item.value !== value
  )

const updateOptionDisplay = (value) => {
  if (!value) {
    foldsOptions.value = collapsedOptions.value.slice(1)
    selectedCollapsedOption.value = collapsedOptions.value[0]
    return
  }
  findMatchingFoldValue(value)
  if (selectedCollapsedOption.value) {
    foldsOptions.value = filterNonMatchingValues(value)
  }
}

watch(
  () => props.modelValue,
  (value) => {
    picked.value = value
    if (collapsedOptions.value.length > 0) {
      updateOptionDisplay(value)
    }
  },
  { immediate: true, deep: true }
)

const change = (item) => {
  if (props.valueKey ? picked.value[props.valueKey] === item.value[props.valueKey] : picked.value === item.value) {
    return
  }
  isCollapsedSelected.value = Boolean(item.collapsed)

  emit('update:modelValue', item.value)
}
</script>

<style scoped lang="less">
.tab-container {
  max-width: 210px;
  height: 24px;
  font-size: 12px;
  display: flex;
  border-radius: 4px;

  .tabs-wrap {
    display: flex;
    justify-content: space-between;
    background-color: var(--te-configurator-tabs-group-bg-color);
    border-radius: 4px;
    .tiny-button-group {
      display: flex;
      .button-wrap {
        display: flex;
        align-items: center;
      }
    }

    .tiny-button.tiny-button.tiny-button--default {
      margin: 0;
      padding: 0;
      border: none;
      line-height: 14px;
      min-width: 20px;
      background-color: var(--te-configurator-tabs-group-bg-color);
      color: var(--te-configurator-common-text-color-weaken);

      &:hover {
        background-color: var(--te-configurator-tabs-group-bg-color-hover);
        color: var(--te-configurator-common-text-color-secondary);
        border-radius: 4px;
        .svg-icon {
          color: var(--te-configurator-common-icon-color-primary);
        }
      }

      &.selected {
        background-color: var(--te-configurator-tabs-group-bg-color-active);
        color: var(--te-configurator-common-text-color-secondary);
        border-radius: 4px;
        .svg-icon {
          color: var(--te-configurator-common-icon-color-primary);
        }
      }
    }
    .tab-item {
      display: flex;
      align-items: center;
      text-align: center;
      cursor: pointer;
      position: relative;
      .label-text {
        width: 100%;
        height: 12px;
        .bem-Svg {
          margin-top: -3px;
        }
      }
    }
    :deep(.drop-down-options) {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 24px;
      color: var(--te-configurator-common-text-color-weaken);

      &:hover {
        background-color: var(--te-configurator-tabs-group-bg-color-hover);
        border-radius: 4px;
        color: var(--te-configurator-common-text-color-primary);
      }
      &.selected {
        background-color: var(--te-configurator-tabs-group-bg-color-active);
        color: var(--te-configurator-common-text-color-primary);
        border-radius: 4px;
      }
      .tiny-dropdown__title {
        margin: 0;
        line-height: 12px;
        font-size: var(--te-base-font-size-base);
        .selected-option {
          text-align: center;
        }
      }
      .tiny-dropdown__suffix-inner {
        width: 20px;
        display: flex;
        justify-content: center;
        .tiny-svg {
          fill: var(--te-configurator-common-icon-color);
        }
      }
      .tiny-dropdown__trigger:hover {
        color: var(--te-configurator-common-text-color-primary);
      }
    }
  }
}
.dropdown-menu-list.tiny-popper.tiny-dropdown-menu {
  margin-top: 4px;
}

.dropdown-menu-list {
  padding: 8px 0px;
  margin-left: 20px;
  border-radius: 4px;
  background-color: var(--te-configurator-common-bg-color);
  color: var(--te-configurator-common-text-color-weaken);
  z-index: 9999;
  box-shadow: 0 0 10px 0 var(--te-configurator-common-border-color);

  :deep(.focusing) {
    background-color: var(--te-configurator-common-bg-color);
  }

  :deep(.tiny-dropdown-item) {
    color: var(--te-configurator-common-text-color-weaken);
    background-color: var(--te-configurator-common-bg-color);

    &:hover,
    &:active {
      background-color: var(--te-configurator-common-bg-color-hover);
      color: var(--te-configurator-common-text-color-primary);
    }
  }

  :deep(.tiny-dropdown-item__wrap) {
    padding: 4px 12px;
  }
}
.border-right {
  display: inline-block;
  height: 12px;
  border-right: 1px solid var(--te-configurator-common-border-color);
}
</style>
