<template>
  <div>
    <div class="placeholder-layer" v-if="!formModel || !formModel?.id">请选择表单模型</div>
    <tiny-form v-else ref="formRef" label-width="120" label-position="left" :model="modelData" v-bind="$attrs">
      <tiny-row>
        <tiny-col :span="colNumber" v-for="(item, index) in formModel.parameters" :key="index">
          <tiny-form-item :prop="item.prop">
            <template #label>
              <div class="custom-label" v-auto-tip>
                {{ item.label }}
              </div>
            </template>
            <div v-if="item.isModel && item.defaultValue !== null">
              <tiny-form label-width="100" label-position="left" :model="modelData[item.prop]">
                <tiny-row>
                  <tiny-col
                    :span="insideColNumber"
                    v-for="(insideItem, insideIndex) in item.defaultValue"
                    :key="insideIndex"
                  >
                    <tiny-form-item :prop="insideItem.prop">
                      <template #label>
                        <div class="custom-label" v-auto-tip>
                          {{ insideItem.label }}
                        </div>
                      </template>
                      <component
                        :is="componentsMap[insideItem.component]"
                        v-model="modelData[item.prop][insideItem.prop]"
                        :disabled="viewOnly"
                        v-bind="insideItem"
                      ></component>
                    </tiny-form-item>
                  </tiny-col>
                </tiny-row>
              </tiny-form>
            </div>
            <component
              v-else
              :is="componentsMap[item.component]"
              v-model="modelData[item.prop]"
              :disabled="viewOnly"
              v-bind="item"
            ></component>
          </tiny-form-item>
        </tiny-col>
      </tiny-row>
    </tiny-form>
  </div>
</template>
<script setup>
import { ref, defineProps, defineExpose, computed, watch, reactive } from 'vue'
import {
  Form as TinyForm,
  FormItem as TinyFormItem,
  Input as TinyInput,
  Select as TinySelect,
  Checkbox as TinyCheckbox,
  Radio as TinyRadio,
  DatePicker as TinyDatePicker,
  Numeric as TinyNumeric,
  Row as TinyRow,
  Col as TinyCol
} from '@opentiny/vue'
import axios from 'axios'

const props = defineProps({
  style: {
    type: String
  },
  className: {
    type: String
  },
  layout: {
    type: Number,
    default: 2
  },
  viewOnly: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: Object
  },
  serviceModel: {
    type: Object
  },
  modelApis: {
    type: Array,
    default: () => []
  }
})

const modelData = ref()

const formRef = ref(null)

const colNumber = computed(() => 12 / props.layout)

const insideColNumber = computed(() => (props.layout === 1 ? 6 : 12))

const formModel = computed(() => props.serviceModel)

const componentsMap = reactive({
  TinyInput,
  TinySelect,
  TinyCheckbox,
  TinyRadio,
  TinyDatePicker,
  TinyNumeric
})

const insertApi = (data = modelData.value) => {
  const apiInfo = props.modelApis.find((api) => api.nameEn === 'insertApi')
  if (!apiInfo) {
    return undefined
  }
  return axios[apiInfo.method](apiInfo.url, data)
    .then((res) => {
      if (res.status === 200) {
        return res.data
      } else {
        throw new Error('request fail')
      }
    })
    .catch((err) => {
      throw new Error(err)
    })
}

const updateApi = (data = modelData.value) => {
  const apiInfo = props.modelApis.find((api) => api.nameEn === 'updateApi')
  if (!apiInfo) {
    return undefined
  }
  return axios[apiInfo.method](apiInfo.url, data)
    .then((res) => {
      if (res.status === 200) {
        return res.data
      } else {
        throw new Error('request fail')
      }
    })
    .catch((err) => {
      throw new Error(err)
    })
}

const queryApi = ({ currentPage, pageSize, data } = {}) => {
  const apiInfo = props.modelApis.find((api) => api.nameEn === 'queryApi')
  if (!apiInfo) {
    return undefined
  }
  return axios[apiInfo.method](`${apiInfo.url}?currentPage=${currentPage || 1}&pageSize=${pageSize || 10}`, {
    params: data || modelData.value
  })
    .then((res) => {
      if (res.status === 200) {
        return res.data
      }
      throw new Error('request fail')
    })
    .catch((err) => {
      throw new Error(err)
    })
}

const deleteApi = (evidence = { id: modelData.value?.id }) => {
  const apiInfo = props.modelApis.find((api) => api.nameEn === 'deleteApi')
  if (!apiInfo) {
    return undefined
  }
  return axios[apiInfo.method](apiInfo.url, { params: evidence })
    .then((res) => {
      if (res.status === 200) {
        return res.data
      } else {
        throw new Error('request fail')
      }
    })
    .catch((err) => {
      throw new Error(err)
    })
}

const initFormData = () => {
  modelData.value = Object.fromEntries(
    (formModel.value.parameters || []).map((item) => {
      return [
        item.prop,
        item?.isModel
          ? Object.fromEntries(
              item.defaultValue.map((insideItem) => [insideItem.prop, insideItem.defaultValue || null])
            )
          : item.defaultValue || null
      ]
    })
  )
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      modelData.value = props.modelValue
    }
  },
  { deep: true, immediate: true }
)

watch(
  () => props.serviceModel,
  () => {
    if (!modelData.value) {
      initFormData()
    }
  },
  { immediate: true }
)

const exposedData = {
  formData: () => modelData.value,
  formRef,
  insertApi,
  updateApi,
  queryApi,
  deleteApi
}

defineExpose({
  ...exposedData
})
</script>
<style lang="less" scoped>
.placeholder-layer {
  height: 40px;
  background-color: #f5f5f5;
  width: 100%;
  text-align: center;
  line-height: 40px;
}
</style>
