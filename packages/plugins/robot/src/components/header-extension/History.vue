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
import type { Conversation } from '@opentiny/tiny-robot-kit'
import { TrHistory, TrIconButton, type HistoryItem, type HistoryMenuItem } from '@opentiny/tiny-robot'
import { computed, ref } from 'vue'

const showHistory = ref(false)

interface HistoryProps {
  conversationState: {
    currentId?: string | null
    conversations: Conversation[]
  }
  onItemClick?: (item: HistoryItem) => void
  onItemAction?: (action: HistoryMenuItem, item: HistoryItem) => void
  onItemTitleChange?: (title: string, item: HistoryItem) => void
}

const { conversationState } = defineProps<HistoryProps>()

// 将平铺格式的历史会话数据转换为分组格式（基于createdAt时间戳）
const convertFlatToGrouped = (flatData: Conversation[]): Array<{ group: string; items: Conversation[] }> => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const threeDaysAgo = new Date(today)
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const groups: Record<string, { group: string; items: Conversation[] }> = {
    today: { group: '今天', items: [] },
    yesterday: { group: '昨天', items: [] },
    lastThreeDays: { group: '近3天', items: [] },
    lastSevenDays: { group: '近7天', items: [] },
    earlier: { group: '更早', items: [] }
  }

  flatData.forEach((item) => {
    const itemDate = new Date(item.createdAt)

    if (itemDate >= today) {
      groups.today.items.push(item)
    } else if (itemDate >= yesterday) {
      groups.yesterday.items.push(item)
    } else if (itemDate >= threeDaysAgo) {
      groups.lastThreeDays.items.push(item)
    } else if (itemDate >= sevenDaysAgo) {
      groups.lastSevenDays.items.push(item)
    } else {
      groups.earlier.items.push(item)
    }
  })

  Object.values(groups).forEach((group) => {
    group.items.sort((a, b) => b.createdAt - a.createdAt)
  })

  return Object.values(groups).filter((group) => group.items.length > 0)
}

const conversationsData = computed(() => {
  return convertFlatToGrouped(conversationState.conversations)
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
}
</style>
