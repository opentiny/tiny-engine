<template>
  <div class="code">
    <Tip v-if="!editorVisible" desc="当前节点不支持代码编辑" class="code__tip" />
    <VueMonaco v-else v-model:value="code" class="code__editor" @change="onChange" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { Tip, VueMonaco } from '@opentiny/tiny-engine-common'
import { useX6, useLayout, useVisitor } from '@opentiny/tiny-engine-controller'
import { Python3Parser } from 'dt-python-parser'
const parser = new Python3Parser()
const code = ref('')
const { layoutState } = useLayout()
const selectMode = ref()
const editorVisible = computed(() => selectMode.value === 'layer' && layoutState.settings.render === 'Code')

const { visitor } = useVisitor()
const errors = computed(() => parser.validate(code.value))
const ast = ref()
const clazzDef = ref()
watch(ast, () => {
  if (ast.value) {
    clazzDef.value = visitor.visit(ast.value)
  }
})
watch(errors, () => {
  if (!errors.value.length) {
    ast.value = parser.parse(code.value)
    return
  }
  ast.value = null
})
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
