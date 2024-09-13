<template>
  <component :is="pageMain"></component>
</template>

<script>
import { getMergeRegistry } from '@opentiny/tiny-engine-meta-register'
import { openPageSettingPanel } from './PageSetting.vue'
import { fetchPageDetail } from './http'
import meta from '../meta'

export const api = {
  getPageById: async (id) => {
    if (id) {
      return fetchPageDetail(id)
    }

    return undefined
  },
  openPageSettingPanel
}
export default {
  setup() {
    const registry = getMergeRegistry(meta.type, meta.id)
    const pageMain = registry.components.PageMain

    return {
      pageMain
    }
  }
}
</script>
