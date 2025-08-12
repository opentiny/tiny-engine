<template>
  <div class="section">
    <h4 class="section-title">模型基本设置</h4>
    <div class="form-item">
      <label>中文名称：</label>
      <tiny-input v-model="localValue.nameCn" placeholder="请输入模型中文名称" />
    </div>
    <div class="form-item">
      <label>英文名称：</label>
      <tiny-input v-model="localValue.nameEn" placeholder="请输入模型英文名称" />
    </div>
    <div class="form-item">
      <label>版本号：</label>
      <tiny-input v-model="localValue.version" placeholder="1.0.0" />
    </div>
    <div class="form-item">
      <label>模型地址：</label>
      <tiny-input v-model="localValue.modelUrl" placeholder="请输入模型地址，如：https://api.example.com/model" />
    </div>
    <div class="form-item">
      <label>描述：</label>
      <tiny-input type="textarea" :rows="3" v-model="localValue.description" placeholder="请输入模型描述" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { TinyInput } from '@opentiny/vue'

const props = defineProps({
  model: { type: Object, required: true }
})

const emit = defineEmits(['update:model'])

// 创建本地副本，避免直接修改 props
const localValue = ref({ ...props.model })

// 监听 props 变化，同步到本地
watch(
  () => props.model,
  (newModel) => {
    localValue.value = { ...newModel }
  },
  { deep: true }
)

// 监听本地值变化，同步到父组件
watch(
  localValue,
  (newValue) => {
    emit('update:model', { ...newValue })
  },
  { deep: true }
)
</script>

<style scoped>
.section {
  margin-bottom: 16px;
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
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
