<template>
  <div class="code">
    <Tip v-if="!editorVisible" desc="当前节点不支持代码编辑" class="code__tip" />
    <div class="code__editor" v-else>
      <div class="code__editor__header">
        <tiny-form :model="formData" :rules="rules" :hide-required-asterisk="false" label-position="top" ref="form">
          <tiny-form-item label="Label" props="label" required>
            <tiny-input v-model="label" title="你不应该手动修改label, 因为Layer应该是有语义的" disabled />
          </tiny-form-item>
          <tiny-form-item label="请选择类" prop="clazz" required>
            <tiny-select v-model="formData.clazz">
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
  Option as TinyOption,
  Input as TinyInput
} from '@opentiny/vue'
import { Tip, VueMonaco } from '@opentiny/tiny-engine-common'
import { useX6, useLayout, useVisitor, useLayer, useSchema } from '@opentiny/tiny-engine-controller'
import i18n from '@opentiny/tiny-engine-i18n-host';
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
/**
 * @type {import('@opentiny/tiny-engine-controller/useResource').LayerItem}
 */
const formData = reactive({
  label: {
    zh_CN: '',
    en_US: '',
  },
  clazz: '',
  properties: [],
  code: '',
  id: '',
})
const label = ref('');
const locale = i18n.global.locale;
const rules = reactive({
  clazz: [{ required: true, trigger: 'change' }]
})
const {createLayer} = useLayer();
const {updateSchema} = useSchema()
/**
 * @type {import('@antv/x6').Cell}
 */
let node
/**
 * @type {import('@antv/x6').Graph}
 */
let g;
const save = () => {
  form.value.validate((valid) => {
    if (!valid) {
      return
    }
    formData.id = formData.clazz;
    formData.code = code.value;
    formData.properties = getProperty(formData.clazz)
    formData.label = {
      zh_CN: label.value,
      en_US: label.value
    };
    createLayer(formData)
      .then(({error})=>{
        if (!error.value && node){
          node.setData({
            ...node.getData(),
            ...formData,
            new: false
          })
          const {g} = useX6()
          updateSchema(
            g.toJSON()
          )
        }
      })
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
watch(formData, () => {
  if (node && formData.clazz){
    label.value = formData.clazz;
    node.setData(
      {
        ...node.getData(),
        label: {
          zh_CN: label.value,
          en_US: label.value
        }
      }
    )
    if (g){
      updateSchema(g.toJSON());
    }
  }
}, {deep: true})
onMounted(() => {
  g = useX6().g;
  g.on('selection:changed', () => {
    if (!g.getSelectedCellCount()) {
      selectMode.value = ''
      return
    }
    const _node = g.getSelectedCells()
    node = _node.filter((n) => n && n.getData()?.mode === 'layer')[0]
    if (!node){
      return;
    }
    /**
     * @type {import('../../../controller/src/useX6.js').MaterialInfo}
     */
    const data = node.getData()
    selectMode.value = data.mode
    formData.label = data.label[locale.value];
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
