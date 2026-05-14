<template>
  <span style="display: inline-flex; line-height: 0; position: relative">
    <tr-icon-button :icon="IconHistory" size="28" svgSize="20" @click="showHistory = true" />
    <div v-show="showHistory" class="tr-history-container">
      <div><h3 style="padding-left: 12px">历史对话</h3></div>
      <tr-icon-button
        :icon="IconClose"
        class="tr-history-close-button"
        size="28"
        svgSize="20"
        @click="showHistory = false"
      />
      <tr-history
        :selected="props.conversationState.currentId || undefined"
        :search-bar="true"
        :data="conversationsData"
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
import type { ConversationInfo } from '@opentiny/tiny-robot-kit'
import { TrHistory, TrIconButton, type HistoryItem, type HistoryMenuItem } from '@opentiny/tiny-robot'
import { computed, ref } from 'vue'

const showHistory = ref(false)

interface HistoryProps {
  conversationState: {
    currentId?: string | null
    conversations: ConversationInfo[]
  }
  onItemClick?: (item: HistoryItem) => void
  onItemAction?: (action: HistoryMenuItem, item: HistoryItem) => void
  onItemTitleChange?: (title: string, item: HistoryItem) => void
}

const props = defineProps<HistoryProps>()

// 将平铺格式的历史会话数据转换为分组格式（基于createdAt时间戳）
const convertFlatToGrouped = (flatData: ConversationInfo[]): Array<{ group: string; items: ConversationInfo[] }> => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const getDate = (days: number) => {
    const date = new Date(today)
    date.setDate(date.getDate() - days)
    return date
  }

  const groupConfigs = [
    { group: '今天', threshold: today },
    { group: '近3天', threshold: getDate(3) },
    { group: '近7天', threshold: getDate(7) },
    { group: '近30天', threshold: getDate(30) },
    { group: '更早', threshold: new Date(0) }
  ]

  const groups = groupConfigs.map((config) => ({ ...config, items: [] as ConversationInfo[] }))

  flatData.forEach((item) => {
    const itemDate = new Date(item.createdAt)
    const targetGroup = groups.find((g) => itemDate >= g.threshold)
    targetGroup?.items.push(item)
  })

  return groups
    .filter((group) => group.items.length > 0)
    .map((group) => ({
      group: group.group,
      items: group.items.sort((a, b) => b.createdAt - a.createdAt)
    }))
}

const conversationsData = computed(() => {
  return convertFlatToGrouped(props.conversationState.conversations)
})

const emit = defineEmits<{
  (e: 'item-click', item: HistoryItem): void
  (e: 'item-action', action: HistoryMenuItem, item: HistoryItem): void
  (e: 'item-title-change', title: string, item: HistoryItem): void
}>()

const handleHistoryItemClick = (item: HistoryItem) => {
  emit('item-click', item)
  showHistory.value = false
}

const handleHistoryItemAction = (action: HistoryMenuItem, item: HistoryItem) => {
  emit('item-action', action, item)
}

const handleHistoryItemTitleChange = (title: string, item: HistoryItem) => {
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
  .tr-history-close-button {
    position: absolute;
    right: 14px;
    top: 14px;
  }
}
</style>
