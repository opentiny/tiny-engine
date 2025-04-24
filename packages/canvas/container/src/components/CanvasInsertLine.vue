<template>
  <div v-show="lineState.height && lineState.width" class="canvas-rect line">
    <div :class="['hover-line', lineState.position, { forbidden: lineState.forbidden }]">
      <div v-if="lineState.position === 'in' && hoverState.configure" class="choose-slots"></div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    lineState: {
      type: Object,
      default: () => ({})
    },
    hoverState: {
      type: Object,
      default: () => ({})
    }
  },
  setup() {}
}
</script>

<style lang="less" scoped>
.canvas-rect {
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
  border: 1px solid var(--te-canvas-container-border-color-checked);
  z-index: 2;
  &.line {
    border-color: transparent;
    top: v-bind("lineState.top + 'px'");
    left: v-bind("lineState.left + 'px'");
    height: v-bind("lineState.height + 'px'");
    width: v-bind("lineState.width + 'px'");
  }
  .hover-line {
    &.top {
      width: 100%;
      height: 5px;
      background: var(--te-canvas-container-text-color-checked);
      position: absolute;
      top: -3px;
    }
    &.left {
      width: 5px;
      height: 100%;
      background: var(--te-canvas-container-text-color-checked);
      position: absolute;
      left: -3px;
    }
    &.bottom {
      width: 100%;
      height: 5px;
      background: var(--te-canvas-container-text-color-checked);
      position: absolute;
      bottom: -3px;
    }
    &.right {
      width: 5px;
      height: 100%;
      background: var(--te-canvas-container-text-color-checked);
      position: absolute;
      right: -3px;
    }
    &.in {
      width: 100%;
      height: 100%;
      background: var(--te-canvas-container-hover-line-in-bg-color);
    }
    &.forbidden:not(.in) {
      background: var(--te-canvas-container-hover-line-forbid-bg-color);
    }
    &.forbidden.in {
      background: var(--te-canvas-container-hover-line-in-forbid-bg-color);
    }
  }
  .choose-slots {
    display: flex;
    justify-content: left;
    align-items: left;
    height: 100%;
    & > div {
      pointer-events: all;
      width: 40px;
      border: 1px solid var(--te-canvas-container-border-color-checked);
      color: var(--te-canvas-container-choose-slot-text-color);
      overflow: hidden;
      font-size: 10px;
      margin: 2px;
      text-align: center;
      &:hover {
        background: #40a9ff;
        color: #fff;
      }
    }
  }
}
</style>
