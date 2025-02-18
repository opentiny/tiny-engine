<template>
  <tiny-popover
    :visible-arrow="false"
    trigger="click"
    placement="bottom-start"
    :disabled="state.disabled"
    popper-class="preview-switcher-popover"
    ref="popoverRef"
  >
    <template #reference>
      <div
        v-show="state.show"
        :class="{
          'action-wrapper': true,
          disabled: state.disabled
        }"
        title="显示为"
        @click="handleClick"
      >
        <div class="action">
          <slot>
            <svg-icon name="eye"></svg-icon>
          </slot>
        </div>
      </div>
    </template>
    <div class="options">
      <div class="title">显示为</div>
      <div
        class="option"
        v-for="option in state.previewOptions"
        :key="option.id"
        @click="handleSwitchPreview(option.id)"
      >
        <svg-icon :name="option.icon"></svg-icon>
        <span>{{ option.label }}</span>
      </div>
    </div>
  </tiny-popover>
</template>

<script>
import { getMetaApi, META_SERVICE, useCanvas, usePage } from '@opentiny/tiny-engine-meta-register'
import { constants } from '@opentiny/tiny-engine-utils'
import { Popover } from '@opentiny/vue'
import { useBroadcastChannel } from '@vueuse/core'
import { reactive, ref, watch } from 'vue'

const { BROADCAST_CHANNEL, CANVAS_ROUTER_VIEW_SETTING_VIEW_MODE_KEY } = constants

const COMPONENT_WHITELIST = ['RouterView']

export default {
  components: {
    TinyPopover: Popover
  },
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
    function getCacheValue() {
      const value = localStorage.getItem(CANVAS_ROUTER_VIEW_SETTING_VIEW_MODE_KEY)
      if (!['embedded', 'standalone'].includes(value)) {
        return 'embedded'
      }
      return value
    }

    const state = reactive({
      show: false,
      disabled: false,
      left: 0,
      top: 0,
      previewOptions: [],
      usedHoverState: null,
      viewMode: getCacheValue()
    })

    watch(
      () => [state.usedHoverState, state.viewMode],
      ([usedHoverState, viewMode]) => {
        state.show = usedHoverState && viewMode === 'embedded'
      },
      { immediate: true }
    )

    const popoverRef = ref()

    const handleClick = async () => {
      if (state.disabled) {
        return
      }

      const pageId = state.usedHoverState.element.getAttribute('data-te-page-id')
      const children = await usePage().getPageChildren(pageId)

      state.previewOptions = [{ id: pageId, label: '路由子页面占位符', icon: 'box' }].concat(
        children.map(({ id, name }) => ({
          id: String(id),
          label: name,
          icon: 'text-page-common'
        }))
      )

      // 在popover已经弹出的情况下，再去另一个位置点击触发弹出，会导致popover闪现（打开后立即关闭），是因为popover关闭时会播放动画，导致延迟关闭
      // 加上setTimeout，稍后重新打开popover
      setTimeout(() => {
        popoverRef.value?.doShow()
      }, 0)
    }

    const handleSwitchPreview = (previewId) => {
      popoverRef.value?.doClose()
      getMetaApi(META_SERVICE.GlobalService).updatePreviewId(previewId)
      useCanvas().canvasApi.value?.clearSelect?.()
    }

    watch(
      () => [props.hoverState, props.inactiveHoverState],
      ([hoverState, inactiveHoverState]) => {
        state.usedHoverState = [inactiveHoverState, hoverState].find(
          ({ componentName, element }) =>
            COMPONENT_WHITELIST.includes(componentName) &&
            element.ownerDocument.querySelector('div[data-page-active="true"]')?.contains(element) && // 确保不是已激活的页面上游
            element.getAttribute('data-page-active') !== 'true' // 确保不是已激活页面自己的页面框
        )

        if (!state.usedHoverState) {
          return
        }

        const { width, left, top } = state.usedHoverState
        state.left = `${left + width}px`
        state.top = `${top}px`
      },
      { deep: true }
    )

    const { data } = useBroadcastChannel({ name: BROADCAST_CHANNEL.CanvasRouterViewSetting })

    watch(data, (value) => {
      state.viewMode = value.viewMode
    })

    return {
      popoverRef,
      state,
      handleClick,
      handleSwitchPreview
    }
  }
}
</script>

<style lang="less" scoped>
.action-wrapper {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--te-common-bg-default);
  cursor: pointer;
  z-index: 3;
  transform: translateX(-80%) translateY(-20%);
  top: v-bind('state.top');
  left: v-bind('state.left');
  border: 1px solid var(--te-common-border-hover);
  &.disabled {
    opacity: 0.3;
  }
  &:not(.disabled):hover {
    border-color: var(--te-common-bg-primary-checked);
    background-color: var(--te-common-bg-primary-checked);
    .action {
      color: var(--te-common-text-dark-inverse);
    }
  }
  .action {
    width: 16px;
    height: 16px;
  }
}
.options {
  width: 200px;
  .option {
    font-size: 12px;
    min-height: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 12px;
    &:hover {
      background-color: var(--te-common-bg-container);
    }
    svg {
      flex-shrink: 0;
    }
  }
  .title {
    font-size: 14px;
    line-height: 20px;
    padding: 4px 12px;
    font-weight: bold;
    cursor: default;
    border-bottom: 1px solid var(--te-common-border-default);
  }
}
</style>

<style>
.tiny-popover.tiny-popper[x-placement].preview-switcher-popover {
  padding: 8px 0;
}
</style>
