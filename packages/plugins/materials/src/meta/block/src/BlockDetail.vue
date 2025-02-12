<template>
  <div :class="['block-detail-panel', { 'no-backup': !detail?.backup }]">
    <div class="block-detail-title">
      <span>区块详情</span>
      <span class="block-detail-icon" @click="closeDetail">
        <svg-icon name="cross"></svg-icon>
      </span>
    </div>
    <div class="block-detail-content">
      <div class="block-detail-item">{{ detail?.label }}</div>
      <div class="block-detail-item">{{ detail?.author?.username }}</div>
      <div class="block-detail-item">{{ detail?.description }}</div>
    </div>
    <div class="block-detail-content">
      <div class="block-detail-item">
        <div>{{ detail?.current_history?.message }}</div>
        <div class="block-item-history">{{ detail?.current_history?.updated_at }}</div>
      </div>
      <div
        v-if="!isSettingPanel && !isShortcutPanel"
        class="block-detail-item block-detail-show-more"
        @click="openHistory"
      >
        <span>查看历史备份</span>
        <icon-double-right></icon-double-right>
      </div>
      <div
        v-if="!isDefaultGroupId(selectedGroup.groupId) && !isSettingPanel && !isShortcutPanel"
        class="block-delete"
        @click="deleteBlock(selectedBlock || detail?.id)"
      >
        <tiny-button :icon="IconDel">Delete</tiny-button>
      </div>
    </div>
  </div>
</template>

<script lang="jsx">
import { Button } from '@opentiny/vue'
import { IconDel, iconDoubleRight } from '@opentiny/vue-icon'
import { inject } from 'vue'
import { useBlock, useModal, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { requestUpdateGroup, fetchGroupBlocksById } from './http'
import { setHistoryPanelVisible } from './js/usePanel'

export default {
  components: {
    TinyButton: Button,
    IconDoubleRight: iconDoubleRight()
  },
  inheritAttrs: false,
  props: {
    detail: {
      type: Object,
      default: () => {}
    },
    isSettingPanel: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const { isRefresh, isDefaultGroupId, selectedBlock, selectedGroup } = useBlock()
    const { confirm, message } = useModal()
    const panelState = inject('panelState', {})

    const closeDetail = () => {
      emit('close')
    }

    const deleteBlock = (blockId) => {
      const groupId = selectedGroup.value.groupId
      const title = '删除区块'
      const messageRender = {
        render: () => <span>{'您确定要删除该区块吗?'}</span>
      }
      const exec = () => {
        fetchGroupBlocksById({ groupId })
          .then((data = []) => {
            const blocks = data
              .filter((item) => item.id !== blockId)
              .map((item) => ({ id: item.id, version: item.current_version }))

            const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
            requestUpdateGroup({ id: groupId, blocks, app: appId }).then(() => {
              isRefresh.value = true
              emit('close')
            })
          })
          .catch((error) => {
            emit('close')
            message({ message: `删除区块失败: ${error.message || error}`, status: 'error' })
          })
      }
      confirm({ title, status, message: messageRender, exec })
    }

    const openHistory = () => setHistoryPanelVisible(true)

    return {
      isDefaultGroupId,
      selectedBlock,
      selectedGroup,
      closeDetail,
      deleteBlock,
      openHistory,
      IconDel: IconDel(),
      isShortcutPanel: panelState.isShortcutPanel
    }
  }
}
</script>

<style lang="less" scoped>
.block-detail-panel {
  width: 228px;
  background-color: var(--te-materials-block-detail-bg-color);
  border-radius: 3px;

  .block-detail-title {
    font-size: 14px;
    color: var(--te-materials-block-detail-text-color);
    padding: 10px 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--te-materials-block-detail-border-color);

    .block-detail-icon {
      width: 20px;
      height: 20px;
      color: var(--te-materials-block-detail-icon-color);
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      transition: 0.3s;
      position: absolute;
      top: 0px;
      right: 10px;

      &:hover {
        color: var(--te-materials-block-detail-icon-color-hover);
        background: var(--te-materials-block-detail-icon-bg-color-hover);
      }
    }
  }

  .block-detail-content {
    &:not(:last-child) {
      border-bottom: 1px solid var(--te-materials-block-detail-border-color);
    }

    .block-detail-history {
      margin-top: 8px;
    }

    .block-detail-item {
      padding: 8px 12px;
      color: var(--te-materials-block-detail-text-color);
      font-size: 12px;
      span {
        margin-right: 4px;
      }

      .block-item-history {
        color: var(--te-materials-block-detail-text-color);
        margin-top: 4px;
      }
    }

    .block-detail-show-more {
      color: var(--te-materials-block-detail-text-color-emphasize);
      cursor: pointer;
    }

    .block-delete {
      padding: 12px 10px 10px;
      .tiny-button {
        padding: 0 8px;
      }
    }
  }

  &.no-backup {
    .block-detail-content {
      &:not(:last-child) {
        border: none;
      }
      &:last-child {
        .block-detail-item:not(.block-detail-show-more) {
          display: none;
        }
      }
    }
  }
}
</style>
