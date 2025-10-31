import React from 'react'
import './FormTable.css'
import { TinyButton, TinyForm, TinyFormItem, TinyInput, TinySelect, TinyGrid } from '@opentiny/react'
import { TinyIconHelpCircle } from '@opentiny/react-icon'
import ImageTitle from '../../components/ImageTitle'
import { useTranslation } from 'react-i18next'

const FormTable = (props = {}) => {
  const [state, setState] = React.useState({
    IconPlusSquare: this.utils.IconPlusSquare(),
    theme: '{   "id": 22,   "name": "@cloud/tinybuilder-theme-dark",   "description": "黑暗主题" }',
    companyName: '华为云',
    companyOptions: null,
    companyCity: '深圳',
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
            component: this.utils.Numeric,
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
        slots: { default: '' }
      },
      { type: 'index', width: 60 },
      { type: 'selection', width: 60 },
      { field: 'name', title: '公司名称' },
      { field: 'employees', title: '员工数' },
      { field: 'city', title: '城市' },
      { title: '操作', slots: { default: '' } }
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
    status: this.statusData,
    buttons: [
      { type: 'primary', text: '主要操作' },
      { type: 'success', text: '成功操作' },
      { type: 'danger', text: t('operation.danger') }
    ]
  })

  const utils = {}

  const { t } = useTranslation()

  const getTableData = ({ page, filterArgs }) => {
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
  }
  const handleSearch = (e) => {
    return ['搜索:', this.i18n('operation.search'), e]
  }
  const handleReset = (e) => {
    return ['重置:', e]
  }
  const statusData = () => {
    return [
      { name: this.i18n('quotes.common.configure_basic_information'), status: 'ready' },
      { name: this.i18n('quotes.quote_list.quote'), status: 'wait' },
      { name: this.i18n('quotes.common.complete_configuration_quote'), status: 'wait' }
    ]
  }

  return (
    <>
      <div>
        <span style="background: url('**/public/logo.png');" className="page-header">
          标题区
        </span>
        <span style="background: url('**/public/background.png');">副标题区</span>
        <ImageTitle
          className={['basic-info', { 'form-fixed-layout': props.isFixed }, { 'form-auto-layout': props.isAuto }]}
          hasSplitLine={false}
          onClickLogo={(...eventArgs) => handleReset(eventArgs, state.flag)}
        ></ImageTitle>
        <TinyForm inline={true} style={state.style} className="form">
          <TinyFormItem>
            <TinyInput
              disabled={false}
              value={state.companyName}
              onChange={(e) => setState((prev) => ({ ...prev, companyName: e.target.value }))}
            ></TinyInput>
          </TinyFormItem>
          {state.cityOptions.length ? (
            <TinyFormItem>
              <TinySelect
                value={state.companyCity}
                options={[
                  { label: t('city.foochow'), value: 0 },
                  { label: "深'i'圳", value: 1 },
                  { label: '中山', value: 2 },
                  { label: '龙岩', value: 3 },
                  { label: '韶关', value: 4 },
                  { label: '黄冈', value: 5 },
                  { label: '赤壁', value: 6 },
                  { label: '厦门', value: 7 }
                ]}
              ></TinySelect>
            </TinyFormItem>
          ) : null}
          <TinyFormItem>
            <span className="form-footer">表单提交区</span>
            <TinyButton type="primary" onClick={handleSearch}>
              搜索
            </TinyButton>
            <TinyButton onClick={handleReset}>{t('operation.reset')}</TinyButton>
          </TinyFormItem>
        </TinyForm>
        <div>
          <TinyGrid columns={state.columns} fetchData={{ api: getTableData }}></TinyGrid>
        </div>
        <div>
          <TinyGrid columns={state.columns1} fetchData={{ api: getTableData }}></TinyGrid>
        </div>
        <div style={{ width: this.props.quotePopWidth }}>循环渲染：</div>
        {false ? <TinyIconHelpCircle></TinyIconHelpCircle> : null}
        <div>
          {state.buttons.map((item, index) => (
            <TinyButton key={item.text} type={item.type} text={index + item.text}></TinyButton>
          ))}{' '}
        </div>
        <br />
        <div>
          {[
            { type: 'primary', text: '字面量' },
            { type: 'success', text: '字面量' },
            { type: 'danger', text: '危险操作' }
          ].map((item) => (
            <TinyButton key={item.text} type={item.type} text={item.text}></TinyButton>
          ))}{' '}
        </div>
      </div>
    </>
  )
}

export default FormTable
