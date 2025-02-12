<template>
  <span class="svg-button" :class="{ 'svg-button-hover': hoverBgColor }" @click="handleClick($event)">
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
  setup(props, { emit }) {
    const isTinyIcon = computed(() => props.name.toLowerCase().indexOf('icon') === 0)

    const handleClick = (event) => {
      event.target.blur()
      emit('click', event)
    }

    return {
      isTinyIcon,
      handleClick
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
    color: var(--te-common-icon-hover);
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
  &.active {
    color: var(--te-common-icon-primary);
    background-color: var(--te-common-bg-prompt);
  }
}
</style>
