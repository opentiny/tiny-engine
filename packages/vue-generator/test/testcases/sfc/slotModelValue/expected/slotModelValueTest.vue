<template>
  <div>
    <div>
      <tiny-grid
        :editConfig="{ trigger: 'click', mode: 'cell', showStatus: true }"
        :columns="state.columns"
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
    </div>
  </div>
</template>

<script setup lang="jsx">
import { Grid as TinyGrid, Numeric as TinyNumeric, Input as TinyInput } from '@opentiny/vue'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({
  columns: [
    { type: 'index', width: 60 },
    { type: 'selection', width: 60 },
    {
      field: 'employees',
      title: '员工数',
      slots: {
        default: ({ row, column, rowIndex }, h) => (
          <div>
            <TinyNumeric
              allow-empty={true}
              placeholder="请输入"
              controlsPosition="right"
              step={1}
              modelValue={row.employees}
              onChange={(...eventArgs) => onChangeNumber(eventArgs, row, column, rowIndex)}
              onUpdate:modelValue={(value) => (row.employees = value)}
            ></TinyNumeric>
          </div>
        )
      }
    },
    { field: 'created_date', title: '创建日期' },
    {
      field: 'city',
      title: '城市',
      slots: {
        default: ({ row, column, rowIndex }, h) => (
          <div>
            <TinyInput
              placeholder="请输入"
              modelValue={row.city}
              onChange={(...eventArgs) => onChangeInput(eventArgs, row, column, rowIndex)}
              onUpdate:modelValue={(value) => (row.city = value)}
            ></TinyInput>
          </div>
        )
      }
    }
  ]
})
wrap({ state })

const onChangeInput = wrap(function onChangeInput(eventArgs, args0, args1, args2) {
  console.log('onChangeInput', eventArgs)
})
const onChangeNumber = wrap(function onChangeNumber(eventArgs, args0, args1, args2) {
  console.log('onChangeNumber', eventArgs)
})

wrap({ onChangeInput, onChangeNumber })
</script>
<style scoped></style>
