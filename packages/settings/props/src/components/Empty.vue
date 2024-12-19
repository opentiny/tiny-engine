<template>
  <p v-if="showEmptyTips" class="empty-tips">{{ tipsDesc }}</p>
</template>

<script>
import { ref, watchEffect } from 'vue'
import { useBroadcastChannel } from '@vueuse/core'
import { constants } from '@opentiny/tiny-engine-utils'

const { BROADCAST_CHANNEL } = constants

const EMPTY_COMPONENT = '您还未拖拽组件至画布中'
const EMPTY_SELECTION = '请在画布中选择组件'

export default {
  props: {
    showEmptyTips: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const tipsDesc = ref(EMPTY_COMPONENT)
    const { data: schemaLength } = useBroadcastChannel({ name: BROADCAST_CHANNEL.SchemaLength })

    watchEffect(() => {
      tipsDesc.value = schemaLength.value ? EMPTY_SELECTION : EMPTY_COMPONENT
    })

    return {
      tipsDesc
    }
  }
}
</script>

<style lang="less" scoped>
.empty-tips {
  color: var(--te-common-text-weaken);
  text-align: center;
  margin-top: 50px;
  font-size: 12px;
}
</style>
