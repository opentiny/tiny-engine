<template>
  <div class="toolbar-itm-clean">
    <toolbar-base-component
      :type="type"
      content="清除屏幕"
      :icon="icon.default"
      :options="options"
      @click-api="clean"
    >
    </toolbar-base-component>
  </div>
</template>

<script lang="jsx">
import { ref, watch, getCurrentInstance } from 'vue'
import { Popover, Modal } from '@opentiny/vue'
import { useCanvas, useLayout } from '@opentiny/tiny-engine-meta-register'
import { constants } from '@opentiny/tiny-engine-utils'
import { ToolbarBaseComponent } from '@opentiny/tiny-engine-layout'

const { PAGE_STATUS } = constants
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
    const app = getCurrentInstance()
    const SvgIcon = app.appContext.components.SvgIcon
    const { pageState, clearCanvas } = useCanvas()
    const isLock = ref(pageState.isLock)

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
        Modal.confirm({
          title: '提示',
          message: () => {
            return [
              <div class="modal-content">
                {
                  <div class="wrap">
                    <SvgIcon name="warning"></SvgIcon>
                    <span>{`您确定要清除屏幕吗？`}</span>
                  </div>
                }
              </div>
            ]
          }
        }).then((res) => {
          if (res === 'confirm') {
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
