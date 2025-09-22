<template>
  <div class="button-wrapper">
    <tiny-tabs v-model="state.activeNameTabs" tab-style="button-card">
      <tiny-tab-item class="json-tab" :name="TALK_TYPE">
        <template #title>
          <tiny-tooltip effect="light" content="对话">
            <template #content>
              <div class="tip-cantainer">
                <div>
                  <svg-icon name="chat" class="tip-common_icon"></svg-icon>
                </div>
                <div class="tips">
                  <div class="tip-header">对话</div>
                  <div class="tip-content">回答日常问题或在开始任务前进行对话。</div>
                </div>
              </div>
            </template>
            <svg-icon name="chat" class="plugin-common_icon"></svg-icon>
          </tiny-tooltip>
        </template>
      </tiny-tab-item>
      <tiny-tab-item :name="BUILD_TYPE">
        <template #title>
          <tiny-tooltip effect="light" content="智能搭建">
            <template #content>
              <div class="tip-cantainer">
                <div>
                  <svg-icon name="intelligent-construction" class="tip-common_icon"></svg-icon>
                </div>
                <div class="tips">
                  <div class="tip-header">智能搭建</div>
                  <div class="tip-content">根据描述文案自动搭建对应的页面。</div>
                </div>
              </div>
            </template>
            <svg-icon name="intelligent-construction" class="plugin-common_icon"></svg-icon>
          </tiny-tooltip>
        </template>
      </tiny-tab-item>
    </tiny-tabs>
  </div>
</template>

<script lang="ts">
import { reactive, watch } from 'vue'
import type { Component } from 'vue'
import { Tabs, TabItem, Tooltip } from '@opentiny/vue'
import { TALK_TYPE, MCP_TYPE, BUILD_TYPE } from './js/robotSetting'

export default {
  components: {
    TinyTabs: Tabs,
    TinyTabItem: TabItem,
    TinyTooltip: Tooltip as Component
  },
  props: {
    aiType: {
      type: String,
      default: TALK_TYPE
    }
  },
  emits: ['typeChange'],
  setup(props, { emit }) {
    const state = reactive({
      activeNameTabs: props.aiType || TALK_TYPE
    })

    const handleTabChange = (value) => {
      emit('typeChange', value)
    }

    // 使用watch监听activeNameTabs的变化
    watch(
      () => state.activeNameTabs,
      (newValue) => {
        handleTabChange(newValue)
      }
    )

    return {
      state,
      TALK_TYPE,
      MCP_TYPE,
      BUILD_TYPE
    }
  }
}
</script>

<style lang="less" scoped>
.button-wrapper {
  width: 80px;
  height: 32px;
  border-radius: 999px;
  cursor: pointer;
  box-sizing: border-box;
  margin-left: 10px;

  :deep(.tiny-tabs) {
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid var(--te-common-border-default);
    width: 80px;
    height: 32px;
    border-radius: 999px;
    background-color: var(--te-common-bg-container);
    .plugin-common_icon {
      margin: 0 4px;
    }
    .tiny-tabs__header {
      width: calc(100% - 8px);
      .tiny-tabs__nav-wrap {
        border-radius: 999px;
      }
      .tiny-tabs__item {
        height: 24px;
        &.is-active {
          border-radius: 24px;
          border: none;
          box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.08);
        }
      }
    }
  }
}
.tip-cantainer {
  width: 180px;
  padding: 4px 0;
  display: flex;
  align-items: flex-start;
  .tips {
    margin-left: 10px;
    line-height: 18px;
  }
  .tip-header {
    font-weight: 600;
  }
  .tip-content {
    color: var(--te-common-text-secondary);
  }
}
</style>
