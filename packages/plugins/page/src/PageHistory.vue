<template>
  <block-history-list :history="list" @preview="previewHistory" @restore="restoreHistory"></block-history-list>
</template>

<script>
import { ref, watchEffect } from 'vue'
import { BlockHistoryList } from '@opentiny/tiny-engine-common'
import { previewPage } from '@opentiny/tiny-engine-common/js/preview'
import { usePage, useBlock, useModal, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { fetchPageHistory } from './http.js'

export default {
  components: {
    BlockHistoryList
  },
  props: {
    curPageData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['restorePage'],
  setup(props, { emit }) {
    const { pageSettingState } = usePage()
    const { getDateFromNow } = useBlock()
    const { confirm } = useModal()
    const list = ref([])

    const getHistoryList = (pageId) => {
      const { id, version } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
      const params = version ? `&app=${id}&version=${version}` : ''

      if (pageId) {
        fetchPageHistory(pageId + params).then((data) => {
          if (!data) {
            return
          }
          data.forEach((item) => {
            item.backupTitle = item.message
            item.backupTime = getDateFromNow(new Date(item.time))
          })
          list.value = data.reverse()
        })
      } else {
        list.value = []
      }
    }

    watchEffect(() => {
      const pageId = pageSettingState.currentPageData?.id || ''
      getHistoryList(pageId)
    })

    const previewHistory = (item) => {
      item &&
        previewPage({
          id: item.page,
          history: item.id,
          framework: getMergeMeta('engine.config')?.dslMode,
          platform: getMergeMeta('engine.config')?.platformId,
          pageInfo: {
            name: item.name
          },
          ancestors: [item]
        })
    }

    const restoreHistory = (item) => {
      confirm({
        title: '提示',
        message: '您即将还原历史页面，是否继续还原？',
        exec: () => {
          emit('restorePage', item)
        }
      })
    }

    return {
      list,
      previewHistory,
      restoreHistory
    }
  }
}
</script>
