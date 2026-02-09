<template>
  <div>
    <div class="placeholder-layer" v-if="!pageModel || !pageModel?.id">请选择模型</div>
    <div v-else>
      <tiny-form
        ref="formRef"
        label-width="120px"
        label-position="left"
        :model="formData"
        :layout="pageState?.layout"
        :size="pageState?.size"
      >
        <tiny-row>
          <tiny-col :span="colNumber" v-for="(item, index) in pageModel?.parameters" :key="index">
            <tiny-form-item :prop="item.prop">
              <template #label>
                <div class="custom-label" v-auto-tip>
                  {{ item.label }}
                </div>
              </template>
              <div v-if="item?.isModel && item.defaultValue !== null">
                <tiny-form label-width="100" label-position="left" :model="formData[item.prop]">
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
                          v-model="formData[item.prop][insideItem.prop]"
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
                v-model="formData[item.prop]"
                :disabled="viewOnly"
                v-bind="item"
                label=""
              ></component>
            </tiny-form-item>
          </tiny-col>
        </tiny-row>
      </tiny-form>
      <div class="operator-group">
        <tiny-button type="primary" :size="pageState?.size" @click="addRow"> 新增 </tiny-button>
        <tiny-button :size="pageState?.size" @click="search"> 搜索 </tiny-button>
        <tiny-button :size="pageState?.size" @click="resetSearchForm"> 重置 </tiny-button>
      </div>
      <tiny-grid ref="gridRef" :data="tableData" v-bind="pageState">
        <tiny-grid-column v-if="pageState.selectedEnabled" type="selection" width="60"></tiny-grid-column>
        <template v-for="item in gridColumns" :key="item.prop">
          <tiny-grid-column :field="item.prop" :title="item.label" :editor="item.editor"></tiny-grid-column>
        </template>
        <tiny-grid-column v-if="pageState.rowOperationEnabled" field="operation" title="操作">
          <template #default="data">
            <tiny-button
              v-for="operate in rowOperationList"
              :key="operate.label"
              type="text"
              @click="operate?.handler(data.row, data.rowIndex)"
            >
              <tiny-popover
                v-if="pageState.useIconOperation && operate.icon"
                width="auto"
                trigger="hover"
                placement="top"
                :content="operate.label"
              >
                <template #reference>
                  <component :is="operate.icon" class="tiny-svg-size"></component>
                </template>
              </tiny-popover>
              <span v-else>{{ operate.label }}</span>
            </tiny-button>
          </template>
        </tiny-grid-column>
      </tiny-grid>
      <tiny-pager
        v-if="pagerState.total > pagerState.pageSize"
        v-bind="pagerState"
        @current-change="pageChange"
        @size-change="pageSizeChange"
      ></tiny-pager>
      <tiny-dialog-box v-model:visible="boxVisibility" :title="isEdit ? '编辑' : '新增'" width="70%">
        <tiny-form
          label-width="100px"
          label-position="left"
          :model="addFormData"
          :layout="pageState?.layout"
          :size="pageState?.size"
        >
          <tiny-row>
            <tiny-col :span="colNumber" v-for="(item, index) in pageModel?.parameters" :key="index">
              <tiny-form-item :prop="item.prop">
                <template #label>
                  <div class="custom-label" v-auto-tip>
                    {{ item.label }}
                  </div>
                </template>
                <div v-if="item?.isModel && item.defaultValue !== null">
                  <tiny-form label-width="100" label-position="left" :model="addFormData[item.prop]">
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
                            v-model="addFormData[item.prop][insideItem.prop]"
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
                  v-model="addFormData[item.prop]"
                  :disabled="viewOnly"
                  v-bind="item"
                  label=""
                ></component>
              </tiny-form-item>
            </tiny-col>
          </tiny-row>
        </tiny-form>
        <template #footer>
          <tiny-button @click="closeDialogBox" round> 取 消 </tiny-button>
          <tiny-button type="primary" @click="confirmSubmit" round> 确 定 </tiny-button>
        </template>
      </tiny-dialog-box>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, reactive, watch, useAttrs, onMounted } from 'vue'
