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
      <component :is="ChangeLang" :langChannel="previewLangChannel" :options="langOptions"></component>
    </div>
  </div>
</template>

<script lang="jsx">
import { useBreadcrumb, getMergeRegistry, getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { Switch as TinySwitch } from '@opentiny/vue'
import { getSearchParams } from './preview/http'
import { BROADCAST_CHANNEL } from '../src/preview/srcFiles/constant'
import { injectDebugSwitch } from './preview/debugSwitch'

export default {
  components: {
    TinySwitch
  },
  setup() {
    const debugSwitch = injectDebugSwitch()
    const Breadcrumb = getMergeRegistry('toolbars', 'engine.toolbars.breadcrumb')?.entry
    const ChangeLang = getMergeRegistry('toolbars', 'engine.toolbars.lang')?.entry
    const langOptions = getMergeMeta('engine.toolbars.lang').options
    const ToolbarMedia = null // TODO: Media plugin rely on layout/canvas. Further processing is required.

    const { setBreadcrumbPage } = useBreadcrumb()
    const { pageInfo } = getSearchParams()
    setBreadcrumbPage([pageInfo?.name])

    const setViewPort = (item) => {
      const iframe = document.getElementsByClassName('iframe-container')[0]
      const app = document.getElementById('app')

      if (iframe) {
        iframe.style.width = item
        iframe.style.margin = 'auto'
      }
      app.style.overflow = 'hidden'
    }

    return {
      previewLangChannel: BROADCAST_CHANNEL.PreviewLang,
      Breadcrumb,
      ChangeLang,
      langOptions,
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
  background-color: var(--te-preview-common-bg-color);
  position: relative;
  z-index: 1001;
  border-bottom: 1px solid var(--te-preview-common-border-color);
}
.toolbar-left,
.toolbar-right {
  margin: 0 12px;
  display: flex;
  gap: 12px;
}
.toolbar-button-text {
  color: var(--te-preview-common-text-color);
  margin-left: 4px;
  font-size: 12px;
}
:deep(.top-panel-breadcrumb) {
  width: auto;
}
</style>
