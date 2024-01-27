<template>
  <div class="code">
    <Tip v-if="!editorVisible" desc="当前节点不支持代码编辑" style="margin: 0px" />
    <monaco-editor v-else :value="code" class="code__editor" ref="editor" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Tip, MonacoEditor } from '@opentiny/tiny-engine-common'
import { useX6 } from '@opentiny/tiny-engine-controller'
/**
 * @type {import('vue').Ref<import('monaco-editor').editor.IStandaloneCodeEditor|import('monaco-editor').editor.IDiffEditor>}
 */
const editor = ref()
const editorVisible = ref(false)
const code = ref('')
onMounted(() => {
  const { g } = useX6()
  g.on('selection:changed', () => {
    if (!g.getSelectedCellCount()) {
      editorVisible.value = false
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
    editorVisible.value = data.mode === 'layer'
  })
})
</script>

<style lang="less" scoped>
.code {
  width: 100%;
  height: 100%;
  &__editor {
    width: 100%;
    height: 100%;
  }
}
</style>