import {
  Form as TinyForm,
  FormItem as TinyFormItem,
  Button as TinyButton,
  Input as TinyInput,
  Select as TinySelect,
  Checkbox as TinyCheckbox,
  Radio as TinyRadio,
  DatePicker as TinyDatePicker,
  Numeric as TinyNumeric,
  Row as TinyRow,
  Col as TinyCol,
  Pager as TinyPager,
  Popover as TinyPopover,
  Grid as TinyGrid,
  GridColumn as TinyGridColumn,
  DialogBox as TinyDialogBox,
  Modal,
  Notify
} from '@opentiny/vue'
import * as tinyVueIcon from '@opentiny/vue-icon'
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
  pager: {
    type: Object
  },
  viewOnly: {
    type: Boolean,
    default: false
  },
  searchFormData: {
    type: Object
  },
  editFormData: {
    type: Object
  },
  tableData: {
    type: Array,
    default: () => []
  },
  serviceModel: {
    type: Object
  },
  modelApis: {
    type: Array,
    default: () => []
  },
  rowOperations: {
    type: Object
  }
})
const emit = defineEmits(['update:searchFormData', 'update:tableData', 'update:editFormData'])

const formRef = ref(null)

const colNumber = computed(() => 12 / props.layout)

const insideColNumber = computed(() => (props.layout === 1 ? 6 : 12))

const pageModel = computed(() => props.serviceModel)

const formData = ref()

const addFormData = ref()

const boxVisibility = ref(false)

const isEdit = ref(false)

const tableData = ref(props.tableData)

const attrs = useAttrs()

const gridRef = ref()

const componentsMap = reactive({
  TinyInput: TinyInput,
  TinySelect: TinySelect,
  TinyCheckbox: TinyCheckbox,
  TinyRadio: TinyRadio,
  TinyDatePicker: TinyDatePicker,
  TinyNumeric: TinyNumeric
})

const pageState = computed(() => {
  const state = { ...attrs }
  return state
})

const gridColumns = computed(() => {
  return (props.serviceModel?.parameters || []).map((column) => {
    const columnData = { ...column }
    if (pageState.value.rowOperationEnabled) {
      columnData.editor = {
        component: componentsMap[column.component],
        attrs: column
      }
    }
    return columnData
  })
})

const pagerState = reactive(
  props.pager || {
    currentPage: 1,
    pageSize: 10,
    pageSizes: [5, 10, 20, 50],
    total: 0,
    layout: 'total, sizes, prev, pager, next, jumper'
  }
)

const pageChange = (curPage) => {
  pagerState.currentPage = curPage
}

const pageSizeChange = (pageSize) => {
  pagerState.pageSize = pageSize
}

const openDialogBox = () => {
  boxVisibility.value = true
}

const closeDialogBox = () => {
  boxVisibility.value = false
}

const insertApi = (data = addFormData.value) => {
  const apiInfo = props.modelApis.find((api) => api.nameEn === 'insertApi')
  if (!apiInfo) {
    return undefined
  }
  return axios
    .post(apiInfo.url, { nameEn: pageModel.value.nameEn, params: data })
    .then((res) => {
      if (res.data.error) {
        Notify({
          type: 'error',
          message: res.data.error.message,
          position: 'top-right'
        })
        return
      }
      Notify({
        type: 'success',
        message: '新增成功',
        position: 'top-right'
      })
      return res
    })
    .catch((err) => {
      throw new Error(err)
    })
}

const updateApi = (data = addFormData.value) => {
  const apiInfo = props.modelApis.find((api) => api.nameEn === 'updateApi')
  if (!apiInfo) {
    return undefined
  }
  const requestData = {}
  pageModel.value.parameters.forEach((item) => {
    if (data[item.prop]) {
      requestData[item.prop] = data[item.prop]
    }
  })
  return axios
    .post(apiInfo.url, {
      nameEn: pageModel.value.nameEn,
      data: requestData,
      params: { id: data.id }
    })
    .then((res) => {
      if (res.data.error) {
        Notify({
          type: 'error',
          message: res.data.error.message,
          position: 'top-right'
        })
        return
      }
      Notify({
        type: 'success',
        message: '修改成功',
        position: 'top-right'
      })
      return res
    })
    .catch((err) => {
      throw new Error(err)
    })
}

