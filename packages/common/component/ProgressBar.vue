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
import { useLayout } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinyProgress
  },
  setup() {
    const { PLUGIN_NAME, getPluginApi } = useLayout()
    const { getEditBlock } = getPluginApi(PLUGIN_NAME.BlockManage)
    const editBlock = computed(getEditBlock)

    return {
      editBlock
    }
  }
}
</script>

<style lang="less" scoped></style>
