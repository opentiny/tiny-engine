<template>
  <div
    v-if="state.showRouterJumper"
    :class="{
      'jumper-wrapper': true,
      disabled: !state.targetPageId
    }"
    :title="state.targetPageId ? '路由跳转编辑' : '未绑定路由跳转页面'"
    @click="routerPageJump"
  >
    <div class="jumper">
      <svg-icon name="jump"></svg-icon>
    </div>
  </div>
</template>

<script>
import { reactive, watch } from 'vue'
import { usePage } from '@opentiny/tiny-engine-meta-register'

const LEGAL_JUMPER_COMPONENT = ['RouterLink']

export default {
  props: {
    hoverState: {
      type: Object,
      default: () => ({})
    },
    inactiveHoverState: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const switchPage = usePage().switchPageWithConfirm
    const state = reactive({
      showRouterJumper: false,
      targetPageId: null,
      left: 0,
      top: 0
    })

    const routerPageJump = () => {
      if (state.targetPageId) {
        switchPage(state.targetPageId, true)
      }
    }

    watch(
      () => [props.hoverState, props.inactiveHoverState],
      ([hoverState, inactiveHoverState]) => {
        const usedHoverState = [hoverState, inactiveHoverState].find(({ componentName }) =>
          LEGAL_JUMPER_COMPONENT.includes(componentName)
        )

        if (!usedHoverState) {
          state.showRouterJumper = false
          return
        }
        const { width, left, top, element } = usedHoverState
        state.showRouterJumper = true
        state.left = `${left + width}px`
        state.top = `${top}px`
        state.targetPageId = element.getAttribute('data-router-target-page-id') || null
      },
      { deep: true }
    )

    return {
      state,
      routerPageJump
    }
  }
}
</script>

<style lang="less" scoped>
.jumper-wrapper {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--te-canvas-container-bg-color);
  cursor: pointer;
  z-index: 3;
  transform: translateX(-80%) translateY(-20%);
  top: v-bind('state.top');
  left: v-bind('state.left');
  border: 1px solid var(--te-canvas-container-border-color-hover);
  &.disabled {
    opacity: 0.3;
  }
  &:not(.disabled):hover {
    border-color: var(--te-canvas-container-border-color-checked);
    background-color: var(--te-canvas-container-bg-color-checked);
    .jumper {
      color: var(--te-canvas-container-router-jumper-text-color);
    }
  }
  .jumper {
    width: 16px;
    height: 16px;
  }
}
</style>
