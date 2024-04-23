<template>
  <div>
    <tiny-dialog-box
      :append-to-body="true"
      :close-on-click-modal="false"
      :visible="visible"
      title="新建区块"
      width="500"
      @close="cancel"
    >
      <tiny-form
        show-message
        :model="formData"
        :rules="rules"
        ref="formRef"
        label-width="120px"
        :label-align="true"
        label-position="left"
        validate-type="text"
      >
        <tiny-form-item label="区块名称" prop="name_cn">
          <TinyInput v-model="formData.name_cn" placeholder="请输入区块名称"></TinyInput>
        </tiny-form-item>
        <tiny-form-item label="区块ID" prop="label">
          <TinyInput v-model="formData.label" placeholder="请输入区块ID"></TinyInput>
        </tiny-form-item>
        <tiny-form-item label="请选择区块分类" prop="group">
          <tiny-select v-model="formData.group" :options="categoryList" placeholder="请选择" @change="changeCategory">
          </tiny-select>
        </tiny-form-item>
        <p v-show="fromCanvas" class="block-tip">
          注意: 当前动作拷贝的methods方法只是一个空方法，具体的业务逻辑需要在空方法中自行添加！！
        </p>
      </tiny-form>
      <template #footer>
        <tiny-button type="primary" @click="addBlock">确定</tiny-button>
        <tiny-button @click="cancel">取消</tiny-button>
      </template>
    </tiny-dialog-box>
  </div>
</template>

<script>
import { reactive, computed, ref } from 'vue'
import { Input, Form, FormItem, Button, DialogBox, Select } from '@opentiny/vue'
import { useBlock, useLayout, useCanvas, useModal } from '@opentiny/tiny-engine-controller'
import { REGEXP_BLOCK_NAME } from '@opentiny/tiny-engine-controller/js/verification'

export default {
  components: {
    TinyForm: Form,
    TinyInput: Input,
    TinyFormItem: FormItem,
    TinyDialogBox: DialogBox,
    TinyButton: Button,
    TinySelect: Select
  },
  props: {
    boxVisibility: Boolean,
    fromCanvas: Boolean
  },
  emits: ['close'],
  setup(props, { emit }) {
    const formData = reactive({
      label: '',
      path: 'default',
      name_cn: '',
      group: ''
    })
    const { createEmptyBlock, createBlock, getCategoryList } = useBlock()
    const visible = computed(() => props.boxVisibility)
    const { PLUGIN_NAME, activePlugin } = useLayout()
    const { isSaved } = useCanvas()
    const { confirm } = useModal()
    const formRef = ref(null)

    const categoryList = computed(() =>
      getCategoryList().map((item) => ({ ...item, value: item.id, label: item.name }))
    )

    const cancel = () => {
      emit('close')
    }
    const changeCategory = (value) => {
      const { id, category_id } = categoryList.value.find((item) => item.value === value)
      formData.path = category_id
      formData.categories = [id]
    }

    const handleAddBlock = () => {
      props.fromCanvas ? createBlock(formData) : createEmptyBlock(formData)
      activePlugin(PLUGIN_NAME.Materials) // ?? 疑问：新建区块后，这里为啥要激活物料
      cancel()
    }
    const addBlock = () => {
      formRef.value.validate((valid) => {
        if (!valid) {
          return
        }

        if (isSaved()) {
          handleAddBlock()
          return
        }
        confirm({
          message: '当前画布内容尚未保存，新建区块会将画布切换至新区块中，是否要继续切换?',
          exec: () => {
            handleAddBlock()
          }
        })
      })
    }

    const rules = {
      name_cn: [{ required: true, message: '必填', trigger: 'blur' }],
      label: [
        { pattern: REGEXP_BLOCK_NAME, message: '两个单词以上, 且是大写开头驼峰格式' },
        { required: true, message: '必填', trigger: 'blur' }
      ]
    }

    return {
      formData,
      categoryList,
      formRef,
      rules,
      addBlock,
      cancel,
      changeCategory,
      visible
    }
  }
}
</script>

<style scoped lang="less">
.block-tip {
  color: var(--ti-lowcode-error-tip-color);
}
</style>
