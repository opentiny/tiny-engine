<template>
  <div class="toolbar-save">
    <toolbar-base
      content="预览页面"
      :icon="options.icon.default || options.icon"
      :options="options"
      @click-api="preview"
    >
    </toolbar-base>
  </div>
</template>

<script>
import { previewPage, previewBlock } from '@opentiny/tiny-engine-common/js/preview'
import { useBlock, useCanvas, useLayout, useNotify } from '@opentiny/tiny-engine-meta-register'
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'
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
    const { isBlock, getCurrentPage, canvasApi } = useCanvas()
    const { getCurrentBlock } = useBlock()

    const preview = () => {
      if (useLayout().isEmptyPage()) {
        useNotify({
          type: 'warning',
          message: '请先创建页面'
        })

        return
      }

      const params = {
        framework: getMergeMeta('engine.config')?.dslMode,
        platform: getMergeMeta('engine.config')?.platformId,
        pageInfo: {
          schema: canvasApi.value?.getSchema?.()
        }
      }

      if (isBlock()) {
        const block = getCurrentBlock()
        params.id = block?.id
        params.pageInfo.name = block?.label
        previewBlock(params)
      } else {
        const page = getCurrentPage()
        params.id = page?.id
        params.pageInfo.name = page?.name
        previewPage(params)
      }
    }

    return {
      preview
    }
  }
}
</script>
