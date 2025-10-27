<template>
  <div class="toolbar-save toolbar-helpGuid">
    <toolbar-base content="预览页面" :icon="options.icon?.default || options?.icon" :options="options" trigger="hover">
      <template #button>
        <div class="toolbar-preview-item">
          <span @click="preview('page')">页面预览</span>
          <span @click="preview('app')">应用预览</span>
        </div>
      </template>
    </toolbar-base>
  </div>
</template>

<script lang="ts">
/* metaService: engine.toolbars.preview.Main */
import { previewPage } from '@opentiny/tiny-engine-common/js/preview'
import { useLayout, useNotify, getOptions } from '@opentiny/tiny-engine-meta-register'
import meta from '../meta'
import { ToolbarBase } from '@opentiny/tiny-engine-common'

export default {
  components: {
    ToolbarBase
  },
  props: {
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup() {
    const preview = async (previewType: string) => {
      const { beforePreview, previewMethod, afterPreview } = getOptions(meta.id)

      try {
        if (typeof beforePreview === 'function') {
          await beforePreview()
        }

        if (typeof previewMethod === 'function') {
          const stop = await previewMethod()

          if (stop) {
            return
          }
        }
      } catch (error) {
        useNotify({
          type: 'error',
          message: `Error in previewing: ${error}`
        })
      }

      if (useLayout().isEmptyPage()) {
        useNotify({
          type: 'warning',
          message: '请先创建页面'
        })
        return
      }

      previewPage({ previewType })

      if (typeof afterPreview === 'function') {
        try {
          await afterPreview()
        } catch (error) {
          useNotify({
            type: 'error',
            message: `Error in afterPreview: ${error}`
          })
        }
      }
    }

    return {
      preview
    }
  }
}
</script>
<style lang="less" scoped>
.toolbar-preview-item {
  display: flex;
  justify-content: center;
  flex-direction: column;
  gap: 8px;

  span {
    cursor: pointer;
  }
}
</style>
