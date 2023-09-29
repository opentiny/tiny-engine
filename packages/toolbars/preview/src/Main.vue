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
import { previewPage, previewBlock } from '@opentiny/tiny-engine-common/js/preview'
import { getGlobalConfig, useBlock, useCanvas } from '@opentiny/tiny-engine-controller'
import { getSchema } from '@opentiny/tiny-engine-canvas'
import { PublicIcon } from '@opentiny/tiny-engine-common'

export default {
  components: {
    TinyPopover: Popover,
    PublicIcon
  },
  props: {
    icon: {
      type: String,
      default: 'preview'
    }
  },
  setup() {
    const { isBlock, getCurrentPage } = useCanvas()
    const { getCurrentBlock } = useBlock()

    const preview = () => {
      const params = {
        framework: getGlobalConfig()?.dslMode,
        platform: getGlobalConfig()?.platformId,
        pageInfo: {
          schema: getSchema()
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
