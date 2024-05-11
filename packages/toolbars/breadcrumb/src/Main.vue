<template>
  <div class="top-panel-breadcrumb">
    <tiny-breadcrumb separator="：">
      <tiny-breadcrumb-item v-for="item in breadcrumbData.slice(0, 2)" :key="item">{{ item }}</tiny-breadcrumb-item>
    </tiny-breadcrumb>
    <tiny-button
      class="publish"
      v-if="breadcrumbData[0] === CONSTANTS.BLOCKTEXT"
      @click="publishBlock()"
      type="primary"
      size="small"
      >发布区块</tiny-button
    >
  </div>
  <block-deploy-dialog v-model:visible="state.showDeployBlock" :nextVersion="nextVersion"></block-deploy-dialog>
</template>

<script>
import { reactive, computed } from 'vue'
import { Breadcrumb, BreadcrumbItem, Button } from '@opentiny/vue'
import { useBreadcrumb } from '@opentiny/tiny-engine-controller'
import { BlockDeployDialog } from '@opentiny/tiny-engine-common'
export default {
  components: {
    TinyBreadcrumb: Breadcrumb,
    TinyBreadcrumbItem: BreadcrumbItem,
    BlockDeployDialog,
    TinyButton: Button
  },
  setup() {
    const state = reactive({
      showDeployBlock: false
    })
    const { CONSTANTS, getBreadcrumbData } = useBreadcrumb()
    const breadcrumbData = getBreadcrumbData()
    const publishBlock = () => {
      state.showDeployBlock = true
    }

    const nextVersion = computed(() => {
      const backupList = getBreadcrumbData().value[2] || []

      let latestVersion = '1.0.0'
      let latestTime = 0
      backupList.forEach((v) => {
        const vTime = new Date(v.created_at).getTime()

        if (vTime > latestTime) {
          latestTime = vTime
          latestVersion = v.version
        }
      })

      // version 符合X.Y.Z的字符结构
      return latestVersion.replace(/\d+$/, (match) => Number(match) + 1)
    })
    return {
      breadcrumbData,
      publishBlock,
      state,
      nextVersion,
      CONSTANTS
    }
  }
}
</script>

<style lang="less" scoped>
.top-panel-breadcrumb {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: auto;
  height: 100%;

  .breadcrumb-label {
    color: var(--ti-lowcode-toolbar-title-color);
    border-right: 1px solid var(--ti-lowcode-toolbar-border-color);
    margin: 0 6px;
    padding-right: 6px;
    line-height: 1;
  }

  .tiny-breadcrumb {
    height: 100%;
    line-height: var(--base-top-panel-height);
    padding: 0 24px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    font-size: 14px;
    cursor: inherit;
  }
  .tiny-breadcrumb__item {
    cursor: inherit;
    user-select: none;
    :deep(.tiny-breadcrumb__inner) {
      color: var(--ti-lowcode-toolbar-title-color);
      text-decoration: none;
    }

    :deep(.tiny-breadcrumb__separator) {
      padding: 0;
      margin: 0;
    }

    &:last-child :deep(.tiny-breadcrumb__inner) {
      font-weight: normal;
      color: var(--ti-lowcode-toolbar-title-color);
    }
  }
}
</style>
