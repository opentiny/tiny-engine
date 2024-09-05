<template>
  <span class="toolbar-item-wrap" @click="handelClick">
    <component :is="getRender()" v-bind="state">
      <template #button-extends>
        <slot name="button-extends"></slot>
      </template>
    </component>
    <slot name="extends"></slot>
    <span v-if="state.options?.collapsed" class="operate-title">{{ state.content }}</span>
  </span>
  <span class="split-line" v-if="state.options?.separate">|</span>
</template>

<script>
import { reactive, computed } from 'vue'
import ToolbarIcon from './toolbarBuiltIn/toolbarIcon.vue'
import ToolbarButton from './toolbarBuiltIn/toolbarButton.vue'

export default {
  components: {
    ToolbarIcon,
    ToolbarButton
  },
  props: {
    type: {
      type: String,
      default: 'icon'
    },
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
    
    const handelClick = () => {
      emit('click-api')
    }

    const getRender = () => {
      switch (props.type) {
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
      handelClick,
      getRender
    }
  }
}
</script>
<style scoped>
.split-line {
  color: var(--ti-lowcode-toolbar-border-color);
  margin-left: 6px;
}
.toolbar-item-wrap div {
  display: inline-block;
}
.operate-title {
  vertical-align: middle;
  padding-left: 8px;
}
</style>
