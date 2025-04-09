<template>
  <div
    v-show="hoverState.rect.height && hoverState.rect.width && !hoverState.isInactiveNode"
    class="canvas-rect common-hover hover"
  >
    <div class="corner-mark-left" @click="handleSelectHoverNode">
      {{ hoverState.componentName }}
    </div>
    <div v-show="hoverState.configure?.isContainer" class="corner-mark-bottom-right">拖放元素到容器内</div>
  </div>
  <div
    v-show="hoverState.rect.height && hoverState.rect.width && hoverState.isInactiveNode"
    class="canvas-rect common-hover inactive-hover"
  >
    <div class="corner-mark-left">
      {{ hoverState.componentName }}
    </div>
  </div>
</template>

<script>
import { useSelectNode } from '../interactions'

export default {
  props: {
    hoverState: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const handleSelectHoverNode = () => {
      const node = props.hoverState.node
      const element = props.hoverState.element

      if (!node) {
        return
      }

      const { selectNodeById, updateSelectedNode } = useSelectNode()

      if (element) {
        updateSelectedNode({ target: element })
      } else {
        selectNodeById(node.id)
      }
    }

    return {
      handleSelectHoverNode
    }
  }
}
</script>

<style lang="less" scoped>
.canvas-rect {
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
  border: 1px solid var(--te-canvas-container-border-color-checked);
  z-index: 2;
  &.common-hover {
    border-style: dashed;
    top: v-bind("hoverState.rect.top + 'px'");
    left: v-bind("hoverState.rect.left + 'px'");
    height: v-bind("hoverState.rect.height + 'px'");
    width: v-bind("hoverState.rect.width + 'px'");
    .corner-mark-left {
      height: 14px;
      top: -14px;
      padding-left: 0;
      font-size: 12px;
    }
  }
  &.hover {
    .corner-mark-left {
      // 为了支持点击选中
      pointer-events: auto;
    }
  }
  &.inactive-hover {
    border-color: var(--te-canvas-container-border-color-hover);

    .corner-mark-left {
      color: var(--te-canvas-container-text-color-weaken);
    }
  }

  .corner-mark-left {
    display: flex;
    align-items: center;
    font-size: 14px;
    position: absolute;
    top: -24px;
    height: 24px;
    color: var(--te-canvas-container-corner-mark-left-text-color);
    padding: 0 8px;
  }
}
</style>
