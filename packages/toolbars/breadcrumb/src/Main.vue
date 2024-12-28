<template>
  <toolbar-base :options="options">
    <template #default>
      <div class="top-panel-breadcrumb">
        <div
          :class="[
            'top-panel-breadcrumb-title',
            { 'top-panel-breadcrumb-title-block': breadcrumbData[0] === CONSTANTS.BLOCKTEXT }
          ]"
        >
          <tiny-breadcrumb separator="：" @select="open">
            <tiny-breadcrumb-item v-for="item in breadcrumbData.slice(0, 2)" :key="item"
              >{{ item }}
            </tiny-breadcrumb-item>
          </tiny-breadcrumb>
        </div>

        <tiny-button
          class="publish"
          v-if="breadcrumbData[0] === CONSTANTS.BLOCKTEXT && currentBlock?.id"
          @click="publishBlock()"
          type="primary"
          size="small"
          >发布区块
        </tiny-button>
      </div>
      <block-deploy-dialog
        v-model:visible="state.showDeployBlock"
        :block="currentBlock"
        @changeSchema="handleChangeSchema"
      ></block-deploy-dialog>
    </template>
  </toolbar-base>
</template>

<script>
import { reactive, computed } from 'vue'
import { Breadcrumb, BreadcrumbItem, Button } from '@opentiny/vue'
import { useBreadcrumb, useLayout, useBlock } from '@opentiny/tiny-engine-meta-register'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import { BlockDeployDialog } from '@opentiny/tiny-engine-common'

export default {
  components: {
    TinyBreadcrumb: Breadcrumb,
    TinyBreadcrumbItem: BreadcrumbItem,
    BlockDeployDialog,
    TinyButton: Button,
    ToolbarBase
  },
  props: {
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup() {
    const PLUGINS_ID = {
      PAGEID: 'engine.plugins.appmanage',
      BLOCKID: 'engine.plugins.blockmanage'
    }

    const { layoutState } = useLayout()
    const { plugins } = layoutState || {}

    const state = reactive({
      showDeployBlock: false
    })
    const { CONSTANTS, getBreadcrumbData } = useBreadcrumb()
    const breadcrumbData = getBreadcrumbData()
    const publishBlock = () => {
      state.showDeployBlock = true
    }

    const open = () => {
      if (!plugins) return
      plugins.render = breadcrumbData.value[0] === CONSTANTS.PAGETEXT ? PLUGINS_ID.PAGEID : PLUGINS_ID.BLOCKID
    }

    const currentBlock = computed(useBlock().getCurrentBlock)

    const handleChangeSchema = (newSchema) => {
      useBlock().initBlock({ ...useBlock().getCurrentBlock(), content: newSchema })
    }

    return {
      breadcrumbData,
      publishBlock,
      state,
      CONSTANTS,
      open,
      currentBlock,
      handleChangeSchema
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
  margin-right: 3px;
  cursor: pointer;
  &-title {
    height: 28px;
    padding: 0 8px;
    background-color: var(--ti-lowcode-toolbar-button-bg);
    display: flex;
    border-radius: 4px;
    :deep(.reference-wrapper) {
      line-height: 22px;
    }
  }

  .tiny-breadcrumb {
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
      color: var(--ti-lowcode-media-popover-title-color);
      text-decoration: none;
      cursor: pointer;
    }

    :deep(.tiny-breadcrumb__separator) {
      padding: 0;
      margin: 0 4px 0 0;
    }

    &:last-child :deep(.tiny-breadcrumb__inner) {
      font-weight: normal;
      color: var(--ti-lowcode-media-popover-title-color);
    }
  }

  &-title-block {
    background-color: var(--ti-lowcode-toolbar-breadcrumb-bg);
    .tiny-breadcrumb__item {
      :deep(.tiny-breadcrumb__inner) {
        color: var(--ti-lowcode-toolbar-breadcrumb-left-color);
      }
      &:last-child :deep(.tiny-breadcrumb__inner) {
        color: var(--ti-lowcode-toolbar-breadcrumb-left-color);
      }
    }
  }

  &-title-block:hover {
    background-color: var(--ti-lowcode-toolbar-breadcrumb-bg-hover);
  }

  .publish {
    margin: 0 8px;
    height: 24px;
    line-height: 24px;
    min-width: 40px;
    font-size: 12px;
  }
}
</style>
