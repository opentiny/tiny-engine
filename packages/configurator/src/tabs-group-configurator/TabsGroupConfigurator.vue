<template>
  <div class="tab-container">
    <div
      v-for="(item, index) in options"
      :key="item.label"
      :class="['tab-item', picked === item.value ? 'active-tab' : '']"
      :style="{ width: getItemWidth(item) + 'px' }"
      @click.stop="change(item.value)"
    >
      <span :class="['label-text', index < options.length - 1 ? 'border-right' : '']">
        <span v-if="item.label">{{ item.label }}</span>
        <svg-icon v-if="item.icon" :name="item.icon"></svg-icon>
        <tiny-popover
          v-if="item.children"
          v-model="showMore"
          placement="bottom-start"
          :visible-arrow="false"
          :width="getItemWidth(item)"
          trigger="manual"
        >
          <template #reference>
            <svg-icon
              name="down-arrow"
              color="var(--ti-lowcode-base-default-button-border-disable-color)"
              @click.stop="showMore = !showMore"
            ></svg-icon>
          </template>
          <div
            v-for="collapseItem in item.children"
            :class="['collapse-item', picked === item.value ? 'active-tab' : '']"
            :key="collapseItem.label"
            @click.stop="change(collapseItem.value)"
          >
            <span v-if="collapseItem.label">{{ collapseItem.label }}</span>
            <svg-icon v-if="collapseItem.icon" :name="collapseItem.icon"></svg-icon>
          </div>
        </tiny-popover>
      </span>
    </div>
  </div>
</template>
<script>
import { ref } from 'vue'
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
    labelWidth: {
      type: String,
      default: '64'
    },
    options: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const picked = ref(props.value)
    const showMore = ref(false)

    const getItemWidth = (item) => {
      return `${parseInt(props.labelWidth, 10) + (item.children ? 20 : 0)}`
    }

    const change = (val) => {
      emit('update:modelValue', val)
    }
    return {
      picked,
      showMore,
      getItemWidth,
      change
    }
  }
}
</script>

<style scoped lang="less">
.tab-container {
  width: 210px;
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
    .label-text {
      width: 100%;
      height: 16px;
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
.collapse-item {
  font-size: 12px;
  line-height: 24px;
  padding-left: 6px;
  cursor: pointer;

  &:hover {
    background-color: var(--ti-lowcode-base-gray-101);
    border-radius: 4px;
  }
}

.active-tab {
  background-color: var(--ti-lowcode-base-gray-101);
  border-radius: 4px;
}

.border-right {
  border-right: 1px solid var(--ti-lowcode-base-default-button-border-disable-color);
}
</style>
