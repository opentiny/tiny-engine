<template>
  <div>
    <span style="background: url('**/public/logo.png')" class="page-header">标题区</span>
    <span style="background: url('**/public/background.png')">副标题区</span>
    <image-title
      text="配置报价"
      :hasSplitLine="false"
      :class="['basic-info', { 'form-fixed-layout': isFixed }, { 'form-auto-layout': isAuto }]"
      @click-logo="(...eventArgs) => handleReset(eventArgs, state.flag)"
    ></image-title>
    <tiny-form :inline="true" class="form" :style="{ margin: '12px' }">
      <tiny-form-item :label="t('company.name')">
        <tiny-input :disabled="false" :value="state.companyName"></tiny-input
      ></tiny-form-item>
      <tiny-form-item v-if="state.cityOptions.length">
        <template #label>城市</template>
        <tiny-select
          :value="state.companyCity"
          :options="[
            { label: t('city.foochow'), value: 0 },
            { label: '深\'i\'圳', value: 1 },
            { label: '中山', value: 2 },
            { label: '龙岩', value: 3 },
            { label: '韶关', value: 4 },
            { label: '黄冈', value: 5 },
            { label: '赤壁', value: 6 },
            { label: '厦门', value: 7 }
          ]"
        ></tiny-select
      ></tiny-form-item>
      <tiny-form-item>
        <span class="form-footer">表单提交区</span>
        <tiny-button type="primary" :icon="TinyIconSearch" @click="handleSearch">搜索</tiny-button>
        <tiny-button @click="handleReset">{{ t('operation.reset') }}</tiny-button></tiny-form-item
      ></tiny-form
    >
    <div dataSource="a5f6ef4f">
      <tiny-grid :columns="state.columns" :fetchData="{ api: getTableData }"></tiny-grid>
    </div>
    <div dataSource="a5f6ef4f">
      <tiny-grid :fetchData="{ api: getTableData }" :columns="state.columns6cio"></tiny-grid>
    </div>
    <div :style="{ width: props.quotePopWidth }">循环渲染：</div>
    <tiny-icon-help-circle v-if="false"></tiny-icon-help-circle>

    <tiny-button
      v-for="(item, index) in state.buttons"
      :key="item.text"
      :type="item.type"
      :text="index + item.text"
    ></tiny-button>
    <br />

    <tiny-button
      v-for="item in [
        { type: 'primary', text: '字面量' },
        { type: 'success', text: '字面量' },
        { type: 'danger', text: '危险操作' }
      ]"
      :key="item.text"
      :type="item.type"
      :text="item.text"
    ></tiny-button>
  </div>
</template>

<script setup lang="jsx">
import {
  Button as TinyButton,
  Form as TinyForm,
  FormItem as TinyFormItem,
  Grid as TinyGrid,
  Input as TinyInput,
  Select as TinySelect,
  Switch as TinySwitch
} from '@opentiny/vue'
import { IconSearch, IconDel, iconHelpCircle, IconEdit } from '@opentiny/vue-icon'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'
import CrmQuoteListGridStatus from '../components/CrmQuoteListGridStatus.vue'

import ImageTitle from '../components/ImageTitle.vue'

