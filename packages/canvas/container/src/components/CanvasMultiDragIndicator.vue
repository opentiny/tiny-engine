<template>
  <div>
    <!-- 多选拖拽状态指示器 -->
    <div v-if="isMultiDragging" class="multi-drag-indicator">
      <span>正在拖拽 {{ multiStateLength }} 个组件</span>
      <span v-if="getMultiDragPositionText" class="multi-drag-position">{{ getMultiDragPositionText }}</span>
    </div>
    <!-- 多选拖拽可放置位置指示器 -->
    <div v-if="isMultiDragging && lineState.height && lineState.width" class="multi-drop-indicator">
      <div :class="['multi-drop-line', lineState.position, { forbidden: lineState.forbidden }]">
        <div v-if="lineState.position === 'in'" class="multi-drop-container-hint">
          <span>放置 {{ multiStateLength }} 个组件到容器内</span>
        </div>
      </div>
    </div>
    <!-- 拖拽时的节点预览 -->
    <div v-if="isMultiDragging && multiDragState.mouse" class="multi-drag-preview-container">
      <div
        v-for="(node, index) in multiDragState.nodes"
        :key="node.id"
        class="multi-drag-preview-item"
        :style="{
          top: `${multiDragState.mouse.y + 15 + index * 35}px`,
          left: `${multiDragState.mouse.x + 15}px`,
          zIndex: `${1001 + multiDragState.nodes.length - index}`
        }"
      >
        <div class="preview-item-number">{{ index + 1 }}</div>
        <div class="preview-component-info">
          <div class="preview-component-name">{{ node.componentName }}</div>
          <div class="preview-component-id" v-if="node.props && node.props.id">ID: {{ node.props.id }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  lineState: {
    type: Object,
    default: () => ({})
  },
  multiDragState: {
    type: Object,
    default: () => ({})
  },
  multiStateLength: {
    type: Number,
    default: 0
  },
  isMultiDragging: {
    type: Boolean,
    default: false
  },
  getMultiDragPositionText: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.multi-drag-indicator {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--te-canvas-container-bg-color-checked, rgba(24, 144, 255, 0.9));
  color: var(--te-canvas-container-text-color-white, white);
  padding: 8px 16px;
  border-radius: 4px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  pointer-events: none;
  border: 1px solid var(--te-canvas-container-border-color-checked, #1890ff);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 200px;
  text-align: center;
  transition: background-color 0.3s ease;

  .multi-drag-position {
    font-size: 12px;
    background-color: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 2px;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
.multi-drop-indicator {
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
  border-color: transparent;
  z-index: 5;
  top: v-bind("lineState.top + 'px'");
  left: v-bind("lineState.left + 'px'");
  height: v-bind("lineState.height + 'px'");
  width: v-bind("lineState.width + 'px'");

  .multi-drop-line {
    &.top {
      width: 100%;
      height: 5px;
      background: var(--te-canvas-container-text-color-checked);
      position: absolute;
      top: -3px;
      animation: pulse-drop-line 1.5s infinite;
    }
    &.left {
      width: 5px;
      height: 100%;
      background: var(--te-canvas-container-text-color-checked);
      position: absolute;
      left: -3px;
      animation: pulse-drop-line 1.5s infinite;
    }
    &.bottom {
      width: 100%;
      height: 5px;
      background: var(--te-canvas-container-text-color-checked);
      position: absolute;
      bottom: -3px;
      animation: pulse-drop-line 1.5s infinite;
    }
    &.right {
      width: 5px;
      height: 100%;
      background: var(--te-canvas-container-text-color-checked);
      position: absolute;
      right: -3px;
      animation: pulse-drop-line 1.5s infinite;
    }
    &.in {
      width: 100%;
      height: 100%;
      background: var(--te-canvas-container-hover-line-in-bg-color);
      border: 2px dashed var(--te-canvas-container-border-color-checked, #1890ff);
      display: flex;
      justify-content: center;
      align-items: center;
      animation: pulse-drop-border 1.5s infinite;
    }
    &.forbidden:not(.in) {
      background: var(--te-canvas-container-hover-line-forbid-bg-color, #ff4d4f);
    }
    &.forbidden.in {
      background: var(--te-canvas-container-hover-line-in-forbid-bg-color, rgba(255, 77, 79, 0.2));
      border: 2px dashed var(--te-canvas-container-hover-line-forbid-bg-color, #ff4d4f);
    }

    .multi-drop-container-hint {
      background-color: var(--te-canvas-container-bg-color-checked, rgba(24, 144, 255, 0.9));
      color: var(--te-canvas-container-text-color-white, white);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      max-width: 90%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
.multi-drag-preview-container {
  position: fixed;
  z-index: 1001;
  pointer-events: none;
}
.multi-drag-preview-item {
  position: absolute;
  background-color: var(--te-canvas-container-bg-color-checked, rgba(24, 144, 255, 0.9));
  border: 2px solid var(--te-canvas-container-border-color-checked, #1890ff);
  border-radius: 4px;
  padding: 6px 10px;
  color: var(--te-canvas-container-text-color-white, white);
  font-size: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: transform 0.1s ease;
  transform-origin: left top;
  transform: scale(1);
  display: flex;
  align-items: center;
  gap: 8px;
  animation: preview-pulse 1.5s infinite;

  &:hover {
    transform: scale(1.05);
  }

  .preview-item-number {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 20px;
    height: 20px;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    font-weight: bold;
    font-size: 11px;
  }

  .preview-component-info {
    display: flex;
    flex-direction: column;
  }

  .preview-component-name {
    font-weight: bold;
  }

  .preview-component-id {
    font-size: 0.8em;
    color: rgba(255, 255, 255, 0.8);
  }
}

@keyframes preview-pulse {
  0% {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  50% {
    box-shadow: 0 4px 20px rgba(24, 144, 255, 0.5);
  }
  100% {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}

@keyframes pulse-drop-line {
  0% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.7;
  }
}

@keyframes pulse-drop-border {
  0% {
    border-color: rgba(24, 144, 255, 0.7);
  }
  50% {
    border-color: rgba(24, 144, 255, 1);
  }
  100% {
    border-color: rgba(24, 144, 255, 0.7);
  }
}
</style>
