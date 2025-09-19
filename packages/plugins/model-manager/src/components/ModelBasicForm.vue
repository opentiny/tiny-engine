<template>
  <div class="section">
    <tiny-form ref="ruleFormRef" :model="localValue" :rules="rules">
      <div class="form-item">
        <tiny-form-item label="中文名称" prop="nameCn">
          <tiny-input v-model="localValue.nameCn" placeholder="请输入模型中文名称" />
        </tiny-form-item>
      </div>
      <div class="form-item">
        <tiny-form-item label="英文名称" prop="nameEn">
          <tiny-input v-model="localValue.nameEn" placeholder="请输入模型英文名称" />
        </tiny-form-item>
      </div>
      <div class="form-item">
        <tiny-form-item label="版本号" prop="version">
          <tiny-input v-model="localValue.version" placeholder="1.0.0" />
        </tiny-form-item>
      </div>
      <div class="form-item">
        <tiny-form-item label="模型地址" prop="modelUrl">
          <tiny-input v-model="localValue.modelUrl" placeholder="请输入模型地址，如：https://api.example.com/model" />
        </tiny-form-item>
      </div>
      <div class="form-item">
        <tiny-form-item label="描述" prop="description">
          <tiny-input type="textarea" :rows="3" v-model="localValue.description" placeholder="请输入模型描述" />
        </tiny-form-item>
      </div>
    </tiny-form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { TinyInput, Form as TinyForm, FormItem as TinyFormItem } from '@opentiny/vue'

const props = defineProps({
  model: { type: Object, required: true }
})

// 创建本地副本，直接编辑本地数据
const localValue = ref(props.model)

const ruleFormRef = ref()

const rules = ref({
  nameCn: [
    { required: true, message: '必填', trigger: 'blur' },
    { min: 1, max: 32, message: '长度在1-32之间', trigger: 'blur' }
  ],
  nameEn: [
    { required: true, message: '必填', trigger: 'blur' },
    { min: 1, max: 32, message: '长度在1-32之间', trigger: 'blur' }
  ],
  version: [{ required: true, message: '必填', trigger: 'blur' }],
  modelUrl: [
    { required: true, message: '必填', trigger: 'blur' },
    { min: 1, max: 200, message: '长度在1-200之间', trigger: 'blur' }
  ]
})

// 监听 props 变化，同步到本地（当选择不同模型时）
watch(
  () => props.model,
  (newModel) => {
    localValue.value = newModel
  },
  { deep: true }
)

const validate = () => ruleFormRef.value.validate()

// 暴露本地数据给父组件访问
defineExpose({
  getLocalValue: () => localValue.value,
  validate
})
</script>

<style scoped>
.section {
  margin-bottom: 16px;
  border-radius: 6px;
  padding: 12px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}
.form-item {
  margin-bottom: 20px;
}
.form-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #262626;
  font-size: 14px;
}
</style>
