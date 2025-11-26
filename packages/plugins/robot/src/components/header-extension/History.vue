<template>
  <span style="display: inline-flex; line-height: 0; position: relative">
    <tr-icon-button :icon="IconHistory" size="28" svgSize="20" @click="showHistory = true" />
    <div v-show="showHistory" class="tr-history-container">
      <div><h3 style="padding-left: 12px">历史对话</h3></div>
      <tr-icon-button
        :icon="IconClose"
        size="28"
        svgSize="20"
        @click="showHistory = false"
        style="position: absolute; right: 14px; top: 14px"
      />
      <tr-history
        :selected="conversationState.currentId || undefined"
        :search-bar="true"
        :data="conversationState.conversations"
        @item-action="handleHistoryItemAction"
        @item-title-change="handleHistoryItemTitleChange"
        @item-click="handleHistoryItemClick"
      >
        <template #item-prefix="{ item }">
          <slot name="history-list-prefix" :item="item"></slot>
        </template>
      </tr-history>
    </div>
  </span>
</template>

<script setup lang="ts">
import { IconHistory, IconClose } from '@opentiny/tiny-robot-svgs'
import type { Conversation } from '@opentiny/tiny-robot-kit'
import { TrHistory, TrIconButton } from '@opentiny/tiny-robot'
import { ref } from 'vue'

const showHistory = ref(false)

interface HistoryItemAction {
  id: string
}

interface HistoryProps {
  conversationState: {
    currentId?: string | null
    conversations: Conversation[]
  }
  onItemClick?: (item: Conversation) => void
  onItemAction?: (action: HistoryItemAction, item: Conversation) => void
  onItemTitleChange?: (title: string, item: Conversation) => void
}

const { conversationState } = defineProps<HistoryProps>()
const emit = defineEmits<{
  (e: 'item-click', item: Conversation): void
  (e: 'item-action', action: HistoryItemAction, item: Conversation): void
  (e: 'item-title-change', title: string, item: Conversation): void
}>()

const handleHistoryItemClick = (item: Conversation) => {
  emit('item-click', item)
  showHistory.value = false
}

const handleHistoryItemAction = (action: HistoryItemAction, item: Conversation) => {
  emit('item-action', action, item)
}

const handleHistoryItemTitleChange = (title: string, item: Conversation) => {
  emit('item-title-change', title, item)
}
</script>

<style scoped lang="less">
.tr-history-container {
  position: absolute;
  right: 100%;
  top: 100%;
  z-index: var(--tr-z-index-popover);
  width: 300px;
  height: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  background-color: white;
  padding: 16px;
  border-radius: 16px;
  --tr-history-group-space-y: 0px;
  :deep(.tr-history) {
    height: calc(100% - 36px);
    overflow-y: auto;
  }
}
</style>
