<template lang="">
  <span v-for="(actionsItem, index) in actions" :key="index" class="actionsItem" @click="actionsEvents(actionsItem)">
    <tiny-tooltip class="item" effect="dark" :content="actionsItem.title" placement="top">
      <component :is="actionsItem.icon"></component>
    </tiny-tooltip>
    <span class="actions-title">{{ actionsItem?.title }}</span>
  </span>
</template>

<script>
import { Tooltip } from '@opentiny/vue'

export default {
  components: {
    TinyTooltip: Tooltip
  },
  props: {
    actions: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { emit }) {
    const actionsEvents = (item) => {
      emit('actionEvents', item)
    }

    return {
      actionsEvents
    }
  }
}
</script>

<style lang="less" scoped>
.actionsItem {
  display: inline-block;
  padding: 5px 5px;
  &:hover {
    cursor: pointer;
  }
  .tiny-svg {
    color: var(--ti-lowcode-add-table-column-color);
    font-size: 16px;
  }
  .actions-title {
    margin-left: 2px;
    vertical-align: middle;
    color: var(--ti-lowcode-add-table-column-color);
  }
}
</style>
