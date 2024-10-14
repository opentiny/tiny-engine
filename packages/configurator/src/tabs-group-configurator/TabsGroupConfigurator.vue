<template>
  <div class="tab-container">
    <div
      v-for="(item, index) in commonOptions"
      :key="item.label"
      :class="['tab-item', { selected: picked === (valueKey ? item.value[valueKey] : item.value) }]"
      :style="{ width: getItemWidth(collapsedOptions.length && index === commonOptions.length - 1) + 'px' }"
      @click.stop="change(item.value)"
    >
      <span :class="['label-text', index < commonOptions.length - 1 ? 'border-right' : '']">
        <span v-if="item?.label">{{ item.label }}</span>
        <tiny-popover
          v-if="item?.icon"
          :effect="effect"
          :placement="placement"
          :visible-arrow="false"
          :content="item.content"
          trigger="hover"
        >
          <template #reference>
            <svg-icon v-if="item.icon" :name="item.icon" class="bem-Svg"></svg-icon>
          </template>
        </tiny-popover>
        <svg-icon
          v-if="collapsedOptions.length && index === commonOptions.length - 1"
          name="down-arrow"
          class="bem-Svg"
          color="var(--ti-lowcode-base-default-button-border-disable-color)"
          @click.stop="showMore = !showMore"
        ></svg-icon>
      </span>
      <div
        v-if="collapsedOptions.length && index === commonOptions.length - 1 && showMore"
        class="more-tabs-wrap"
        :visible-arrow="false"
        :style="{ width: getItemWidth(true) }"
      >
        <div
          v-for="foldsItem in foldsOptions"
          class="collapse-item"
          :key="foldsItem.label"
          @click.stop="change(foldsItem.value)"
        >
          <span v-if="foldsItem.label">{{ foldsItem.label }}</span>
          <svg-icon v-if="foldsItem.icon" :name="foldsItem.icon" class="bem-Svg"></svg-icon>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, watch } from 'vue'
import { Popover } from '@opentiny/vue'

export default {
  components: {
    TinyPopover: Popover
  },
  props: {
    value: {
      type: String,
      default: ''
    },
    valueKey: {
      type: String,
      default: ''
    },
    effect: {
      type: String,
      default: 'dark'
    },
    placement: {
      type: String,
      default: 'top'
    },
    labelWidth: {
      type: String,
      default: '60'
    },
    options: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const picked = ref()
    const uncollapsedOptions = ref(props.options.filter((option) => !option.collapsed))
    const collapsedOptions = ref(props.options.filter((option) => option.collapsed))
    const commonOptions = ref(
      collapsedOptions.value.length
        ? [...uncollapsedOptions.value, collapsedOptions.value[0]]
        : uncollapsedOptions.value
    )
    const foldsOptions = ref(
      collapsedOptions.value.length <= 1 ? [] : collapsedOptions.value.filter((item, index) => index > 0)
    )
    const showMore = ref(false)

    const getItemWidth = (collapsed = false) => {
      return `${parseInt(props.labelWidth, 10) + (collapsed ? 20 : 0)}`
    }

    watch(
      () => props.value,
      (value) => {
        picked.value = value
        if (collapsedOptions.value.length === 0) {
          return
        }
        if (!value) {
          commonOptions.value = [...uncollapsedOptions.value, collapsedOptions.value[0]]
          foldsOptions.value = collapsedOptions.value.filter((item, index) => index > 0)
        } else {
          const isFoldsValue = foldsOptions.value.find((item) =>
            props.valueKey ? item.value[props.valueKey] === value : item.value === value
          )
          if (isFoldsValue) {
            commonOptions.value[commonOptions.value.length - 1] = isFoldsValue
            foldsOptions.value = collapsedOptions.value.filter((item) =>
              props.valueKey ? item.value[props.valueKey] !== value : item.value !== value
            )
          }
        }
      },
      { immediate: true }
    )

    const change = (val) => {
      if (picked.value === val) {
        return
      }
      emit('update:modelValue', val)
      showMore.value = false
    }

    return {
      picked,
      collapsedOptions,
      commonOptions,
      foldsOptions,
      showMore,
      getItemWidth,
      change
    }
  }
}
</script>

<style scoped lang="less">
.tab-container {
  max-width: 210px;
  height: 24px;
  font-size: 12px;
  background-color: #f6f6f6;
  display: flex;
  border-radius: 4px;
  .tab-item {
    display: flex;
    align-items: center;
    text-align: center;
    cursor: pointer;
    position: relative;
    .label-text {
      width: 100%;
      height: 16px;

      .bem-Svg {
        margin-top: -3px;
      }

      .show-more-tabs {
        padding: 8px;
      }
    }
    .more-tabs-wrap {
      padding: 8px 0;
      position: absolute;
      top: 24px;
      right: 0;
      background-color: #fff;
      z-index: 2018;
      border-radius: 4px;
      box-shadow: 0px 0px 10px 0px rgba(25, 25, 25, 0.15);
      text-align: left;
      .collapse-item {
        padding: 0 8px;
        font-size: 12px;
        line-height: 24px;
        cursor: pointer;

        &:hover {
          background-color: var(--ti-lowcode-base-gray-101);
          border-radius: 4px;
        }
      }
    }
    &.selected {
      background-color: var(--ti-lowcode-base-gray-101);
      border-radius: 4px;
    }
    &:hover {
      background-color: var(--ti-lowcode-base-gray-101);
      border-radius: 4px;
    }
  }

  :deep(.icon-down-arrow:focus) {
    outline: none;
  }
}

.border-right {
  border-right: 1px solid var(--ti-lowcode-base-default-button-border-disable-color);
}
</style>
