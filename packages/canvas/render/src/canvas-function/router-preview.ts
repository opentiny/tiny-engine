import { onUnmounted, ref } from 'vue'
import { getController } from './controller'
import { getPageAncestors } from '../material-function/page-getter'

export function useRouterPreview() {
  const pageId = ref(getController().getBaseInfo().pageId)
  const previewId = ref(getController().getBaseInfo().previewId)
  const updatePreviewId = getController().updatePreviewId
  const previewFullPath = ref([])
  const previewPath = ref([])

  async function calcNewPreviewFullPath() {
    if (!pageId.value) {
      if (previewId.value) {
        updatePreviewId(undefined, true)
        return
      }
      previewFullPath.value = []
      previewPath.value = []
      return
    }
    if (!previewId.value) {
      previewFullPath.value = await getPageAncestors(pageId.value)
      previewPath.value = []
      return
    }

    if (previewFullPath.value[previewFullPath.value.length - 1] !== previewId.value) {
      // previewId changed
      const fullPath = await getPageAncestors(previewId.value)
      if (fullPath.includes(pageId.value)) {
        previewFullPath.value = fullPath
      } else {
        updatePreviewId(pageId.value, true)
      }
    }

    if (previewFullPath.value.includes(pageId.value)) {
      // only pageId changed and fast move
      const fastJumpIndex = previewFullPath.value.indexOf(pageId.value)
      if (fastJumpIndex + 1 < previewFullPath.value.length) {
        previewPath.value = previewFullPath.value.slice(fastJumpIndex + 1)
      } else {
        previewPath.value = []
      }
    } else {
      previewFullPath.value = await getPageAncestors(pageId.value)
      previewPath.value = []
      updatePreviewId(pageId.value, true)
    }
  }

  const cancel = getController().addHistoryDataChangedCallback(() => {
    const newPageId = getController().getBaseInfo().pageId
    const newPreviewId = getController().getBaseInfo().previewId
    const pageIdChanged = newPageId !== pageId.value
    const previewIdChanged = newPreviewId !== previewId.value
    if (pageIdChanged) {
      pageId.value = newPageId
    }
    if (previewIdChanged) {
      previewId.value = newPreviewId
    }
    if (previewIdChanged || pageIdChanged) {
      calcNewPreviewFullPath()
    }
  })

  onUnmounted(() => {
    cancel()
  })

  calcNewPreviewFullPath()

  return {
    previewPath,
    previewFullPath
  }
}
