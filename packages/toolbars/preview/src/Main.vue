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
import {
  useBlock,
  useCanvas,
  useLayout,
  useNotify,
  usePage,
  getMergeMeta,
  getOptions,
  META_SERVICE,
  getMetaApi
} from '@opentiny/tiny-engine-meta-register'
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
    const { isBlock, getCurrentPage, getSchema } = useCanvas()
    const { getCurrentBlock } = useBlock()
    const { getFamily } = usePage()

    const preview = async () => {
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

      const params = {
        framework: getMergeMeta('engine.config')?.dslMode,
        platform: getMergeMeta('engine.config')?.platformId,
        pageInfo: {
          schema: getSchema?.()
        }
      }

      if (isBlock()) {
        const block = getCurrentBlock()
        params.id = block?.id
        params.pageInfo.name = block?.label
        previewBlock(params)
      } else {
        const page = getCurrentPage()
        const theme = getMetaApi(META_SERVICE.ThemeSwitch)?.getThemeState()?.theme
        params.id = page?.id
        params.pageInfo.name = page?.name
        params.ancestors = await getFamily(params)
        params.theme = theme
        previewPage(params)
      }

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
