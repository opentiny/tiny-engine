<template>
  <span class="toolbar-item-wrap" @click="click">
    <component :is="getRender()" v-bind="state">
      <template #default>
        <slot name="button"></slot>
      </template>
    </component>
    <slot></slot>
    <span v-if="state.options?.collapsed" class="operate-title">{{ state.content }}</span>
  </span>
  <span class="split-line" v-if="state.options?.separate">|</span>
</template>

<script>
import { reactive, computed } from 'vue'
import ToolbarIcon from './toolbar-built-in/ToolbarIcon.vue'
import ToolbarButton from './toolbar-built-in/ToolbarButton.vue'

export default {
  components: {
    ToolbarIcon,
    ToolbarButton
  },
  props: {
    icon: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
    },
    options: {
      type: Object,
      default: () => {}
    }
  },
  emits: ['click-api'],
  setup(props, { emit }) {
    const state = reactive({
      icon: computed(() => props.icon),
      content: computed(() => props.content),
      options: computed(() => props.options)
    })

    const click = () => {
      emit('click-api')
    }

    const getRender = () => {
      switch (props.options.renderType) {
        case 'button':
          return ToolbarButton
        case 'icon':
          return ToolbarIcon
        default:
          return false
      }
    }

    return {
      state,
      click,
      getRender
    }
  }
}
</script>
<style scoped>
.split-line {
  color: var(--ti-lowcode-toolbar-border-color);
  margin: 0 4px;
  font-size: 14px;
}
.toolbar-item-wrap div {
  display: inline-block;
}
.operate-title {
  vertical-align: middle;
  padding-left: 8px;
}
</style>
