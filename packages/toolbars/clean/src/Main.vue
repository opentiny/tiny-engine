<template>
  <div class="toolbar-itm-clean">
    <toolbar-base content="清除屏幕" :icon="options.icon.default || options.icon" :options="options" @click-api="clean">
    </toolbar-base>
  </div>
</template>

<script lang="jsx">
import { ref, watch } from 'vue'
import { useCanvas, useLayout, useModal } from '@opentiny/tiny-engine-meta-register'
import { constants } from '@opentiny/tiny-engine-utils'
import { ToolbarBase } from '@opentiny/tiny-engine-common'

const { PAGE_STATUS } = constants
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
    const { pageState, clearCanvas } = useCanvas()
    const isLock = ref(pageState.isLock)
    const { confirm } = useModal()

    watch(
      () => pageState.isLock,
      // eslint-disable-next-line no-return-assign
      (value) => (isLock.value = value)
    )

    const clean = () => {
      if (![PAGE_STATUS.Occupy, PAGE_STATUS.Guest].includes(useLayout().layoutState?.pageStatus?.state)) {
        return
      }

      if (!isLock.value) {
        confirm({
          title: '提示',
          message: () => {
            return [
              <div class="modal-content">
                {
                  <div class="wrap">
                    <span>{`您确定要清除屏幕吗？`}</span>
                  </div>
                }
              </div>
            ]
          },
          exec: () => {
            clearCanvas()
          }
        })
      }
    }

    return {
      clean,
      isLock
    }
  }
}
</script>
