<template>
  <div>
    <div style="padding-bottom: 10px; padding-top: 10px">
      <tiny-time-line
        active="2"
        :horizontal="true"
        style="border-radius: 0px"
        :data="[{ name: '基础配置' }, { name: '网络配置' }, { name: '高级配置' }, { name: '确认配置' }]"
      ></tiny-time-line>
    </div>
    <div
      style="
        border-width: 1px;
        border-style: solid;
        border-radius: 4px;
        border-color: #fff;
        padding-top: 10px;
        padding-bottom: 10px;
        padding-left: 10px;
        padding-right: 10px;
        box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 3px 0px;
        background-color: #fff;
        margin-bottom: 10px;
      "
    >
      <tiny-form
        labelWidth="80px"
        labelPosition="top"
        :inline="false"
        label-position="left "
        label-width="150px"
        style="border-radius: 0px"
      >
        <tiny-form-item label="计费模式">
          <tiny-button-group
            modelValue="1"
            :data="[
              { text: '包年/包月', value: '1' },
              { text: '按需计费', value: '2' }
            ]"
          ></tiny-button-group
        ></tiny-form-item>
        <tiny-form-item label="区域">
          <tiny-button-group
            modelValue="1"
            style="border-radius: 0px; margin-right: 10px"
            :data="[{ text: '乌兰察布二零一', value: '1' }]"
          ></tiny-button-group>
          <span style="background-color: [object Event]; color: #8a8e99; font-size: 12px"
            >温馨提示：页面左上角切换区域</span
          >
          <span style="display: block; color: #8a8e99; border-radius: 0px; font-size: 12px"
            >不同区域的云服务产品之间内网互不相通；请就近选择靠近您业务的区域，可减少网络时延，提高访问速度</span
          ></tiny-form-item
        >
        <tiny-form-item label="可用区" style="border-radius: 0px">
          <tiny-button-group
            modelValue="1"
            :data="[
              { text: '可用区1', value: '1' },
              { text: '可用区2', value: '2' },
              { text: '可用区3', value: '3' }
            ]"
          ></tiny-button-group></tiny-form-item
      ></tiny-form>
    </div>
    <div
      style="
        border-width: 1px;
        border-style: solid;
        border-radius: 4px;
        border-color: #fff;
        padding-top: 10px;
        padding-bottom: 10px;
        padding-left: 10px;
        padding-right: 10px;
        box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 3px 0px;
        background-color: #fff;
        margin-bottom: 10px;
      "
    >
      <tiny-form
        labelWidth="80px"
        labelPosition="top"
        :inline="false"
        label-position="left "
        label-width="150px"
        style="border-radius: 0px"
      >
        <tiny-form-item label="CPU架构">
          <tiny-button-group
            modelValue="1"
            :data="[
              { text: 'x86计算', value: '1' },
              { text: '鲲鹏计算', value: '2' }
            ]"
          ></tiny-button-group
        ></tiny-form-item>
        <tiny-form-item label="区域">
          <div style="display: flex; justify-content: flex-start; align-items: center">
            <div style="display: flex; align-items: center; margin-right: 10px">
              <span style="width: 80px">vCPUs</span>
              <tiny-select
                modelValue=""
                placeholder="请选择"
                :options="[
                  { value: '1', label: '黄金糕' },
                  { value: '2', label: '双皮奶' }
                ]"
              ></tiny-select>
            </div>
            <div style="display: flex; align-items: center; margin-right: 10px">
              <span style="width: 80px; border-radius: 0px">内存</span>
              <tiny-select
                modelValue=""
                placeholder="请选择"
                :options="[
                  { value: '1', label: '黄金糕' },
                  { value: '2', label: '双皮奶' }
                ]"
              ></tiny-select>
            </div>
            <div style="display: flex; align-items: center">
              <span style="width: 80px">规格名称</span>
              <tiny-search modelValue="" placeholder="输入关键词"></tiny-search>
            </div>
          </div>
          <div style="border-radius: 0px">
            <tiny-button-group
              modelValue="1"
              style="border-radius: 0px; margin-top: 12px"
              :data="[
                { text: '通用计算型', value: '1' },
                { text: '通用计算增强型', value: '2' },
                { text: '内存优化型', value: '3' },
                { text: '内存优化型', value: '4' },
                { text: '磁盘增强型', value: '5' },
                { text: '超高I/O型', value: '6' },
                { text: 'GPU加速型', value: '7' }
              ]"
            ></tiny-button-group>
            <tiny-grid
              style="margin-top: 12px; border-radius: 0px"
              :auto-resize="true"
              :editConfig="{ trigger: 'click', mode: 'cell', showStatus: true }"
              :columns="[
                { type: 'radio', width: 60 },
                { field: 'employees', title: '规格名称' },
                { field: 'created_date', title: 'vCPUs | 内存(GiB)', sortable: true },
                { field: 'city', title: 'CPU', sortable: true },
                { title: '基准 / 最大带宽	', sortable: true },
                { title: '内网收发包', sortable: true }
              ]"
              :data="[
                {
                  id: '1',
                  name: 'GFD科技有限公司',
                  city: '福州',
                  employees: 800,
                  created_date: '2014-04-30 00:56:00',
                  boole: false
                },
                {
                  id: '2',
                  name: 'WWW科技有限公司',
                  city: '深圳',
                  employees: 300,
                  created_date: '2016-07-08 12:36:22',
                  boole: true
                }
              ]"
            ></tiny-grid>
            <div style="margin-top: 12px; border-radius: 0px">
              <span style="width: 150px; display: inline-block">当前规格</span>
              <span style="font-weight: 700">通用计算型 | Si2.large.2 | 2vCPUs | 4 GiB</span>
            </div>
          </div></tiny-form-item
        ></tiny-form
      >
    </div>
    <div
      style="
        border-width: 1px;
        border-style: solid;
        border-radius: 4px;
        border-color: #fff;
        padding-top: 10px;
        padding-bottom: 10px;
        padding-left: 10px;
        padding-right: 10px;
        box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 3px 0px;
        background-color: #fff;
        margin-bottom: 10px;
      "
    >
      <tiny-form
        labelWidth="80px"
        labelPosition="top"
        :inline="false"
        label-position="left "
        label-width="150px"
        style="border-radius: 0px"
      >
        <tiny-form-item label="镜像" style="border-radius: 0px">
          <tiny-button-group
            modelValue="1"
            :data="[
              { text: '公共镜像', value: '1' },
              { text: '私有镜像', value: '2' },
              { text: '共享镜像', value: '3' }
            ]"
          ></tiny-button-group>
          <div style="display: flex; margin-top: 12px; border-radius: 0px">
            <tiny-select
              modelValue=""
              placeholder="请选择"
              style="width: 170px; margin-right: 10px"
              :options="[
                { value: '1', label: '黄金糕' },
                { value: '2', label: '双皮奶' }
              ]"
            ></tiny-select>
            <tiny-select
              modelValue=""
              placeholder="请选择"
              style="width: 340px"
              :options="[
                { value: '1', label: '黄金糕' },
                { value: '2', label: '双皮奶' }
              ]"
            ></tiny-select>
          </div>
          <div style="margin-top: 12px">
            <span style="color: #e37d29">请注意操作系统的语言类型。</span>
          </div></tiny-form-item
        ></tiny-form
      >
    </div>
    <div
      style="
        border-width: 1px;
        border-style: solid;
        border-radius: 4px;
        border-color: #fff;
        padding-top: 10px;
        padding-bottom: 10px;
        padding-left: 10px;
        padding-right: 10px;
        box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 3px 0px;
        background-color: #fff;
        margin-bottom: 10px;
      "
    >
      <tiny-form
        labelWidth="80px"
        labelPosition="top"
        :inline="false"
        label-position="left "
        label-width="150px"
        style="border-radius: 0px"
      >
        <tiny-form-item label="系统盘" style="border-radius: 0px">
          <div style="display: flex">
            <tiny-select
              modelValue=""
              placeholder="请选择"
              style="width: 200px; margin-right: 10px"
              :options="[
                { value: '1', label: '黄金糕' },
                { value: '2', label: '双皮奶' }
              ]"
            ></tiny-select>
            <tiny-input placeholder="请输入" modelValue="" style="width: 120px; margin-right: 10px"></tiny-input>
            <span style="color: #575d6c; font-size: 12px">GiB IOPS上限240，IOPS突发上限5,000</span>
          </div></tiny-form-item
        ></tiny-form
      >
      <tiny-form
        labelWidth="80px"
        labelPosition="top"
        :inline="false"
        label-position="left "
        label-width="150px"
        style="border-radius: 0px"
      >
        <tiny-form-item label="数据盘" style="border-radius: 0px">
          <div v-for="() in state.dataDisk" style="margin-top: 12px; display: flex">
            <tiny-icon-panel-mini style="margin-right: 10px; width: 16px; height: 16px"></tiny-icon-panel-mini>
            <tiny-select
              modelValue=""
              placeholder="请选择"
              style="width: 200px; margin-right: 10px"
              :options="[
                { value: '1', label: '黄金糕' },
                { value: '2', label: '双皮奶' }
              ]"
            ></tiny-select>
            <tiny-input placeholder="请输入" modelValue="" style="width: 120px; margin-right: 10px"></tiny-input>
            <span style="color: #575d6c; font-size: 12px; margin-right: 10px">GiB IOPS上限600，IOPS突发上限5,000</span>
            <tiny-input placeholder="请输入" modelValue="" style="width: 120px"></tiny-input>
          </div>
          <div style="display: flex; margin-top: 12px; border-radius: 0px">
            <tiny-icon-plus style="width: 16px; height: 16px; margin-right: 10px"></tiny-icon-plus>
            <span style="font-size: 12px; border-radius: 0px; margin-right: 10px">增加一块数据盘</span>
            <span style="color: #8a8e99; font-size: 12px">您还可以挂载 21 块磁盘（云硬盘）</span>
          </div></tiny-form-item
        ></tiny-form
      >
    </div>
    <div
      style="
        border-width: 1px;
        border-style: solid;
        border-color: #ffffff;
        padding-top: 10px;
        padding-left: 10px;
        padding-right: 10px;
        box-shadow: rgba(0, 0, 0, 0.1) 0px 1px 3px 0px;
        background-color: #fff;
        position: fixed;
        inset: auto 0% 0% 0%;
        height: 80px;
        line-height: 80px;
        border-radius: 0px;
      "
    >
      <tiny-form
        labelWidth="80px"
        labelPosition="top"
        :inline="false"
        label-position="left "
        label-width="150px"
        style="border-radius: 0px"
      ></tiny-form>
      <tiny-row style="border-radius: 0px; height: 100%">
        <tiny-col span="8">
          <tiny-row style="border-radius: 0px">
            <tiny-col span="5" style="display: flex">
              <span style="margin-right: 10px">购买量</span>
              <tiny-input placeholder="请输入" modelValue="" style="width: 120px; margin-right: 10px"></tiny-input>
              <span>台</span></tiny-col
            >
            <tiny-col span="7">
              <div>
                <span style="font-size: 12px">配置费用</span>
                <span style="padding-left: 10px; padding-right: 10px; color: #de504e">¥1.5776</span>
                <span style="font-size: 12px">/小时</span>
              </div>
              <div>
                <span style="font-size: 12px; border-radius: 0px">参考价格，具体扣费请以账单为准。</span>
                <span style="font-size: 12px; color: #344899">了解计费详情</span>
              </div></tiny-col
            ></tiny-row
          ></tiny-col
        >
        <tiny-col
          span="4"
          style="
            display: flex;
            flex-direction: row-reverse;
            border-radius: 0px;
            height: 100%;
            justify-content: flex-start;
            align-items: center;
          "
        >
          <tiny-button text="下一步: 网络配置" type="danger" style="max-width: unset"></tiny-button></tiny-col
      ></tiny-row>
    </div>
  </div>
</template>

<script setup>
import {
  Col as TinyCol,
  Search as TinySearch,
  Row as TinyRow,
  FormItem as TinyFormItem,
  Input as TinyInput,
  TimeLine as TinyTimeLine,
  Form as TinyForm,
  Grid as TinyGrid,
  Select as TinySelect,
  ButtonGroup as TinyButtonGroup
} from '@opentiny/vue'
import { IconPanelMini, IconPlus } from '@opentiny/vue-icon'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const TinyIconPanelMini = IconPanelMini()
const TinyIconPlus = IconPlus()
const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({ dataDisk: [1, 2, 3] })
wrap({ state })
</script>
<style scoped>
body {
  background-color: #eef0f5;
  margin-bottom: 80px;
}
</style>
