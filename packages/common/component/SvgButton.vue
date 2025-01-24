<template>
  <span class="svg-button" :class="{ 'svg-button-hover': hoverBgColor }" @click="$emit('click', $event)">
    <tiny-tooltip effect="light" :content="tips" :placement="placement">
      <component :is="name" v-if="isTinyIcon" />
      <svg-icon v-else :name="name"></svg-icon>
    </tiny-tooltip>
  </span>
</template>

<script>
import { computed } from 'vue'
import { Tooltip } from '@opentiny/vue'

export default {
  components: {
    TinyTooltip: Tooltip
  },
  props: {
    tips: {
      type: String,
      default: ''
    },
    placement: {
      type: String,
      default: 'bottom'
    },
    name: {
      type: String,
      default: 'add'
    },
    hoverBgColor: {
      type: Boolean,
      default: true
    }
  },
  emits: ['click'],
  setup(props) {
    const isTinyIcon = computed(() => props.name.toLowerCase().indexOf('icon') === 0)

    return {
      isTinyIcon
    }
  }
}
</script>

<style lang="less" scoped>
.svg-button {
  width: 24px;
  height: 24px;
  font-size: 16px;
  color: var(--te-common-icon-secondary);
  border: 1px solid transparent;
  border-radius: 4px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  &:hover {
    color: var(--te-common-icon-hover);
  }
  &.active {
    color: var(--ti-lowcode-component-svg-button-active-color);
    background-color: var(--ti-lowcode-component-svg-button-active-bg-color);
  }

  .svg-icon {
    outline: none;
  }
}
.svg-button-hover {
  color: var(--te-common-icon-primary);
  &:hover {
    color: var(--te-common-icon-primary);
    background-color: var(--te-common-bg-prompt);
  }
}
</style>
