<template>
  <div>
    <tiny-progress
      v-if="editBlock?.isShowProgress"
      class="progress-bar"
      :stroke-width="2"
      :text-inside="true"
      :percentage="editBlock?.publishProgress"
      status="success"
    ></tiny-progress>
  </div>
</template>

<script>
import { computed } from 'vue'
import { Progress as TinyProgress } from '@opentiny/vue'
import { getMetaApi, META_APP } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinyProgress
  },
  setup() {
    const { getEditBlock } = getMetaApi(META_APP.BlockManage) || {}
    const editBlock = getEditBlock ? computed(getEditBlock) : null

    return {
      editBlock
    }
  }
}
</script>

<style lang="less" scoped></style>
