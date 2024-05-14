<template>
  <tiny-popover
    trigger="hover"
    :open-delay="1000"
    popper-class="toolbar-right-popover"
    append-to-body
    content="预览页面"
  >
    <template #reference>
      <span class="icon" @click="preview">
        <svg-icon :name="icon"></svg-icon>
      </span>
    </template>
  </tiny-popover>
</template>

<script>
import { Popover } from '@opentiny/vue'
import { previewPage, previewBlock } from '@opentiny/tiny-engine-controller/js/preview'
import { getGlobalConfig, useBlock, useCanvas, useLayout, useNotify } from '@opentiny/tiny-engine-controller'

export default {
  components: {
    TinyPopover: Popover
  },
  props: {
    icon: {
      type: String,
      default: 'preview'
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
        framework: getGlobalConfig()?.dslMode,
        platform: getGlobalConfig()?.platformId,
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
