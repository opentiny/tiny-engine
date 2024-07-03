<template>
  <div class="block-add-transfer-panel">
    <div class="panel-header">
      <span>{{ title }}</span>
      <span>{{ selectedNums }}</span>
    </div>
    <div class="panel-body">
      <!-- v-bind="$attrs" 方便从BlockList组件向BlockGroupTransfer组件抛出check事件 -->
      <block-list
        v-bind="$attrs"
        :blockList="blockList"
        :trigger-check="true"
        :show-block-shot="false"
        :showSettingIcon="false"
      ></block-list>
    </div>
  </div>
</template>

<script>
import BlockList from './BlockList.vue'

export default {
  components: {
    BlockList
  },
  props: {
    title: {
      type: String,
      default: '可选区块列表'
    },
    blockList: {
      type: Array,
      default: () => []
    },
    selectedNums: {
      type: Number,
      default: 0
    }
  }
}
</script>

<style lang="less" scoped>
.block-add-transfer-panel {
  height: 100%;
  border: 1px solid var(--ti-lowcode-component-block-list-border-color);
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--ti-lowcode-materials-block-transfer-bg-color);

  .panel-header {
    color: var(--ti-lowcode-materials-block-transfer-header-text-color);
    padding: 10px;
    display: flex;
    justify-content: space-between;
    background-color: var(--ti-lowcode-materials-block-transfer-header-bg-color);
  }

  .panel-body {
    height: calc(100% - 38px);
    overflow: auto;
  }

  :deep(.block-list) {
    border: none;
    max-height: none;
    &.is-small-list {
      .block-detail {
        top: 50%;
        transform: translateY(-50%);
      }
    }
  }
}
</style>
