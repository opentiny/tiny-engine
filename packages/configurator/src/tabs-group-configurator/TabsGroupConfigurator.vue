<template>
  <div class="tab-container">
    <div
      v-for="(item, index) in options"
      :key="item.label"
      :class="['tab-item', picked === item.value ? 'active-tab' : '']"
      :style="{ width: getItemWidth(item) + 'px' }"
      @click="change(item.value)"
    >
      <span :class="['label-text', index < options.length - 1 ? 'border-right' : '']">
        {{ item.label }}
        <tiny-popover
          v-if="item.children"
          placement="bottom-start"
          :visible-arrow="false"
          :width="getItemWidth(item.value)"
        >
          <template #reference>
            <svg-icon name="down-arrow" color="#DBDBDB"></svg-icon>
          </template>
          <div
            v-for="collapseItem in item.children"
            :class="['collapse-item', picked === item.value ? 'active-tab' : '']"
            :key="collapseItem.label"
            @click="change(collapseItem.value)"
          >
            {{ collapseItem.label }}
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

    const getItemWidth = (item) => {
      return `${parseInt(props.labelWidth, 10) + (item.children ? 20 : 0)}`
    }

    const change = (val) => {
      emit('update:modelValue', val)
    }
    return {
      picked,
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
      background-color: #e6e6e6;
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
    background-color: #e6e6e6;
    border-radius: 4px;
  }
}

.active-tab {
  background-color: #e6e6e6;
  border-radius: 4px;
}

.border-right {
  border-right: 1px solid #dbdbdb;
}
</style>
