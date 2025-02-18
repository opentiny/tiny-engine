<template>
  <plugin-setting
    v-if="isOpen"
    :title="title"
    :is-second="true"
    @cancel="closeRecordFormPanel"
    @save="saveRecordListData"
  >
    <template #content>
      <div class="record-form-content">
        <slot>
          <tiny-form
            ref="recordForm"
            label-suffix="："
            label-position="top"
            :model="recordFormData"
            label-width="70px"
            :rules="state.rules"
            show-message
            hide-required-asterisk
            validate-position="top-end"
          >
            <tiny-form-item v-for="item in state.filterData" :key="item.id" :prop="item.name">
              <template #label> <span v-if="item.format?.required" class="dot-tip">*</span> {{ item.title }} </template>
              <component
                :is="state.components[item.type]"
                v-model="recordFormData[item.name]"
                :type="getRenderType(item.format)"
              />
            </tiny-form-item>
          </tiny-form>
        </slot>
        <div v-if="showFooter" class="record-form-footer">
          <tiny-button class="del" @click="$emit('delete')">
            <icon-del></icon-del>
            <span>删除</span>
          </tiny-button>
          <tiny-button @click="$emit('duplicate', recordFormData)">
            <icon-copy></icon-copy>
            <span>复制</span>
          </tiny-button>
        </div>
      </div>
    </template>
  </plugin-setting>
</template>

<script>
import { computed, reactive, ref, watch } from 'vue'
import { Button, Input, Numeric, DatePicker, Form, FormItem, Switch, Slider } from '@opentiny/vue'
import { PluginSetting } from '@opentiny/tiny-engine-common'
import { isEmptyObject } from '@opentiny/vue-renderless/common/type'
import { useDataSource } from '@opentiny/tiny-engine-meta-register'
import { extend } from '@opentiny/vue-renderless/common/object'

const CONSTANTS = {
  REQUIRED: 'required',
  EVENT_NAME: 'change',
  REQUIRED_TIP: '必填',
  MIN_VALUE_TIP: '不能小于最小值',
  MAX_VALUE_TIP: '不能大于最大值',
  MIN: 'min',
  MAX: 'max',
  FIELD_TYPE_DATE: 'date',
  FIELD_TYPE_DATETIME: 'datetime',
  FIELD_TYPE_NUMBER: 'number',
  MIN_LENGTH_TIP: '长度不小于',
  MAX_LENGTH_TIP: '长度不大于'
}

let isOpen = ref(false)
let recordFormData = reactive({})

export const open = () => {
  isOpen.value = true
}

export const close = () => {
  isOpen.value = false
}

export const update = (initialData, formData) => {
  const { dataSourceState } = useDataSource()
  initialData.forEach((item) => {
    recordFormData[item.name] = formData[item.name] || ''
  })

  dataSourceState.recordCopies = extend(true, {}, recordFormData)
}

// TODO: not used, should delete?
export const init = (data) => {
  const { dataSourceState } = useDataSource()
  data?.forEach((item) => {
    recordFormData[item.name] = item.type === CONSTANTS.FIELD_TYPE_NUMBER ? 0 : ''
  })

  dataSourceState.recordCopies = extend(true, {}, recordFormData)
}

export default {
  components: {
    TinyButton: Button,
    TinyForm: Form,
    TinyFormItem: FormItem,
    PluginSetting
  },
  props: {
    // 面板的名称
    title: {
      type: String,
      default: '添加数据源'
    },
    // 数据源字段集合
    data: {
      type: Array,
      default: () => []
    },
    showFooter: {
      type: Boolean,
      default: false
    }
  },
  emits: ['save', 'delete', 'duplicate'],
  setup(props, { emit }) {
    const recordForm = ref('recordForm')
    const { dataSourceState } = useDataSource()

    const state = reactive({
      ...props,
      components: {
        string: Input,
        number: Numeric,
        date: DatePicker,
        switch: Switch,
        slider: Slider,
        link: Input
      },
      rules: {},
      filterData: computed(() => props.data.filter((item) => item.field !== 'id')),
      recordMapping: {}
    })

    const validateNumber = (rule, value, callback) => {
      if (rule.min > value) {
        callback(new Error(`${CONSTANTS.MIN_VALUE_TIP}${rule.min}`))
      } else if (rule.max < value) {
        callback(new Error(`${CONSTANTS.MAX_VALUE_TIP}${rule.max}`))
      } else {
        callback()
      }
    }

    watch(
      () => props.data,
      (value) => {
        value.forEach((item) => {
          const format = item.format
          const fieldRules = []

          !isEmptyObject(format) &&
            Object.keys(format).forEach((key) => {
              if (key === CONSTANTS.REQUIRED) {
                format[key] && (state.recordMapping[item.name] = format[key])

                fieldRules.push({
                  [key]: format[key],
                  message: CONSTANTS.REQUIRED_TIP,
                  trigger: CONSTANTS.EVENT_NAME
                })
              }

              if ((key === CONSTANTS.MIN && format[key] !== 0) || (key === CONSTANTS.MAX && format[key] !== 0)) {
                if (item.type === CONSTANTS.FIELD_TYPE_NUMBER) {
                  fieldRules.push({
                    [key]: format[key],
                    trigger: CONSTANTS.EVENT_NAME,
                    validator: validateNumber
                  })
                } else {
                  const str = key === CONSTANTS.MIN ? CONSTANTS.MIN_LENGTH_TIP : CONSTANTS.MAX_LENGTH_TIP
                  fieldRules.push({
                    [key]: format[key],
                    message: str + format[key],
                    trigger: CONSTANTS.EVENT_NAME
                  })
                }
              }
            })

          state.rules[item.name] = fieldRules
        })
      }
    )

    watch(
      () => recordFormData,
      (value) => {
        dataSourceState.record = value

        dataSourceState.isRecordValidate = Object.keys(state.recordMapping).every(
          (key) => state.recordMapping[key] && value[key]
        )
      },
      { deep: true }
    )

    const saveRecordListData = () => {
      recordForm.value.validate((valid) => {
        if (valid) {
          dataSourceState.record = {}
          dataSourceState.recordCopies = {}
          emit('save', { data: recordFormData })
        }
      })
    }

    const getRenderType = (format) => {
      if (!format) {
        return undefined
      }

      const { text, dateTime } = format

      if (text) {
        return text
      } else if (dateTime) {
        return dateTime ? CONSTANTS.FIELD_TYPE_DATETIME : CONSTANTS.FIELD_TYPE_DATE
      }

      return undefined
    }

    return {
      state,
      isOpen,
      recordFormData,
      closeRecordFormPanel: close,
      saveRecordListData,
      recordForm,
      getRenderType
    }
  }
}
</script>

<style lang="less" scoped>
.record-form-content {
  padding: 24px 10px 12px;
  .dot-tip {
    color: var(--te-datasource-description-text-color-error);
    margin-right: 4px;
    vertical-align: middle;
  }
  .record-form-footer {
    padding: 12px 0;
    border-top: 1px solid var(--te-datasource-tabs-border-color);
    .tiny-svg {
      margin-right: 6px;
    }

    .del:hover {
      background-color: var(--te-datasource-delete-button-bg-color-hover);
    }
  }
}
</style>
