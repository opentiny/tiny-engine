<template>
  <span class="svg-button" @click="$emit('click', $event)">
    <tiny-tooltip effect="dark" :content="tips" :placement="placement">
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
  color: var(--ti-lowcode-component-svg-button-color);
  border: 1px solid transparent;
  border-radius: 4px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  &:hover {
    color: var(--ti-lowcode-component-svg-button-hover-color);
    background-color: var(--ti-lowcode-component-svg-button-hover-bg-color);
  }
  &.active {
    color: var(--ti-lowcode-component-svg-button-active-color);
    background-color: var(--ti-lowcode-component-svg-button-active-bg-color);
  }

  & + .svg-button {
    margin-left: 8px;
  }
  .svg-icon {
    outline: none;
  }
}
</style>
