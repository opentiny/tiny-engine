<template>
  <div class="footer-toolbar">
    <tiny-tabs v-model="state.type" tab-style="button-card">
      <tiny-tab-item v-for="item in state.arrangeList" :key="item.id" :name="item.id">
        <template #title>
          <span class="button-icon-item" @click="typeClick(item.id)">
            <svg-icon :name="item.svgName"></svg-icon>
          </span>
        </template>
      </tiny-tab-item>
    </tiny-tabs>
  </div>
</template>

<script>
import { reactive, inject } from 'vue'
import { Tabs, TabItem } from '@opentiny/vue'

export default {
  components: {
    TinyTabs: Tabs,
    TinyTabItem: TabItem
  },
  props: {
    modelValue: {
      type: String,
      default: 'grid'
    },
    arrangeList: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { emit }) {
    const panelState = inject('panelState', {})

    const state = reactive({
      type: props.modelValue,
      arrangeList: props.arrangeList
    })

    const typeClick = (type) => {
      if (type === 'grid') {
        panelState.isBlockList = false
      } else {
        panelState.isBlockList = true
      }

      state.type = type

      emit('update:modelValue', state.type)
    }

    return {
      state,
      typeClick
    }
  }
}
</script>

<style lang="less" scoped>
:deep(.button-icon-item) {
  width: 24px;
  text-align: center;
  height: 24px;
  line-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.footer-toolbar {
  margin-right: -12px;
  .icon-wrap {
    width: 20px;
    height: 20px;
    color: var(--ti-lowcode-text-color);
    font-size: 16px;
    border-radius: 2px;
    cursor: pointer;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    transition: 0.3s;
    &:hover {
      color: var(--ti-lowcode-common-primary-color);
    }
    &.active {
      color: var(--ti-lowcode-common-primary-color);
    }
  }
  .icon-wrap + .icon-wrap {
    margin-left: 8px;
  }

  :deep(.tiny-tabs.tiny-tabs .tiny-tabs__item) {
    width: 24px;
    height: 24px;
  }
}
</style>