const queryApi = (data = formData.value) => {
  const apiInfo = props.modelApis.find((api) => api.nameEn === 'queryApi')
  if (!apiInfo) {
    return undefined
  }
  // 处理查询参数
  const params = Object.fromEntries(pageModel.value.parameters.map((item) => [item.prop, null]))
  return axios
    .post(apiInfo.url, {
      currentPage: pagerState.currentPage || 1,
      pageSize: pagerState.pageSize || 10,
      nameEn: pageModel.value.nameEn,
      nameCn: pageModel.value.nameCn,
      params: {
        ...params,
        ...data
      }
    })
    .then((res) => {
      if (res.data.error) {
        Notify({
          type: 'error',
          message: res.data.error.message,
          position: 'top-right'
        })
        return
      }
      tableData.value = res.data.data.list
      pagerState.total = res.data.data.total
      emit('update:tableData', tableData.value)
      return res
    })
    .catch((err) => {
      throw new Error(err)
    })
}

const deleteApi = (evidence) => {
  const apiInfo = props.modelApis.find((api) => api.nameEn === 'deleteApi')
  if (!apiInfo) {
    return undefined
  }
  return axios
    .post(apiInfo.url, { ...evidence, nameEn: pageModel.value.nameEn })
    .then((res) => {
      if (res.data.error) {
        Notify({
          type: 'error',
          message: res.data.error.message,
          position: 'top-right'
        })
        return
      }
      Notify({
        type: 'success',
        message: '已删除',
        position: 'top-right'
      })
      queryApi()
      return res
    })
    .catch((err) => {
      throw new Error(err)
    })
}

const confirmSubmit = async () => {
  if (isEdit.value) {
    await updateApi()
  } else {
    await insertApi()
  }
  await queryApi()
  closeDialogBox()
}

const search = () => {
  queryApi()
}

const initSearchFormData = () => {
  formData.value = Object.fromEntries(
    (pageModel.value?.parameters || []).map((item) => {
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
  emit('update:searchFormData', formData.value)
}

const initEditFormData = () => {
  addFormData.value = Object.fromEntries(
    (pageModel.value?.parameters || []).map((item) => {
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
  emit('update:editFormData', addFormData.value)
}

const resetSearchForm = () => {
  initSearchFormData()
  queryApi()
}

const addRow = () => {
  initEditFormData()
  isEdit.value = false
  openDialogBox()
}

const editRow = (rowData) => {
  addFormData.value = { ...rowData }
  emit('update:editFormData', addFormData.value)
  isEdit.value = true
  openDialogBox()
}

const deleteRow = (rowData) => {
  const evidence = { id: rowData.id }
  Modal.confirm('您确定要删除吗？').then(() => {
    deleteApi(evidence)
  })
}

const rowOperationList = computed(() => {
  return (props.rowOperations?.value || []).map((operate) => {
    if (operate.builtIn && operate.label === '编辑') {
      operate.handler = operate.handler ?? editRow
    }
    if (operate.builtIn && operate.label === '删除') {
      operate.handler = operate.handler ?? deleteRow
    }
    return {
      ...operate,
      icon: operate.icon ? tinyVueIcon?.[operate.icon]() : ''
    }
  })
})

watch(
  () => props.searchFormData,
  (value) => {
    if (value) {
      formData.value = props.searchFormData
    }
  },
  { deep: true, immediate: true }
)

watch(
  () => props.editFormData,
  (value) => {
    if (value) {
      addFormData.value = props.editFormData
    }
  },
  { deep: true, immediate: true }
)

watch(
  () => props.serviceModel,
  () => {
    if (!formData.value) {
      initSearchFormData()
    }
    if (!addFormData.value) {
      initEditFormData()
    }
  },
  { immediate: true }
)

onMounted(() => {
  queryApi()
})

const exposedData = {
  tableData: () => tableData.value,
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

.operator-group {
  margin-bottom: 10px;
}
</style>
