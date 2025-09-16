<template>
  <div>
    <div class="placeholder-layer" v-if="!TableModel || !TableModel?.id">请选择表格模型</div>
    <template v-else>
      <tiny-grid ref="gridRef" :data="tableData" v-bind="gridState">
        <tiny-grid-column v-if="gridState.selectedEnabled" type="selection" width="60"></tiny-grid-column>
        <tiny-grid-column
          v-for="item in gridColumns"
          :key="item.prop"
          :field="item.prop"
          :title="item.label"
          :editor="item.editor"
        ></tiny-grid-column>

        <tiny-grid-column v-if="gridState.rowOperationEnabled" field="operation" title="操作">
          <template #default="data">
            <tiny-button
              v-for="operate in rowOperationList"
              :key="operate.label"
              type="text"
              @click="operate?.handler(data.row, data.rowIndex, exposedData)"
            >
              <div v-if="operate.itemVisible">
                <tiny-popover
                  v-if="gridState.useIconOperation && operate.icon"
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
              </div>
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
    </template>
  </div>
</template>
<script setup>
import { defineProps, defineExpose, computed, ref, reactive, useAttrs } from 'vue'
import {
  Grid as TinyGrid,
  GridColumn as TinyGridColumn,
  Button as TinyButton,
  Input as TinyInput,
  Select as TinySelect,
  Checkbox as TinyCheckbox,
  Radio as TinyRadio,
  DatePicker as TinyDatePicker,
  Numeric as TinyNumeric,
  Pager as TinyPager,
  Popover as TinyPopover
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
  viewOnly: {
    type: Boolean,
    default: false
  },
  pager: {
    type: Object
  },
  modelValue: {
    type: Array,
    default: () => []
  },
  serviceModel: {
    type: Object
  },
  nodeType: {
    type: String
  },
  rowOperations: {
    type: Object
  },
  modelApis: {
    type: Array,
    default: () => []
  }
})

const attrs = useAttrs()

const gridRef = ref()

const TableModel = computed(() => props.serviceModel)

const tableData = ref(props.modelValue)

const componentsMap = reactive({
  TinyInput,
  TinySelect,
  TinyCheckbox,
  TinyRadio,
  TinyDatePicker,
  TinyNumeric
})

const gridState = computed(() => {
  const state = { ...attrs }
  if (attrs.rowOperationEnabled) {
    state.editConfig = { trigger: 'manual', mode: 'row', autoClear: false }
  }
  return state
})

const gridColumns = computed(() => {
  return (props.serviceModel?.parameters || []).map((column) => {
    const columnData = { ...column }
    if (attrs.rowOperationEnabled) {
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

const rowOperationList = computed(() => {
  return props.rowOperations?.value.map((operate) => {
    return {
      ...operate,
      icon: operate.icon ? tinyVueIcon?.[operate.icon]() : '',
      itemVisible: 'itemVisible' in operate ? operate.itemVisible : true
    }
  })
})

const pageChange = (curPage) => {
  pagerState.currentPage = curPage
}

const pageSizeChange = (pageSize) => {
  pagerState.pageSize = pageSize
}

const insertApi = (data = {}) => {
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

const updateApi = (data) => {
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

const queryApi = (
  { currentPage, pageSize, data } = { currentPage: pagerState.currentPage, pageSize: pagerState.pageSize }
) => {
  const apiInfo = props.modelApis.find((api) => api.nameEn === 'queryApi')
  if (!apiInfo) {
    return undefined
  }
  return axios[apiInfo.method](`${apiInfo.url}?currentPage=${currentPage}&pageSize=${pageSize}`, { params: data })
    .then((res) => {
      if (res.status === 200) {
        if (res.data.code === 200) {
          tableData.value = res.data.data
          pagerState.total = res.data.total
          return res.data
        }
      }
      throw new Error('request fail')
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

const exposedData = {
  tableData: () => tableData.value,
  gridRef,
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
:deep(.tiny-button.tiny-button--text.tiny-button) {
  min-width: 20px;
  padding: 0;
}
</style>
