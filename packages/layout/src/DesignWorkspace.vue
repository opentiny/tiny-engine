<template>
  <div class="template-manager">
    <div class="manager-header">
      <div>
        <tiny-icon-arrow-left
          v-if="!!currentPageId"
          class="icon-arrow-left"
          @click="$emit('backToDesigner', '')"
        ></tiny-icon-arrow-left>
        <svg-icon name="template-logo"></svg-icon>
        <span>TinyEngine</span>
      </div>
    </div>
    <div class="manager-index">
      <div class="manager-menu">
        <template v-for="item in workspaceRegistry" :key="item.value">
          <div class="menu-item" :class="{ active: activeNode.id === item.id }" @click="handleMenuClick(item)">
            <svg-icon :name="item.icon" />
            <span>{{ item.title }}</span>
          </div>
        </template>
      </div>
      <div class="manager-container">
        <component :is="activeNode.entry" @handleToMenu="handleMenuClick" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { iconArrowLeft } from '@opentiny/vue-icon'

export default {
  components: {
    TinyIconArrowLeft: iconArrowLeft()
  },
  props: {
    workspaceRegistry: {
      type: Array,
      default: () => []
    },
    currentPageId: {
      type: String,
      default: ''
    }
  },
  emits: ['backToDesigner'],
  setup(props) {
    const activeNode = ref(
      props.workspaceRegistry.find((item) => item.id === props.currentPageId) || props.workspaceRegistry[0]
    )

    const handleMenuClick = (menu) => {
      activeNode.value = menu
    }

    return {
      activeNode,
      handleMenuClick
    }
  }
}
</script>

<style lang="less" scoped>
.template-manager {
  width: 100%;
  height: 100vh;
  background-color: var(--te-common-bg-default);
  .manager-header {
    height: 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--te-common-border-bg-divider);
    padding: 0 24px;
    .icon-arrow-left {
      font-size: 28px;
      padding-right: 10px;
      cursor: pointer;
    }
    .svg-icon {
      font-size: 28px;
      padding-right: 8px;
    }

    span {
      font-size: 14px;
      font-weight: 500;
    }
  }
  .manager-index {
    display: flex;
    justify-content: space-between;
    height: calc(100vh - 49px);
    .manager-menu {
      font-size: 12px;
      padding-top: 24px;
      width: 220px;
      border-right: 1px solid var(--te-common-border-bg-divider);
    }
  }
  .menu-item {
    padding: 4px 16px;
    cursor: pointer;
    .svg-icon {
      padding-right: 4px;
    }
    &:hover {
      background: var(--te-common-bg-container);
    }
  }
  .active {
    background: var(--te-common-bg-container);
    position: relative;
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0px;
      width: 2px;
      height: 100%;
      background: var(--te-common-bg-primary);
    }
  }
  .manager-container {
    padding: 20px;
    width: calc(100% - 220px);
    background: var(--te-common-bg-container);
  }
}
</style>
