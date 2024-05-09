<template>
  <div class="tiny-engine-toolbar">
    <div class="toolbar-left">
      <component :is="Breadcrumb"></component>
    </div>
    <div class="toolbar-center">
      <component :is="ToolbarMedia" :isCanvas="false" @setViewPort="setViewPort"></component>
    </div>
    <div class="toolbar-right">
      <span><tiny-switch v-model="debugSwitch"></tiny-switch><span class="toolbar-button-text">调试模式</span></span>
      <component :is="ChangeLang" :langChannel="previewLangChannel"></component>
    </div>
  </div>
</template>

<script lang="jsx">
import { defineAsyncComponent } from 'vue'
import { useBreadcrumb } from '@opentiny/tiny-engine-controller'
import { Switch as TinySwitch } from '@opentiny/vue'
import { getSearchParams } from './preview/http'
import { BROADCAST_CHANNEL } from '../src/preview/srcFiles/constant'
import addons from '@opentiny/tiny-engine-app-addons'
import { injectDebugSwitch } from './preview/debugSwitch'

const getToolbars = (pluginId) => {
  return defineAsyncComponent(() =>
    Promise.resolve(addons?.toolbars?.find((t) => t.id === pluginId)?.component || <span></span>)
  )
}

export default {
  components: {
    TinySwitch
  },
  setup() {
    const debugSwitch = injectDebugSwitch()
    const tools = ['breadcrumb', 'lang', 'media']
    const [Breadcrumb, ChangeLang, ToolbarMedia] = tools.map(getToolbars)

    const { setBreadcrumbPage } = useBreadcrumb()
    const { pageInfo } = getSearchParams()
    setBreadcrumbPage([pageInfo?.name])

    const setViewPort = (item) => {
      const iframe = document.getElementsByClassName('iframe-container')[0]
      const app = document.getElementById('app')
      iframe.style.width = item
      iframe.style.margin = 'auto'
      app.style.overflow = 'hidden'
    }

    return {
      previewLangChannel: BROADCAST_CHANNEL.PreviewLang,
      Breadcrumb,
      ChangeLang,
      ToolbarMedia,
      setViewPort,
      debugSwitch
    }
  }
}
</script>

<style lang="less" scoped>
.tiny-engine-toolbar {
  user-select: none;
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: var(--base-top-panel-height);
  text-align: center;
  background-color: var(--ti-lowcode-common-layout-bg);
  position: relative;
  z-index: 1001;
  border-bottom: 1px solid var(--ti-lowcode-toolbar-border-bottom-color);
}
.toolbar-left,
.toolbar-right {
  margin: 0 12px;
  display: flex;
  gap: 12px;
}
.toolbar-button-text {
  color: var(--ti-lowcode-toolbar-title-color);
  margin-left: 4px;
  font-size: 12px;
}
:deep(.top-panel-breadcrumb) {
  width: auto;
}
</style>
