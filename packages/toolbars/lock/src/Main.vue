<template>
  <toolbar-base
    v-if="!state.isGuest"
    :icon="iconName"
    :content="statusMessageMap[state.status]?.nextOptName"
    :options="options"
    @click-api="lockOrUnlock"
  >
  </toolbar-base>
</template>

<script>
import { computed, reactive } from 'vue'
import { useCanvas, useLayout, useBlock, useNotify } from '@opentiny/tiny-engine-meta-register'
import { constants } from '@opentiny/tiny-engine-utils'
import { ToolbarBase } from '@opentiny/tiny-engine-common'
import { requestBlockPage } from './http'

const { COMPONENT_NAME, PAGE_STATUS } = constants

const componentType = {
  block: '区块',
  page: '页面'
}

const statusMessageMap = {
  [PAGE_STATUS.Release]: {
    message: (type) => `${componentType[type]}解锁成功！`,
    currentOptName: '解锁',
    nextOptName: '锁定'
  },
  [PAGE_STATUS.Lock]: {
    message: (type) => `${componentType[type]}解锁成功！`,
    currentOptName: '解锁',
    nextOptName: '解锁'
  },
  [PAGE_STATUS.Occupy]: {
    message: (type) => `${componentType[type]}锁定成功`,
    currentOptName: '锁定',
    nextOptName: '解锁'
  }
}

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
  setup(props) {
    const { pageState } = useCanvas()
    const { layoutState } = useLayout()
    const { getCurrentBlock } = useBlock()

    const state = reactive({
      status: computed(() => layoutState.pageStatus.state),
      isGuest: computed(() => layoutState.pageStatus.state === PAGE_STATUS.Guest),
      type: '',
      disabled: false
    })

    const iconName = computed(() => {
      switch (state.status) {
        case PAGE_STATUS.Occupy:
          return props.options.icon.locked
        case PAGE_STATUS.Lock:
          return props.options.icon.userLocked
        default:
          return props.options.icon.unlocked
      }
    })

    const lockPage = (id, type, newState) => {
      requestBlockPage(`id=${id}&state=${newState}&type=${type}`)
        .then((data) => {
          if (data?.operate === 'success') {
            useNotify({
              type: 'success',
              message: statusMessageMap[newState].message(type)
            })
            layoutState.pageStatus.state = newState
          } else {
            const pageInfo = layoutState.pageStatus?.data
            useNotify({
              type: 'warning',
              message: `当前页面被 ${pageInfo?.username || ''} ${pageInfo?.resetPasswordToken || ''} 锁定，请联系解锁`
            })
          }
        })
        .catch((error) => {
          useNotify({
            type: 'error',
            title: `页面${statusMessageMap[newState].currentOptName}失败`,
            message: JSON.stringify(error?.message || error)
          })
        })
        .finally(() => {
          state.disabled = false
        })
    }

    const lockOrUnlock = () => {
      if (state.disabled) {
        return
      }

      const optType =
        state.status === PAGE_STATUS.Occupy || state.status === PAGE_STATUS.Lock
          ? PAGE_STATUS.Release
          : PAGE_STATUS.Occupy

      pageState.currentSchema = {}
      pageState.properties = null

      state.disabled = true

      if (pageState.pageSchema.componentName !== COMPONENT_NAME.Block) {
        lockPage(pageState.currentPage.id, 'page', optType)
      } else {
        lockPage(getCurrentBlock().id, 'block', optType)
      }
    }

    return {
      state,
      lockOrUnlock,
      PAGE_STATUS,
      statusMessageMap,
      iconName
    }
  }
}
</script>
