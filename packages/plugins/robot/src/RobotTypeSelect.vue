<template>
  <div class="button-wrapper">
    <tiny-tabs v-model="state.activeNameTabs" tab-style="button-card">
      <tiny-tab-item class="json-tab" :name="TALK_TYPE">
        <template #title>
          <tiny-tooltip type="normal" content="回答日常问题或对话">
            <icon-information class="plugin-common_icon" />
          </tiny-tooltip>
        </template>
      </tiny-tab-item>
      <tiny-tab-item :name="MCP_TYPE">
        <template #title>
          <tiny-tooltip type="normal" content="使用MCP">
            <icon-separate class="plugin-common_icon" />
          </tiny-tooltip>
        </template>
      </tiny-tab-item>
      <tiny-tab-item :name="BUILD_TYPE">
        <template #title>
          <tiny-tooltip type="normal" content="让AI帮忙搭建页面">
            <icon-task-cooperation class="plugin-common_icon" />
          </tiny-tooltip>
        </template>
      </tiny-tab-item>
    </tiny-tabs>
  </div>
</template>

<script lang="ts">
import { reactive, watch } from 'vue'
import { Tabs, TabItem, Tooltip } from '@opentiny/vue'
import { iconInformation, iconSeparate, iconTaskCooperation } from '@opentiny/vue-icon'
import { TALK_TYPE, MCP_TYPE, BUILD_TYPE } from './js/robotSetting'

export default {
  components: {
    TinyTabs: Tabs,
    TinyTabItem: TabItem,
    TinyTooltip: Tooltip,
    iconInformation: iconInformation(),
    iconSeparate: iconSeparate(),
    iconTaskCooperation: iconTaskCooperation()
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 30px;
  border: 1px solid rgb(194, 194, 194);
  border-radius: 999px;
  cursor: pointer;
  box-sizing: border-box;

  :deep(.tiny-tabs) {
    display: flex;
    justify-content: center;
    align-items: center;
    .plugin-common_icon {
      margin: 0 4px;
    }
  }
}
</style>
