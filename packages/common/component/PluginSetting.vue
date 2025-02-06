<template>
  <div
    :class="['plugin-setting', { 'second-panel': isSecond }, { 'full-screen': state.isFullScreen }]"
    @click="$emit('click')"
  >
    <div class="plugin-setting-header">
      <slot name="title">
        <span class="plugin-setting-header-title">{{ title }}</span>
      </slot>
      <div class="button-group-wrap">
        <slot name="header">
          <button-group>
            <tiny-button v-if="!isIconButton" type="info" @click="$emit('save')" class="plugin-save">保存</tiny-button>
            <tiny-button v-if="isIconButton" :icon="icon" type="info" @click="$emit('add')">
              {{ iconButtonText }}
            </tiny-button>
            <div v-if="showIfFullScreen" class="cursor" @click="fullScreen">
              <svg-button v-if="!state.isFullScreen" name="full-screen"></svg-button>
              <svg-button v-if="state.isFullScreen" name="cancel-full-screen"></svg-button>
            </div>
            <svg-button name="close" @click="$emit('cancel')"></svg-button>
          </button-group>
        </slot>
      </div>
    </div>
    <slot name="progress"></slot>
    <div class="plugin-setting-content">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script>
import { reactive, watchEffect } from 'vue'
import { Button } from '@opentiny/vue'
import { iconPlus } from '@opentiny/vue-icon'
import ButtonGroup from './ButtonGroup.vue'
import SvgButton from './SvgButton.vue'

const EVENTS = {
  FULL_SCREEN_CHANGE: 'fullScreenChange',
  SAVE: 'save',
  CANCEL: 'cancel',
  ADD: 'add',
  CLICK: 'click'
}

export default {
  components: {
    TinyButton: Button,
    SvgButton,
    ButtonGroup
  },
  props: {
    /**
     * plugin-setting面板标题
     */
    title: {
      type: String,
      default: ''
    },
    /**
     * 是否为二级展开面板
     */
    isSecond: {
      type: Boolean,
      default: false
    },
    /**
     * 是否为全屏显示
     */
    isFullScreen: {
      type: Boolean,
      default: false
    },
    showIfFullScreen: {
      type: Boolean,
      default: false
    },
    /**
     * 是否为图标按钮
     */
    isIconButton: {
      type: Boolean,
      default: false
    },
    iconButtonText: {
      type: String,
      default: '新增数据'
    },
    icon: {
      type: Object,
      default: iconPlus()
    }
  },
  emits: [EVENTS.FULL_SCREEN_CHANGE, EVENTS.SAVE, EVENTS.CANCEL, EVENTS.ADD, EVENTS.CLICK],
  setup(props, { emit }) {
    const state = reactive({
      isFullScreen: false
    })

    watchEffect(() => {
      state.isFullScreen = props.isFullScreen
    })

    const fullScreen = () => {
      state.isFullScreen = !state.isFullScreen
      emit(EVENTS.FULL_SCREEN_CHANGE, state.isFullScreen)
    }

    const getFullScreenLabel = (isFullScreen) => {
      return isFullScreen ? '收起' : '全屏查看'
    }

    return {
      state,
      fullScreen,
      getFullScreenLabel
    }
  }
}
</script>

<style lang="less" scoped>
.plugin-setting {
  position: absolute;
  left: var(--base-left-panel-width);
  top: 0;
  width: var(--base-collection-panel-width);
  height: 100%;
  border-right: 1px solid var(--te-common-border-default);
  background: var(--te-common-bg-default);
  overflow: hidden;
  border-left: 1px solid var(--ti-lowcode-plugin-panel-header-border-bottom-color);
  &:not(.second-panel) {
    box-shadow: 6px 0px 3px 0px var(--te-base-box-shadow-rgba-3);
    border-right: none;
    border-left: none;
  }
  &.full-screen {
    width: var(--base-collection-panel-full-screen-width);
  }

  &.second-panel {
    left: calc(var(--base-left-panel-width) + var(--base-collection-panel-width));
    z-index: 1;
  }

  .full-screen-label {
    margin: 0 8px 0 4px;
    color: var(--ti-common-color-text-weaken);
    font-size: 12px;
    line-height: 12px;
  }

  .cursor {
    margin-left: 8px;
    cursor: pointer;
  }

  .close {
    margin-left: 12px;
    cursor: pointer;
  }

  .plugin-setting-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    line-height: 40px;
    font-size: 14px;
    line-height: 18px;
    color: var(--ti-lowcode-plugin-panel-title-color);
    padding: 0 12px;
    border-bottom: 1px solid var(--ti-lowcode-plugin-panel-header-border-bottom-color);
    .plugin-setting-header-title {
      font-size: 12px;
      font-weight: 700;
      margin-right: 20px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    :deep(.svg-button + .svg-button) {
      margin: 0;
    }
    :deep(.tiny-button.tiny-button) {
      margin-right: 0;
    }
  }

  .plugin-setting-content {
    height: calc(100% - 46px);
    overflow-y: auto;
    overflow-x: hidden;
    padding: 12px;
  }

  .button-group-wrap {
    display: flex;
    align-items: center;
  }
}
</style>
