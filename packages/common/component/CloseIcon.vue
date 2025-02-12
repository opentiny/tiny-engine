<template>
  <span class="icon-wrap" @click="$emit('close')">
    <component :is="name" v-if="isTinyIcon" />
    <svg-icon v-else :name="name"></svg-icon>
  </span>
</template>

<script>
import { computed } from 'vue'

export default {
  props: {
    name: {
      type: String,
      default: 'cross'
    }
  },
  setup(props) {
    const isTinyIcon = computed(() => props.name.toLowerCase().indexOf('icon') === 0)

    return {
      isTinyIcon
    }
  }
}
</script>

<style lang="less" scoped>
.icon-wrap {
  width: 24px;
  height: 24px;
  color: var(--te-component-common-icon-color-primary);
  font-size: 16px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  transition: 0.3s;

  &:hover {
    color: var(--te-component-common-icon-color-primary);
    background-color: var(--te-component-close-icon-bg-color-hover);
  }
  &.active {
    color: var(--te-component-common-icon-color-primary);
    background-color: var(--te-component-close-icon-bg-color-active);
  }
}
</style>
