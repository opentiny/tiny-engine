<template>
  <plugin-setting
    v-if="isOpen"
    class="plugin-block-setting"
    title="区块设置"
    @mouseleave="onMouseLeave"
    @click="handleClick"
  >
    <template #header>
      <button-group>
        <tiny-button @click="updateBlock">保存 </tiny-button>
        <tiny-button
          type="primary"
          :disabled="globalConfig.dslMode === 'Angular'"
          class="publish-btn"
          @click="showDeployBlockDialog"
          >发布
        </tiny-button>
        <svg-button name="text-copy-page" placement="bottom" tips="复制区块"></svg-button>
        <svg-button name="delete" tips="删除" placement="top" @click="deleteBlock"></svg-button>
        <close-icon @click="closePanel"></close-icon>
      </button-group>
    </template>
    <template #content>
      <tiny-collapse v-model="state.activeName">
        <tiny-collapse-item title="基本设置" name="base">
          <block-config ref="blockConfigForm"></block-config>
        </tiny-collapse-item>
        <tiny-collapse-item name="attribute">
          <template #title>
            <div class="title-wrapper">
              <span>属性设置</span>
            </div>
          </template>
          <div class="block-attribute">
            <block-property :show-video="state.showAttributeGuide">
              <template #video>
                <div class="video-close" @click.stop="handleShowGuide('showAttributeGuide')">
                  <span class="close-text">收起</span>
                  <close-icon></close-icon>
                </div>
              </template>
            </block-property>
          </div>
        </tiny-collapse-item>
        <tiny-collapse-item title="事件设置" name="event">
          <template #title>
            <div class="title-wrapper">
              <span>事件设置</span>
            </div>
          </template>
          <div class="block-event">
            <block-event :show-video="state.showEventGuide">
              <template #video>
                <div class="video-close" @click.stop="handleShowGuide('showEventGuide')">
                  <span class="close-text">收起</span>
                  <close-icon></close-icon>
                </div>
              </template>
            </block-event>
          </div>
        </tiny-collapse-item>
        <tiny-collapse-item title="生命周期设置" name="lifeCycle">
          <div class="life-cycles-container">
            <life-cycles :isPage="false" :bindLifeCycles="state.bindLifeCycles" @bind="bindLifeCycles"></life-cycles>
          </div>
        </tiny-collapse-item>
        <tiny-collapse-item title="版本列表" name="history">
          <block-history-list
            :is-block-manage="true"
            :history="state.backupList"
            @preview="previewHistory"
          ></block-history-list>
        </tiny-collapse-item>
      </tiny-collapse>
    </template>
  </plugin-setting>
  <block-deploy-dialog
    v-model:visible="state.showDeployBlock"
    :block="publishBlock"
    @changeSchema="handleChangeSchema"
  ></block-deploy-dialog>
</template>

<script lang="jsx">
import { reactive, ref, watch, watchEffect, computed } from 'vue'
import { Button as TinyButton, Collapse as TinyCollapse, CollapseItem as TinyCollapseItem } from '@opentiny/vue'
import { useModal, getMergeMeta, useBlock } from '@opentiny/tiny-engine-meta-register'
import { BlockHistoryList, PluginSetting, CloseIcon, SvgButton, ButtonGroup } from '@opentiny/tiny-engine-common'
import { previewBlock } from '@opentiny/tiny-engine-common/js/preview'
import { LifeCycles } from '@opentiny/tiny-engine-common'
import BlockEvent from './BlockEvent.vue'
import BlockConfig from './BlockConfig.vue'
import BlockProperty from './BlockProperty.vue'
import {
  getEditBlock,
  delBlock,
  saveBlock,
  getBlockBase64,
  setConfigItemVisible,
  saveArrayConfig
} from './js/blockSetting'
import { BlockDeployDialog } from '@opentiny/tiny-engine-common'

const isOpen = ref(false)

export const openPanel = () => {
  isOpen.value = true
}

export const closePanel = () => {
  isOpen.value = false
}

const removeBlock = delBlock(closePanel)

