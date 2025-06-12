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
import { watch } from 'vue'
import { useBreadcrumb, getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { Switch as TinySwitch } from '@opentiny/vue'
import { constants } from '@opentiny/tiny-engine-utils'
import { BROADCAST_CHANNEL } from '../src/preview/srcFiles/constant'
import { injectDebugSwitch } from './preview/debugSwitch'
import { previewState } from './preview/usePreviewData'

export default {
  components: {
    TinySwitch
  },
  setup() {
    const debugSwitch = injectDebugSwitch()
    const Breadcrumb = getMergeMeta('engine.toolbars.breadcrumb')?.entry
    const ChangeLang = getMergeMeta('engine.toolbars.lang')?.entry
    const langOptions = getMergeMeta('engine.toolbars.lang').options
    const ToolbarMedia = null // TODO: Media plugin rely on layout/canvas. Further processing is required.
    const { setBreadcrumbPage, setBreadcrumbBlock } = useBreadcrumb()

    watch(
      () => previewState.currentPage,
      (newVal) => {
        if (newVal?.page_content?.componentName === constants.COMPONENT_NAME.Block) {
          setBreadcrumbBlock([newVal?.name_cn || newVal?.page_content?.fileName])
        } else {
          setBreadcrumbPage([newVal?.name])
        }
      }
    )

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