const TinyIconSearch = IconSearch()
const TinyIconDel = IconDel()
const TinyIconHelpCircle = iconHelpCircle()
const TinyIconEdit = IconEdit()
const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const { utils } = wrap(function () {
  return this
})()
const state = vue.reactive({
  columns6cio: [
    { type: 'index', width: 60, title: '' },
    { type: 'selection', width: 60 },
    { field: 'employees', title: '员工数', slots: { default: ({ row, rowIndex }, h) => <TinyInput></TinyInput> } },
    { field: 'city', title: '城市' },
    {
      title: '产品',
      slots: {
        default: ({ row }, h) => (
          <div>
            <TinySwitch modelValue=""></TinySwitch>
          </div>
        )
      }
    },
    {
      title: '操作',
      slots: {
        default: ({ row }, h) => (
          <TinyButton text="删除" icon={TinyIconDel} onClick={(...eventArgs) => emit(eventArgs, row)}></TinyButton>
        )
      }
    }
  ],
  IconPlusSquare: utils.IconPlusSquare(),
  theme: "{   'id': 22,   'name': '@cloud/tinybuilder-theme-dark',   'description': '黑暗主题' }",
  companyName: '',
  companyOptions: null,
  companyCity: '',
  cityOptions: [
    { label: '福州', value: 0 },
    { label: '深圳', value: 1 },
    { label: '中山', value: 2 },
    { label: '龙岩', value: 3 },
    { label: '韶关', value: 4 },
    { label: '黄冈', value: 5 },
    { label: '赤壁', value: 6 },
    { label: '厦门', value: 7 }
  ],
  editConfig: {
    trigger: 'click',
    mode: 'cell',
    showStatus: true,
    activeMethod: () => {
      return props.isEdit
    }
  },
  columns: [
    { type: props.isEdit ? 'selection' : 'index', width: '60', title: props.isEdit ? '' : '序号' },
    {
      field: 'status',
      title: '状态',
      filter: {
        layout: 'input,enum,default,extends,base',
        inputFilter: {
          component: utils.Numeric,
          attrs: { format: 'yyyy/MM/dd hh:mm:ss' },
          relation: 'A',
          relations: [
            {
              label: '小于',
              value: 'A',
              method: ({ value, input }) => {
                return value < input
              }
            },
            { label: '等于', value: 'equals' },
            { label: '大于', value: 'greaterThan' }
          ]
        },
        extends: [
          {
            label: '我要过滤大于800的数',
            method: ({ value }) => {
              return value > 800
            }
          },
          {
            label: '我要过滤全部的数',
            method: () => {
              return true
            }
          }
        ]
      },
      slots: {
        default: ({ row }, h) => (
          <div>
            <TinyIconEdit></TinyIconEdit>
            {props.isEdit && (
              <CrmQuoteListGridStatus isEdit={props.isEdit} status={row.status}></CrmQuoteListGridStatus>
            )}
          </div>
        )
      }
    },
    { type: 'index', width: 60 },
    { type: 'selection', width: 60 },
    { field: 'name', title: '公司名称' },
    { field: 'employees', title: '员工数' },
    { field: 'city', title: '城市' },
    {
      title: '操作',
      slots: {
        default: ({ row }, h) => (
          <div
            style="color: rgb(94,124, 224);cursor:pointer;"
            visible={true}
            text={t('operation.delete')}
            prop1={{ a: 123 }}
            onClick={emit}
          >
            <TinyInput value={row.giveamount}></TinyInput>
            {state.cityOptions.length && <span>{t('operation.hello')}</span>}
            <TinyIconHelpCircle style="margin-left: 6px; cursor: pointer;vertical-align: top;"></TinyIconHelpCircle>
          </div>
        )
      }
    }
  ],
  tableData: [
    { id: '1', name: 'GFD科技有限公司', city: '福州', employees: 800, boole: false },
    { id: '2', name: 'WWW科技有限公司', city: '深圳', employees: 300, boole: true },
    { id: '3', name: 'RFV有限责任公司', city: '中山', employees: 1300, boole: false },
    { id: '4', name: 'TGB科技有限公司', city: '龙岩', employees: 360, boole: true },
    { id: '5', name: 'YHN科技有限公司', city: '韶关', employees: 810, boole: true },
    { id: '6', name: 'WSX科技有限公司', city: '黄冈', employees: 800, boole: true },
    { id: '7', name: 'KBG物业有限公司', city: '赤壁', employees: 400, boole: false },
    { id: '8', name: '深圳市福德宝网络技术有限公司', boole: true, city: '厦门', employees: 540 }
  ],
  status: vue.computed(statusData),
  buttons: [
    { type: 'primary', text: '主要操作' },
    { type: 'success', text: '成功操作' },
    { type: 'danger', text: t('operation.danger') }
  ]
})
wrap({ state })

const getTableData = wrap(function getData({ page, filterArgs }) {
  const { curPage, pageSize } = page
  const offset = (curPage - 1) * pageSize

  return new Promise((resolve) => {
    setTimeout(() => {
      const { tableData } = this.state
      let result = [...tableData]

      if (filterArgs) {
        result = result.filter((item) => item.city === filterArgs)
      }

      const total = result.length
      result = result.slice(offset, offset + pageSize)

      resolve({ result, page: { total } })
    }, 500)
  })
})
const handleSearch = wrap(function (e) {
  return ['搜索:', this.i18n('operation.search'), e]
})
const handleReset = wrap(function handleReset(e) {
  return ['重置:', e]
})
const statusData = wrap(function () {
  return [
    { name: this.i18n('quotes.common.configure_basic_information'), status: 'ready' },
    { name: this.i18n('quotes.quote_list.quote'), status: 'wait' },
    { name: this.i18n('quotes.common.complete_configuration_quote'), status: 'wait' }
  ]
})

wrap({ getTableData, handleSearch, handleReset, statusData })

const setup = wrap(function ({ props, watch, onMounted }) {
  onMounted(() => {
    this.getTableDta()
  })
  watch(
    () => props.load,
    (load) => {
      if (load.isLoad) {
        this.getTableDta()
      }
    },
    {
      deep: true
    }
  )
})
setup({ props, context: { emit }, state, ...vue })
vue.onBeforeMount(
  wrap(function () {
    return '生命周期：onBeforeMount'
  })
)
vue.onMounted(
  wrap(function onMounted() {
    return '生命周期：onMounted'
  })
)
</script>
<style scoped>
.overflow-container .card {
  padding-bottom: 8px;
}
.main-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  margin: 20px 20px 9px 20px;
}
.card {
  padding: 20px 20px;
  background-color: #ffffff;
  box-shadow: 0 2px 10px 0 rgb(0 0 0 / 6%);
  border-radius: 2px;
}
.manage-list {
  margin-bottom: 60px !important;
}
.crm-title-wrapper {
  display: flex;
  justify-content: start;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}
.crm-import-button:not(:last-child) {
  margin-right: 10px;
}
</style>