export default {
  components: {
    TinyButton,
    TinyCollapse,
    TinyCollapseItem,
    BlockEvent,
    BlockConfig,
    PluginSetting,
    BlockProperty,
    BlockHistoryList,
    LifeCycles,
    CloseIcon,
    BlockDeployDialog,
    SvgButton,
    ButtonGroup
  },
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    }
  },
  setup() {
    const { confirm } = useModal()
    const editBlock = computed(getEditBlock)
    const publishBlock = computed(() => {
      const currentBlock = useBlock().getCurrentBlock()
      const currentEditBlock = getEditBlock()

      if (currentBlock?.id === currentEditBlock?.id) {
        return currentBlock
      }

      return currentEditBlock
    })
    const blockConfigForm = ref(null)

    const state = reactive({
      activeName: ['base', 'attribute', 'event', 'lifeCycle', 'history'],
      backupList: [],
      showDeployBlock: false,
      bindLifeCycles: {},
      showAttributeGuide: false,
      showEventGuide: false
    })

    watchEffect(() => {
      state.bindLifeCycles = getEditBlock()?.content?.lifeCycles || {}
    })

    watch(
      () => {
        const block = getEditBlock()
        return [block?.id, block?.histories?.length]
      },
      () => {
        const block = getEditBlock()

        if (block?.id) {
          state.backupList = block.histories
        }
      }
    )

    const deleteBlock = () => {
      const title = '删除区块'
      const message = '您确认删除该区块吗?'

      confirm({ title, message, exec: removeBlock })
    }

    const updateBlock = () => {
      saveArrayConfig()
      blockConfigForm.value.validateForm().then(() => {
        const block = getEditBlock()

        if (block.content?.schema?.properties?.[0]?.content.length > 1) {
          const contentList = block.content.schema.properties[0].content
          const propertyList = contentList.map((e) => e.property)
          if (new Set(propertyList).size !== propertyList.length) {
            useModal().message({
              message: '属性设置包含重复属性，请修改后重试',
              status: 'error'
            })
            return false
          }
        }
        const title = '保存区块'
        const message = '您确认修改并保存该区块吗?'

        confirm({
          title,
          message,
          exec: async () => {
            const currentId = useBlock().getCurrentBlock()?.id
            if (block.id === currentId) {
              // 获取区块截图
              block.screenshot = await getBlockBase64()
            }
            saveBlock(block)
          }
        })

        return undefined
      })
    }

    const showDeployBlockDialog = () => {
      saveArrayConfig()
      blockConfigForm.value.validateForm().then(() => {
        state.showDeployBlock = true
      })
    }

    const bindLifeCycles = (lifeCycles) => {
      const block = getEditBlock()
      if (!block?.content) {
        return
      }

      block.content.lifeCycles = lifeCycles
    }

    const previewHistory = (item) => {
      item &&
        previewBlock({
          id: item.blockId,
          history: item.id,
          framework: getMergeMeta('engine.config')?.dslMode,
          platform: getMergeMeta('engine.config')?.platformId
        })
    }

    const onMouseLeave = () => {
      blockConfigForm.value?.clearValidateForm()
    }

    const handleShowGuide = (type) => {
      state[type] = !state[type]
    }

    const handleClick = () => {
      setConfigItemVisible(false)
    }

    const handleChangeSchema = (newSchema) => {
      // 如果是当前正在画布编辑的区块，需要重新 importSchema
      if (getEditBlock()?.id === useBlock().getCurrentBlock()?.id) {
        useBlock().initBlock({ ...useBlock().getCurrentBlock(), content: newSchema })
      }
    }

    return {
      state,
      isOpen,
      showDeployBlockDialog,
      closePanel,
      deleteBlock,
      updateBlock,
      bindLifeCycles,
      previewHistory,
      editBlock,
      blockConfigForm,
      globalConfig: getMergeMeta('engine.config'),
      onMouseLeave,
      handleClick,
      handleShowGuide,
      handleChangeSchema,
      publishBlock
    }
  }
}
</script>

<style lang="less" scoped>
.plugin-block-setting {
  :deep(.plugin-setting-header) {
    border: 0;
    .button-group {
      column-gap: 2px;
    }
    .tiny-button {
      width: 40px;
      padding: 0;
      min-width: 40px;
      margin-right: 2px;
    }
    .close-plugin-setting-icon {
      margin-left: 4px;
    }
  }
  .publish-btn {
    margin-right: 8px;
  }

  .video-close {
    font-size: 16px;
    cursor: pointer;
    .close-text {
      display: inline-block;
      vertical-align: top;
      font-size: 14px;
    }
  }
  :deep(.plugin-setting-content) {
    padding: 0 0 16px 0;
  }

  :deep(.tiny-col) {
    padding-left: 0;
  }

  :deep(.block-guide) {
    width: 100%;

    .content {
      .guide-video {
        width: 100%;
        height: auto;
      }
    }
  }

  .life-cycles-container {
    padding: 0 0 12px 0;
  }

  .block-attribute,
  .block-event {
    position: relative;
    :deep(.tiny-col) {
      position: inherit;
    }

    :deep(.show-video-text) {
      position: absolute;
      z-index: 100;
      top: -23px;
      right: 40px;
    }
  }

  :deep(.title-wrapper) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .show-video-text {
      display: inline-block;
      cursor: pointer;
      font-size: 12px;

      .svg-icon {
        vertical-align: middle;
        display: inline-block;
        font-size: 20px;
        margin-right: 3px;
      }

      color: var(--ti-lowcode-block-video-tip-color);
    }
  }
}
</style>
