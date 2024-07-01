<template>
  <div class="toolbar-itm-clean">
    <tiny-popover
      trigger="hover"
      :open-delay="1000"
      popper-class="toolbar-right-popover"
      append-to-body
      content="清除屏幕"
    >
      <template #reference>
        <span :class="['icon', { disabled: isLock }]" @click="clean">
          <svg-icon :name="icon"></svg-icon>
        </span>
      </template>
    </tiny-popover>
  </div>
</template>

<script lang="jsx">
import { ref, watch, getCurrentInstance } from 'vue'
import { Popover, Modal } from '@opentiny/vue'
import { useCanvas, useLayout } from '@opentiny/tiny-engine-meta-register'
import { constants } from '@opentiny/tiny-engine-utils'

const { PAGE_STATUS } = constants
export default {
  components: {
    TinyPopover: Popover
  },
  props: {
    icon: {
      type: String,
      default: 'clear'
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
