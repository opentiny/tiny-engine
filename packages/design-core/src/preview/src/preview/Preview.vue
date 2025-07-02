<template>
  <div>
    <div class="phone-preview-wrapper" v-if="!debugSwitch && useMobilePreview">
      <div class="controls">
        <div class="device-selector">
          <span>设备型号:</span>
          <select v-model="selectedDevice">
            <option v-for="device in devices" :key="device.id" :value="device.id">{{ device.name }}</option>
          </select>
        </div>
        <div class="orientation-control">
          <button @click="toggleOrientation" class="control-btn">
            {{ isLandscape ? '切换到竖屏' : '切换到横屏' }}
          </button>
        </div>
        <div class="zoom-control">
          <button @click="adjustZoom(-0.1)" class="control-btn">-</button>
          <span>{{ Math.round(zoomLevel * 100) }}%</span>
          <button @click="adjustZoom(0.1)" class="control-btn">+</button>
        </div>
      </div>
      <PhoneDevice
        :deviceType="selectedDevice"
        :isLandscape="isLandscape"
        :zoomLevel="zoomLevel"
        :statusBarColor="themeColor"
      >
        <Repl
          :editor="editorComponent"
          :store="store"
          :sfcOptions="sfcOptions"
          :showCompileOutput="false"
          :showTsConfig="false"
          :showImportMap="true"
          :clearConsole="false"
          :autoResize="false"
        />
      </PhoneDevice>
    </div>
    <div v-else :class="['vue-repl-container', debugSwitch ? 'preview-debug-mode' : '']">
      <Repl
        :editor="editorComponent"
        :store="store"
        :sfcOptions="sfcOptions"
        :showCompileOutput="false"
        :showTsConfig="false"
        :showImportMap="true"
        :clearConsole="false"
        :autoResize="false"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, defineAsyncComponent, onMounted, onBeforeUnmount, ref } from 'vue'
import { Repl, ReplStore } from '@vue/repl'
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { injectDebugSwitch } from './debugSwitch'
import { usePreviewCommunication } from './usePreviewCommunication'
import { usePreviewData } from './usePreviewData'
import '@vue/repl/style.css'
import PhoneDevice from './PhoneDevice.vue'

const Monaco = defineAsyncComponent(() => import('@vue/repl/monaco-editor')) // 异步组件实现懒加载，打开debug后再加载

const EmptyEditor = defineComponent({
  setup() {
    return () => null
  }
})

export default {
  components: {
    Repl,
    PhoneDevice
  },
  setup() {
    const debugSwitch = injectDebugSwitch()
    const editorComponent = computed(() => (debugSwitch?.value ? Monaco : EmptyEditor))
    const store = new ReplStore()
    const sfcOptions = {
      script: {
        // scirpt setup 编译后注入 import { * } from "vue"
        inlineTemplate: false
      }
    }
    // 设备配置
    const devices = [
      {
        id: 'huawei-mate70-pro',
        name: '华为Mate70 Pro',
        width: '390px',
        height: '844px',
        hasNotch: false,
        hasHomeButton: false,
        hasPunchHole: true,
        borderRadius: '50px',
        curvedScreen: true,
        specialFeatures: ['quad-camera']
      },
      {
        id: 'iphone',
        name: 'iPhone 13',
        width: '375px',
        height: '812px',
        hasNotch: true,
        hasHomeButton: false,
        borderRadius: '44px'
      },
      {
        id: 'android',
        name: 'Android',
        width: '360px',
        height: '740px',
        hasNotch: false,
        hasHomeButton: false,
        borderRadius: '30px'
      },
      {
        id: 'iphone-se',
        name: 'iPhone SE',
        width: '320px',
        height: '568px',
        hasNotch: false,
        hasHomeButton: true,
        borderRadius: '40px'
      },
      {
        id: 'ipad',
        name: 'iPad',
        width: '768px',
        height: '1024px',
        hasNotch: false,
        hasHomeButton: true,
        borderRadius: '20px'
      }
    ]

    const useMobilePreview = getMergeMeta('engine.config').useMobilePreview
    const themeColor = ref(null)

    // 状态管理
    const selectedDevice = ref('huawei-mate70-pro')
    const isLandscape = ref(false)
    const zoomLevel = ref(0.8)

    // 计算当前选中的设备
    const currentDevice = computed(() => {
      return devices.find((device) => device.id === selectedDevice.value)
    })

    // 方法
    function toggleOrientation() {
      isLandscape.value = !isLandscape.value
    }

    function adjustZoom(delta) {
      const newZoom = zoomLevel.value + delta
      if (newZoom >= 0.3 && newZoom <= 2) {
        zoomLevel.value = newZoom
      }
    }

    // 相比store.setFiles，只要少了state.activeFile = state.files[filename]，因为改变activeFile会触发多余的文件解析
    const setFiles = async (newFiles, mainFileName) => {
      await store.setFiles(newFiles, mainFileName)
      // 强制更新 codeSandbox
      store.state.resetFlip = !store.state.resetFlip
      store['initTsConfig']() // 触发获取组件d.ts方便调试
    }

    const queryParams = new URLSearchParams(location.search)
    document.documentElement?.setAttribute?.('data-theme', queryParams.get('theme') || 'light')

    const { loadInitialData, updateUrl, updatePreview } = usePreviewData({ setFiles, store })

    let cleanupCommunicationAction = null
    const onSchemaReceivedAction = async (data) => {
      themeColor.value = data.currentPage?.page_content.props.themeColor

      updateUrl(data.currentPage)
      const isHistory = new URLSearchParams(location.search).get('history')
      const previewHotReload = getMergeMeta('engine.config').previewHotReload
      // 如果是历史预览，则不需要实时预览，接收到消息之后直接取消监听(需要监听到第一次消息接受页面信息)
      // 如果预览热更新关闭，则不需要实时预览
      if (isHistory || previewHotReload === false) {
        cleanupCommunicationAction()
      }
      await updatePreview(data)
    }

    const { initCommunication, cleanupCommunication } = usePreviewCommunication({
      onSchemaReceived: onSchemaReceivedAction,
      loadInitialData
    })

    cleanupCommunicationAction = cleanupCommunication

    onMounted(initCommunication)
    onBeforeUnmount(cleanupCommunication)

    return {
      themeColor,
      devices,
      selectedDevice,
      isLandscape,
      zoomLevel,
      currentDevice,
      toggleOrientation,
      adjustZoom,
      useMobilePreview,
      store,
      sfcOptions,
      editorComponent,
      debugSwitch
    }
  }
}
</script>

<style lang="less">
.phone-preview-wrapper {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.controls {
  margin-bottom: 20px;
  display: flex;
  gap: 20px;
  align-items: center;
}

.device-selector,
.orientation-control,
.zoom-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

select,
.control-btn {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 14px;
}

.control-btn:hover {
  background: #e8e8e8;
}

.device-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
.vue-repl {
  height: 100%;

  .split-pane {
    .left {
      display: none;
    }

    .right {
      width: 100% !important;

      .output-container {
        height: 100%;

        .msg.warn {
          display: none;
        }
      }

      .tab-buttons {
        display: none;
      }
    }
  }
}
.vue-repl-container {
  height: calc(100vh - 48px);
  &.preview-debug-mode .vue-repl .split-pane {
    .left,
    .right .tab-buttons {
      display: block;
    }
    .right .output-container {
      height: calc(100% - 38px);
    }
  }
}
</style>
