<template>
  <ul>
    <li v-for="item in history" :key="item.id" class="item">
      <block-history-template :blockHistory="item" :is-block-manage="isBlockManage"></block-history-template>
      <span class="item-icon">
        <span @click="$emit('preview', item)"
          ><svg-button class="svg-item-icon" name="text-page-review"></svg-button><span>预览</span></span
        >
        <span v-if="!isBlockManage" @click="$emit('restore', item)"
          ><svg-button class="svg-item-icon" name="text-page-revert"></svg-button><span>还原</span></span
        >
      </span>
    </li>
  </ul>
  <div v-if="!history.length" class="empty">暂无数据</div>
</template>

<script setup>
import { defineEmits, defineProps } from 'vue'
import { SvgButton } from '../index'

// 引入组件在template上使用
import BlockHistoryTemplate from './BlockHistoryTemplate.vue'

defineProps({
  history: {
    type: Array,
    default: () => []
  },
  isBlockManage: {
    type: Boolean,
    default: false
  }
})

defineEmits(['preview', 'restore'])
</script>

<style lang="less" scoped>
.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 16px;

  &:not(:last-child) {
    border-bottom: 1px solid
      var(--ti-lowcode-component-block-history-list-item-border-color, --ti-lowcode-tabs-border-color);
  }

  &:hover {
    background-color: var(--ti-lowcode-component-block-history-list-item-hover-bg);
    .item-icon {
      display: block;
    }
  }
}

.item-icon {
  display: none;
  > span {
    border: 1px solid var(--ti-lowcode-component-block-history-list-item-btn-border-color);
    height: 28px;
    color: var(--ti-lowcode-component-block-history-list-item-btn-color);
    font-size: 12px;
    border-radius: 2px;
    cursor: pointer;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    transition: 0.3s;
    padding: 0 10px;
    .svg-item-icon {
      color: var(--ti-lowcode-component-block-history-list-item-btn-color);
    }
    .svg-item-icon:hover {
      color: var(--ti-lowcode-component-block-history-list-item-btn-hover-color);
    }
    &:hover {
      color: var(--ti-lowcode-component-block-history-list-item-btn-hover-color);
      background: var(--ti-lowcode-component-block-history-list-item-btn-hover-bg);
    }

    &:last-child {
      margin-left: 4px;
    }
    > span {
      margin-left: 4px;
    }
  }
}

.empty {
  color: var(--ti-lowcode-common-empty-text-color);
}
</style>
