<template>
  <p v-if="showEmptyTips" class="empty-tips">{{ tipsDesc }}</p>
</template>

<script>
import { ref, watch } from 'vue'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

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
    const { getSchema } = useCanvas()

    watch(
      () => getSchema()?.children?.length,
      (len) => {
        tipsDesc.value = len ? EMPTY_SELECTION : EMPTY_COMPONENT
      }
    )

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
