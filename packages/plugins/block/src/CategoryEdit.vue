<template>
  <tiny-dialog-box
    v-model:visible="state.visible"
    dialog-class="deploy-dialog"
    :title="title"
    :append-to-body="true"
    :is-form-reset="false"
    @close="closeDialog"
  >
    <tiny-form
      ref="form"
      show-message
      :model="formData"
      :rules="rules"
      label-width="64px"
      :label-align="true"
      label-position="left"
      validate-type="text"
    >
      <tiny-form-item :label="groupLabels.nameInput" prop="name">
        <tiny-input
          v-model="formData.name"
          :placeholder="groupLabels.nameInputPlaceholder"
          @change="handleChangeName"
        ></tiny-input>
      </tiny-form-item>
      <!-- 分组不需要填写表单id字段 -->
      <tiny-form-item v-if="!shouldReplaceCategoryWithGroup()" label="分类ID" prop="categoryId">
        <tiny-input v-model="formData.categoryId" placeholder="请输入分类ID" :disabled="isEdit"></tiny-input>
      </tiny-form-item>
    </tiny-form>
    <template #footer>
      <tiny-button type="primary" @click="confirm">确定</tiny-button>
      <tiny-button @click="closeDialog">取消</tiny-button>
    </template>
  </tiny-dialog-box>
</template>

<script setup>
import { defineProps, defineEmits, ref, reactive, computed, watch } from 'vue'
import { pinyin } from 'pinyin-pro'
import {
  Form as TinyForm,
  FormItem as TinyFormItem,
  Input as TinyInput,
  Button as TinyButton,
  DialogBox as TinyDialogBox
} from '@opentiny/vue'
import { useBlock } from '@opentiny/tiny-engine-meta-register'
import { REGEXP_GROUP_NAME } from '@opentiny/tiny-engine-common/js/verification'
import { extend } from '@opentiny/vue-renderless/common/object'
import { createOrUpdateCategory } from './js/blockSetting'

const { getGroupList, shouldReplaceCategoryWithGroup } = useBlock()

const props = defineProps({
  modelValue: Boolean,
  initialValue: Object
})

const emit = defineEmits(['update:modelValue'])

const groupLabels = shouldReplaceCategoryWithGroup()
  ? {
      text: '分组',
      nameInput: '分组名称',
      nameInputPlaceholder: '请输入分组名称',
      validateErrMsg: '分组名称不能重复！'
    }
  : {
      text: '分类',
      nameInput: '分类名称',
      nameInputPlaceholder: '请输入分类名称',
      validateErrMsg: '分类名称不能重复！'
    }

const state = reactive({
  visible: false
})

const isEdit = computed(() => Object.keys(props.initialValue).length !== 0)
const groupList = computed(getGroupList)

const form = ref(null)

const formData = reactive({ name: '', categoryId: '' })

const validateGroup = (rule, value, callback) => {
  const isRepeat = props.initialValue?.name !== value && groupList.value.some((group) => group.name === value)
  if (isRepeat) {
    callback(new Error(groupLabels.validateErrMsg))
    return
  }
  callback()
}
const rules = reactive({
  name: [
    { required: true, message: '必填', trigger: 'blur' },
    { pattern: REGEXP_GROUP_NAME, message: '只能包含大小写字母、数字和特殊字符', trigger: 'change' },
    {
      validator: validateGroup,
      trigger: 'blur'
    }
  ],
  categoryId: [{ required: true, message: '必填', trigger: 'blur' }]
})

// 分组不需要填写表单id字段
if (shouldReplaceCategoryWithGroup()) {
  rules.categoryId = []
}

const handleChangeName = (value) => {
  if (isEdit.value) {
    // 编辑时不允许修改id
    return
  }
  const cnReg = /[\u4e00-\u9fa5]/g
  let id = value.replace(cnReg, (match) => {
    return pinyin(match, { toneType: 'none' })
  })
  // 名称不重复，id重复，后缀加上时间戳
  const isRepeat = groupList.value.some((item) => item.name !== value && item.category_id === id)
  if (isRepeat) {
    id += new Date().getTime()
  }
  formData.categoryId = id
}

const title = computed(() => `${isEdit.value ? '编辑' : '新增'}${groupLabels.text}`)

const closeDialog = () => {
  emit('update:modelValue', false)
}

const confirm = () => {
  form.value.validate((valid) => {
    if (valid) {
      const params = extend(true, {}, formData)
      if (isEdit.value) {
        params.id = props.initialValue.id
      }
      createOrUpdateCategory(params, isEdit.value)
      closeDialog()
    }
  })
}

watch(
  () => props.modelValue,
  (val) => {
    state.visible = val
  }
)

watch(
  () => props.initialValue,
  (val) => {
    if (val) {
      formData.name = val.name ?? ''
      formData.categoryId = val.category_id ?? ''
    }
  }
)
</script>
