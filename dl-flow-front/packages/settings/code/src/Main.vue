<template>
  <div class="code">
    <Tip v-if="!editorVisible" desc="当前节点不支持代码编辑" class="code__tip" />
    <div class="code__editor" v-else>
      <div class="code__editor__header">
        <tiny-form :model="formData" :rules="rules" :hide-required-asterisk="false" label-position="top" ref="form">
          <tiny-form-item label="请选择类" prop="selectedClass" required>
            <tiny-select v-model="formData.selectedClass">
              <tiny-option v-for="(clazz, idx) in classes" :value="clazz" :key="idx">
                {{ clazz }}
              </tiny-option>
            </tiny-select>
          </tiny-form-item>
        </tiny-form>
      </div>
      <VueMonaco v-model:value="code" class="code__editor__content" />
      <tiny-button-group>
        <tiny-button type="primary" :border="false" @click="save">保存编辑</tiny-button>
      </tiny-button-group>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, reactive } from 'vue'
import {
  Form as TinyForm,
  FormItem as TinyFormItem,
  Button as TinyButton,
  ButtonGroup as TinyButtonGroup,
  Select as TinySelect,
  Option as TinyOption
} from '@opentiny/vue'
import { Tip, VueMonaco } from '@opentiny/tiny-engine-common'
import { useX6, useLayout, useVisitor } from '@opentiny/tiny-engine-controller'
import { Python3Parser } from 'dt-python-parser'
const parser = new Python3Parser()
const code = ref('')
const { layoutState } = useLayout()
const ast = ref()
const clazzDef = ref()
const selectMode = ref()
const editorVisible = computed(() => selectMode.value === 'layer' && layoutState.settings.render === 'Code')
const { visitor, getClassNames, getProperty } = useVisitor()
const errors = computed(() => parser.validate(code.value))
const error = computed(() => Boolean(errors.value.length))
const classes = computed(() => (ast.value && !error.value ? getClassNames() : new Set()))
const form = ref()
const formData = reactive({
  selectedClass: '',
  property: {}
})
const rules = reactive({
  selectedClass: [{ required: true, trigger: 'change' }]
})
const save = () => {
  form.value.validate((valid) => {
    if (!valid) {
      return
    }
    formData.property = getProperty(formData.selectedClass)
    // send request
  })
}
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
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 8px;
    &__header {
      width: 100%;
      padding: 0 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    &__content {
      width: 100%;
      flex: 1 1 auto;
    }
  }
}
</style>
