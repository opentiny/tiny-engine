<template>
  <div class="toolbar-preview">
    <toolbar-base
      content="预览"
      :icon="options.icon?.default || options?.icon"
      :options="options"
      trigger="hover"
      @click-api="preview('page')"
    >
      <template #button>
        <tiny-popover width="85" trigger="hover" :open-delay="OPEN_DELAY.Default">
          <template #reference>
            <svg-icon :name="iconExpand"></svg-icon>
          </template>
          <div class="toolbar-preview-item">
            <span @click="preview('page')">页面预览</span>
            <span @click="preview('app')">应用预览</span>
          </div>
        </tiny-popover>
      </template>
    </toolbar-base>
  </div>
</template>

<script lang="ts">
/* metaService: engine.toolbars.preview.Main */
import { previewPage } from '@opentiny/tiny-engine-common/js/preview'
import { useLayout, useNotify, getOptions } from '@opentiny/tiny-engine-meta-register'
import { constants } from '@opentiny/tiny-engine-utils'
import type { Component } from 'vue'
import { Popover } from '@opentiny/vue'
import meta from '../meta'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
const { OPEN_DELAY } = constants

export default {
  components: {
    TinyPopover: Popover as Component,
    ToolbarBase
  },
  props: {
    iconExpand: {
      type: String,
      default: 'down-arrow'
    },
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
      preview,
      OPEN_DELAY
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
