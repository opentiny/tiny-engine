<template>
  <!-- TODO 基于 CanvasRouterJumper 组件改造，后续需要抽取公共组件 -->
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
        :title="state.disabled ? disabledTitle || title : title"
        @click="handleClick"
      >
        <div class="action">
          <slot>
            <!-- TODO 更换图标 -->
            <svg-icon name="jump"></svg-icon>
          </slot>
        </div>
      </div>
    </template>
    <div class="options">
      <div
        class="option"
        v-for="option in state.previewOptions"
        :key="option.id"
        @click="handleSwitchPreview(option.id)"
      >
        {{ option.label }}
      </div>
    </div>
  </tiny-popover>
</template>

<script>
import { getMetaApi, META_SERVICE, useCanvas, usePage } from '@opentiny/tiny-engine-meta-register'
import { Popover } from '@opentiny/vue'
import { reactive, ref, watch } from 'vue'

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
    },
    componentWhitelist: {
      type: Array,
      default: () => []
    },
    title: {
      type: String,
      default: ''
    },
    disabledTitle: {
      type: String,
      default: ''
    },
    disableFn: {
      type: Function,
      default: () => false
    }
  },
  setup(props) {
    const state = reactive({
      show: false,
      disabled: false,
      left: 0,
      top: 0,
      previewOptions: []
    })
    const popoverRef = ref()

    const handleClick = async () => {
      if (state.disabled) {
        return
      }

      const pageId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().pageId
      const children = await usePage().getPageChildren(pageId)

      state.previewOptions = [{ id: '', label: '重置预览页面' }].concat(
        children.map(({ id, route, routePath }) => ({ id, label: routePath || route }))
      )
    }

    const handleSwitchPreview = (previewId) => {
      popoverRef.value?.doClose()
      getMetaApi(META_SERVICE.GlobalService).updatePreviewId(previewId)
      useCanvas().canvasApi.value?.clearSelect?.()
    }

    watch(
      () => [props.hoverState, props.inactiveHoverState],
      ([hoverState, inactiveHoverState]) => {
        const usedHoverState = [hoverState, inactiveHoverState].find(({ componentName }) =>
          props.componentWhitelist.includes(componentName)
        )

        if (!usedHoverState) {
          state.show = false
          return
        }

        const { width, left, top } = usedHoverState
        state.show = true
        state.left = `${left + width}px`
        state.top = `${top}px`
        state.disabled = props.disableFn(usedHoverState)
      },
      { deep: true }
    )

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
  font-size: 12px;
  cursor: pointer;
  .option {
    display: flex;
    align-items: center;
    height: 24px;
    padding: 0 12px;
    &:hover {
      background-color: var(--te-common-bg-container);
    }
  }
}
</style>

<style>
.tiny-popover.tiny-popper[x-placement].preview-switcher-popover {
  padding: 8px 0;
}
</style>
