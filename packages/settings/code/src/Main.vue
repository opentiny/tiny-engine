<template>
  <div class="code">
    <Tip v-if="!editorVisible" desc="当前节点不支持代码编辑" class="code__tip" />
    <VueMonaco v-else :value="code" class="code__editor" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Tip, VueMonaco } from '@opentiny/tiny-engine-common'
import { useX6, useLayout } from '@opentiny/tiny-engine-controller'
const code = ref('')
const { layoutState } = useLayout()
const selectMode = ref()
const editorVisible = computed(() => selectMode.value === 'layer' && layoutState.settings.render === 'Code')
onMounted(() => {
  const { g } = useX6()
  g.on('selection:changed', () => {
    if (!g.getSelectedCellCount()) {
      selectMode.value = ''
      return
    }
    const _node = g.getSelectedCells()
    let node
    if (_node.length === 1 && _node[0].getData().mode === 'layer') {
      node = _node[0]
    } else {
      node = _node.filter((n) => n && n.getData().mode === 'layer')[0]
    }
    /**
     * @type {import('../../../controller/src/useX6.js').MaterialInfo}
     */
    const data = node.getData()
    selectMode.value = data.mode
  })
})
</script>

<style lang="less" scoped>
.code {
  width: 100%;
  height: 100%;
  &__tip {
    margin: 0%;
    padding-top: 50px;
  }
  &__editor {
    width: 100%;
    height: 100%;
  }
}
</style>
