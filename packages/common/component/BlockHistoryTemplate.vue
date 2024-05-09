<template>
  <div class="version-col">
    <div class="version-row">
      <span v-if="isBlockManage" class="version-v">{{ blockHistory.version }}</span>
      <span class="version-date">{{ format(blockHistory.updated_at, 'yyyy/MM/dd hh:mm:ss') }}</span>
      <span v-if="isCurrentVersion(blockHistory)" class="current-version-tip">(当前版本)</span>
    </div>
    <div class="version-msg">
      {{ blockHistory.message }}
    </div>
  </div>
</template>

<script>
import { format } from '@opentiny/vue-renderless/common/date'

export default {
  props: {
    currentVersion: {
      type: String
    },
    blockHistory: {
      type: Object,
      required: true
    },
    isBlockManage: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const isCurrentVersion = (blockHistory) => blockHistory.version && blockHistory.version === props.currentVersion

    return {
      isCurrentVersion,
      format
    }
  }
}
</script>

<style lang="less" scoped>
.current-version-tip {
  display: inline-block;
  color: var(--ti-lowcode-component-block-version-list-current-version-color);
  margin: 0 6px;
  line-height: 16px;
}
.version-col {
  .version-row {
    margin-top: 10px;
    span {
      display: inline-block;
    }
    .version-v {
      font-size: 14px;
      padding: 2px 12px;
      margin-right: 10px;
      background-color: var(--ti-lowcode-component-block-version-list-version-bg);
      color: var(--ti-lowcode-component-block-version-list-version-color);
      border-radius: 6px;
    }

    .version-date {
      color: var(--ti-lowcode-component-block-version-list-time-color);
      padding: 0 10px;
      padding-left: 0;
      font-size: 14px;
    }
  }
  .version-msg {
    padding: 5px 0;
    color: var(--ti-lowcode-component-block-version-list-desc-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
