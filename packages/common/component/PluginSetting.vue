<template>
  <div
    id="panel-setting"
    :class="[
      'plugin-setting',
      { 'second-panel': isSecond },
      { 'full-screen': state.isFullScreen },
      { 'align-right': align.includes('right') },
      shadowClass
    ]"
    :style="isSecond ? secondAlignStyle : alignStyle"
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
    <div class="plugin-setting-content lowcode-scrollbar">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { nextTick, reactive, watchEffect, computed } from 'vue'
import { Button } from '@opentiny/vue'
import { iconPlus } from '@opentiny/vue-icon'
import ButtonGroup from './ButtonGroup.vue'
import SvgButton from './SvgButton.vue'
import { useLayout } from '@opentiny/tiny-engine-meta-register'

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
    },
    fixedName: {
      type: String,
      default: ''
    },
    align: {
      type: String,
      default: 'leftTop'
    }
  },
  emits: [EVENTS.FULL_SCREEN_CHANGE, EVENTS.SAVE, EVENTS.CANCEL, EVENTS.ADD, EVENTS.CLICK],
  setup(props, { emit }) {
    const state = reactive({
      isFullScreen: false
    })

    const { getPluginWidth } = useLayout()

    const firstPanelOffset = computed(() => {
      return getPluginWidth(props.fixedName) - 1
    })

    const secondPanelAlign = computed(() => {
      return props.align.includes('left') ? 'left' : 'right'
    })

    const alignStyle = computed(() => {
      return `${secondPanelAlign.value} : ${firstPanelOffset.value}px`
    })

    const secondAlignStyle = computed(() => {
      // 解决三级面板点击与二级面板重叠
      const secondPanelOffset = document.querySelector('.plugin-setting')?.clientWidth + firstPanelOffset.value
      return `${secondPanelAlign.value} : ${secondPanelOffset.value}px`
    })

    watchEffect(() => {
      // 处理二级面板偏移量
      const secondPanelOffset = document.querySelector('.plugin-setting')?.clientWidth + firstPanelOffset.value
      nextTick(() => {
        document.querySelector('.second-panel')?.style.setProperty(secondPanelAlign.value, `${secondPanelOffset}px`)
      })
    })

    watchEffect(() => {
      state.isFullScreen = props.isFullScreen
    })

    const fullScreen = () => {
      state.isFullScreen = !state.isFullScreen
      emit(EVENTS.FULL_SCREEN_CHANGE, state.isFullScreen)
    }

    const getFullScreenLabel = (isFullScreen: boolean) => {
      return isFullScreen ? '收起' : '全屏查看'
    }

    // 计算属性用于确定阴影类
    const shadowClass = computed(() => {
      if (props.isSecond) return ''
      return props.align.includes('right') ? 'shadow-right' : 'shadow-left'
    })

    return {
      alignStyle,
      secondAlignStyle,
      shadowClass,
      firstPanelOffset,
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
  top: 0;
  width: var(--base-collection-panel-width);
  height: 100%;
  border-right: 1px solid var(--te-component-common-border-color);
  background: var(--te-component-common-bg-color);
  overflow: hidden;
  border-left: 1px solid var(--te-component-common-border-color-divider);

  &:not(.second-panel) {
    &.shadow-left {
      box-shadow: 6px 0px 3px 0px var(--te-component-common-shadow-color);
      border-right: none;
    }

    &.shadow-right {
      box-shadow: -6px 0px 3px 0px var(--te-component-common-shadow-color);
      border-left: none;
    }
  }

  &.full-screen {
    width: var(--base-collection-panel-full-screen-width);
  }

  &.second-panel {
    z-index: 1;
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
    height: 48px;
    line-height: 40px;
    font-size: 14px;
    line-height: 18px;
    color: var(--te-component-common-text-color-primary);
    padding: 0 12px;
    border-bottom: 1px solid var(--te-component-common-border-color-divider);

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

.align-right {
  right: 0;
}
</style>
