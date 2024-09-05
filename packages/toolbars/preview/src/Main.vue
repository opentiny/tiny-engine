<template>
  <div class="toolbar-save">
    <toolbar-base-component
      :type="type"
      content="预览页面"
      :icon="icon.default"
      :options="options"
      @click-api="preview"
    >
    </toolbar-base-component>
  </div>
</template>

<script>
import { Popover } from '@opentiny/vue'
import { previewPage, previewBlock } from '@opentiny/tiny-engine-common/js/preview'
import { useBlock, useCanvas, useLayout, useNotify } from '@opentiny/tiny-engine-meta-register'
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { ToolbarBaseComponent } from '@opentiny/tiny-engine-layout'

export default {
  components: {
    TinyPopover: Popover,
    ToolbarBaseComponent
  },
  props: {
    type: {
      type: String,
      default: ''
    },
    icon: {
      type: Object
    },
    options: {
      type: Object,
      default: () => {}
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
