<template>
  <span class="toolbar-item-wrap" @click="click">
    <component :is="getRender()" v-bind="state">
      <template #default>
        <slot name="button"></slot>
      </template>
    </component>
    <slot></slot>
    <span v-if="state.options?.collapsed">{{ state.content }}</span>
  </span>
</template>

<script>
import { reactive, computed } from 'vue'
import ToolbarBaseIcon from './toolbar-built-in/ToolbarBaseIcon.vue'
import ToolbarBaseButton from './toolbar-built-in/ToolbarBaseButton.vue'

export default {
  components: {
    ToolbarBaseIcon,
    ToolbarBaseButton
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
          return ToolbarBaseButton
        case 'icon':
          return ToolbarBaseIcon
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
  color: var(--te-common-border-default);
  margin: 0 4px;
  font-size: 14px;
}
.toolbar-item-wrap {
  display: flex;
  align-items: center;
}
.toolbar-item-wrap div {
  display: inline-block;
}
</style>
