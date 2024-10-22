<template>
  <config-render :data="properties">
    <template #prefix="{ data }">
      <block-link-field v-if="isBlock" :data="data"></block-link-field>
    </template>
  </config-render>
  <block-description v-if="isBlock" class="block-description"> </block-description>
  <empty :showEmptyTips="showEmptyTips"></empty>
</template>

<script>
import { computed, watchEffect, ref } from 'vue'
import { ConfigRender, BlockDescription, BlockLinkField } from '@opentiny/tiny-engine-common'
import { useCanvas, useProperty } from '@opentiny/tiny-engine-meta-register'
import Empty from './components/Empty.vue'

export default {
  components: {
    ConfigRender,
    BlockLinkField,
    BlockDescription,
    Empty
  },
  setup() {
    const { pageState } = useCanvas()
    const { properties } = useProperty().getProperty({ pageState })
    const showEmptyTips = ref(false)

    const isBlock = computed(() => pageState.isBlock)

    watchEffect(() => {
      showEmptyTips.value = !properties.value?.length
    })

    return {
      isBlock,
      properties,
      showEmptyTips
    }
  }
}
</script>

<style lang="less" scoped>
.block-description {
  margin: 12px;
}
</style>
