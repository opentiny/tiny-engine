<template>
  <span class="toolbar-item-wrap" @click="click($event)">
    <component :is="getRender()" v-bind="state">
      <template #default>
        <slot name="button"></slot>
      </template>
    </component>
    <slot></slot>
    <span v-if="state.options?.collapsed && content">{{ state.content }}</span>
  </span>
</template>

<script lang="ts">
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
      default: () => ({})
    },
    trigger: {
      type: String,
      default: 'hover'
    }
  },
  emits: ['click-api'],
  setup(props, { emit }) {
    const state = reactive({
      icon: computed(() => props.icon),
      content: computed(() => props.content),
      options: computed(() => props.options),
      trigger: computed(() => props.trigger)
    })

    const click = (e: any) => {
      emit('click-api')
      e.stopPropagation()
    }

    const getRender = () => {
      if (props.options.renderType === 'button') {
        return ToolbarBaseButton
      }
      if (props.options.renderType === 'icon') {
        return ToolbarBaseIcon
      }
      return false
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
  color: var(--te-component-common-border-color);
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
