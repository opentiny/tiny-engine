<template>
  <div class="tab-container">
    <div class="tabs-wrap">
      <tiny-button-group>
        <tiny-button
          v-for="(item, index) in uncollapsedOptions"
          :key="item.label || item.icon"
          :style="{ width: getItemWidth() + 'px' }"
          :class="['tab-item', { selected: picked === (valueKey ? item.value[valueKey] : item.value) }]"
          @click.stop="change(item)"
        >
          <span
            :class="[
              'label-text',
              { 'border-right': collapsedOptions.length || index < uncollapsedOptions.length - 1 }
            ]"
          >
            <span v-if="item?.label && !item?.content">{{ item.label }}</span>
            <tiny-popover
              v-if="item?.content"
              :placement="placement"
              :visible-arrow="false"
              :content="item.content"
              trigger="hover"
            >
              <template #reference>
                <span v-if="item?.label">{{ item.label }}</span>
                <svg-icon v-if="item?.icon" :name="item.icon" class="bem-Svg"></svg-icon>
              </template>
            </tiny-popover>
          </span>
        </tiny-button>
        <tiny-dropdown
          v-if="collapsedOptions.length"
          trigger="click"
          :class="[
            'drop-down-options',
            { selected: collapsedOptions.find((item) => picked === (valueKey ? item.value[valueKey] : item.value)) }
          ]"
          :style="{ width: getItemWidth(true) + 'px' }"
        >
          <span class="selected-option" @click.stop="change(selectedCollapsedOption)">
            <span v-if="selectedCollapsedOption?.label && !selectedCollapsedOption?.content">{{
              selectedCollapsedOption.label
            }}</span>
            <tiny-popover
              v-if="selectedCollapsedOption?.content"
              :placement="placement"
              :visible-arrow="false"
              :content="selectedCollapsedOption.content"
              trigger="hover"
            >
              <template #reference>
                <span v-if="selectedCollapsedOption?.label">{{ selectedCollapsedOption.label }}</span>
                <svg-icon
                  v-if="selectedCollapsedOption?.icon"
                  :name="selectedCollapsedOption.icon"
                  class="bem-Svg"
                ></svg-icon>
              </template>
            </tiny-popover>
          </span>
          <template #dropdown>
            <tiny-dropdown-menu>
              <tiny-dropdown-item
                v-for="item in foldsOptions"
                :key="item.label || item.icon"
                @click.stop="change(item)"
              >
                <span v-if="item?.label && !item?.content">{{ item.label }}</span>
                <tiny-popover
                  v-if="item?.content"
                  :placement="placement"
                  :visible-arrow="false"
                  :content="item.content"
                  trigger="hover"
                >
                  <template #reference>
                    <span v-if="item?.label">{{ item.label }}</span>
                    <svg-icon v-if="item?.icon" :name="item.icon" class="bem-Svg"></svg-icon>
                  </template>
                </tiny-popover>
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
  Popover as TinyPopover,
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
  // 提示内容位置
  placement: {
    type: String,
    default: 'top'
  },
  // tabItem宽度
  labelWidth: {
    type: Number,
    default: 63
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
    .tiny-button.tiny-button.tiny-button--default {
      margin: 0;
      padding: 0;
      border: none;
      background-color: var(--te-common-bg-container);
      line-height: 14px;
      min-width: 20px;
      max-width: 80px;
      color: var(--te-common-text-weaken);

      &:hover {
        background-color: var(--ti-lowcode-base-gray-101);
        color: var(--te-common-text-primary);
        border-radius: 4px;
      }

      &.selected {
        background-color: var(--ti-lowcode-base-gray-101);
        color: var(--te-common-text-primary);
        border-radius: 4px;
      }
    }
    .tab-item {
      display: flex;
      align-items: center;
      text-align: center;
      cursor: pointer;
      position: relative;
      background-color: var(--te-common-bg-container);
      .label-text {
        width: 100%;
        height: 12px;

        .bem-Svg {
          margin-top: -3px;
        }
      }
    }
    .tiny-dropdown {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 24px;
      background-color: var(--ti-lowcode-base-bg-5);
      color: var(--te-common-text-weaken);
      &.selected {
        background-color: var(--ti-lowcode-base-gray-101);
        color: var(--te-common-text-primary);
        border-radius: 4px;
      }
      :deep(.tiny-dropdown__title) {
        margin: 0;
        line-height: 12px;
        .selected-option {
          text-align: center;
        }
      }

      :deep(.tiny-dropdown__suffix-inner) {
        width: 20px;
        display: flex;
        justify-content: center;
      }

      &:hover {
        background-color: var(--ti-lowcode-base-gray-101);
        border-radius: 4px;
        color: var(--te-common-text-primary);
      }
    }
  }
}
.tiny-dropdown-menu {
  padding: 8px 0px;
  margin: 0px 0px 0px 20px;
  background-color: var(--te-common-bg-default);
  color: var(--te-common-text-weaken);
  z-index: 9999;
  box-shadow: 0 0 10px 0 var(--te-common-border-default);
  --ti-dropdown-menu-arrow-margin-top: 0;

  :deep(.focusing) {
    background-color: var(--te-common-bg-default);
  }

  :deep(.tiny-dropdown-item__wrap) {
    padding: 4px 12px;
    background-color: var(--te-common-bg-default);

    &:hover {
      background-color: var(--ti-lowcode-base-gray-101);
      border-radius: 4px;
      color: var(--te-common-text-primary);
    }
  }
}
.border-right {
  border-right: 1px solid var(--te-common-border-default);
}
</style>
