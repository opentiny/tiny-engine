<template lang="">
  <span v-for="(actionsItem, index) in actions" :key="index" class="actionsItem" @click="actionsEvents(actionsItem)">
    <tiny-tooltip class="item" effect="light" :content="actionsItem.title" placement="top">
      <component :is="actionsItem.icon"></component>
    </tiny-tooltip>
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
  background-color: var(--te-common-bg-container);
  &:not(:last-child) {
    border-right: 1px solid var(--ti-lowcode-optionitem-border-color);
  }
  .tiny-svg {
    color: var(--ti-lowcode-toolbar-icon-color);
    font-size: 16px;
    &:hover {
      cursor: pointer;
    }
  }
}
</style>
