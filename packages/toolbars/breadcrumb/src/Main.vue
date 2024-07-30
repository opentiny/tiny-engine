<template>
  <div class="top-panel-breadcrumb">
    <div class="top-panel-breadcrumb-title">
      <tiny-breadcrumb separator="：" @select="open">
        <tiny-breadcrumb-item v-for="item in breadcrumbData.slice(0, 2)" :key="item">{{ item }} </tiny-breadcrumb-item>
      </tiny-breadcrumb>
      <component :is="state.pageLock.entry"></component>
    </div>

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
import { useBreadcrumb, useLayout } from '@opentiny/tiny-engine-meta-register'
import lock from '@opentiny/tiny-engine-toolbar-checkinout'
import { BlockDeployDialog } from '@opentiny/tiny-engine-common'
export default {
  components: {
    TinyBreadcrumb: Breadcrumb,
    TinyBreadcrumbItem: BreadcrumbItem,
    BlockDeployDialog,
    TinyButton: Button
  },
  setup() {
    const PLUGINS_ID = {
      PAGEID: 'engine.plugins.appmanage',
      BLOCKID: 'engine.plugins.blockmanage'
    }

    const { layoutState } = useLayout()
    const { plugins } = layoutState

    const state = reactive({
      showDeployBlock: false,
      pageLock: lock
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

    const open = () => {
      plugins.render = breadcrumbData.value[0] === CONSTANTS.PAGETEXT ? PLUGINS_ID.PAGEID : PLUGINS_ID.BLOCKID
    }

    return {
      breadcrumbData,
      publishBlock,
      state,
      nextVersion,
      CONSTANTS,
      open
    }
  }
}
</script>

<style lang="less" scoped>
.top-panel-breadcrumb {
  padding-left: 12px;
  box-sizing: border-box;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: auto;
  height: 100%;
  &-title {
    height: 24px;
    padding: 0 8px;
    background-color: var(--ti-lowcode-toolbar-button-bg);
    display: flex;
    border-radius: 4px;
    :deep(.reference-wrapper) {
      line-height: 22px;
    }
  }

  .tiny-breadcrumb {
    height: 17px;
    line-height: var(--base-top-panel-breadcrumb-line-height);
    padding-right: 4px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    font-size: 12px;
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
      margin: 0 4px 0 0;
    }

    &:last-child :deep(.tiny-breadcrumb__inner) {
      font-weight: normal;
      color: var(--ti-lowcode-toolbar-title-color);
    }
  }
}
</style>
