<template>
  <div>
    <tiny-dialog-box
      :append-to-body="true"
      :close-on-click-modal="false"
      :visible="visible"
      title="导入单个图标"
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
        <tiny-form-item label="名称" prop="name_cn">
          <TinyInput v-model="formData.name" placeholder="请输入名称"></TinyInput>
        </tiny-form-item>
        <tiny-form-item label="图标SVG" prop="label">
          <!-- <TinyInput v-model="formData.iconify" placeholder="请输入iconifyJSON格式内容" type="textarea"></TinyInput> -->
          <tiny-button size="small">选择文件导入</tiny-button>
        </tiny-form-item>
        <p v-show="fromCanvas" class="block-tip">
          注意: 当前动作拷贝的methods方法只是一个空方法，具体的业务逻辑需要在空方法中自行添加！！
        </p>
      </tiny-form>
      <template #footer>
        <tiny-button type="primary" @click="save">确定</tiny-button>
        <tiny-button @click="cancel">取消</tiny-button>
      </template>
    </tiny-dialog-box>
  </div>
</template>

<script>
import { reactive, computed, ref } from 'vue'
import { Input, Form, FormItem, Button, DialogBox } from '@opentiny/vue'
import { importIconCollection } from './js/http'

export default {
  components: {
    TinyForm: Form,
    TinyInput: Input,
    TinyFormItem: FormItem,
    TinyDialogBox: DialogBox,
    TinyButton: Button
  },
  props: {
    boxVisibility: Boolean,
    fromCanvas: Boolean
  },
  emits: ['close', 'complete'],
  setup(props, { emit }) {
    const formData = reactive({
      name: '',
      prefix: '',
      iconify: ''
    })

    const visible = computed(() => props.boxVisibility)
    const formRef = ref(null)
    const cancel = () => {
      emit('close')
    }

    const save = () => {
      formRef.value.validate(async (valid) => {
        if (!valid) {
          return
        }

        await importIconCollection({
          name: formData.name,
          prefix: formData.prefix,
          iconify: JSON.parse(formData.iconify)
        })

        emit('complete')
      })
    }

    const rules = {
      name: [{ required: true, message: '必填', trigger: 'blur' }],
      prefix: [{ required: true, message: '必填', trigger: 'blur' }],
      iconify: [{ required: true, message: '必填', trigger: 'blur' }]
    }

    return {
      formData,
      formRef,
      rules,
      save,
      cancel,
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
