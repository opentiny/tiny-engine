<template>
  <div v-if="state.isOpen" class="step-select-second">
    <div class="field-row">
      <slot>
        <div class="icon-and-text">
          <div class="field-cell-type">
            <icon-arrow-down></icon-arrow-down>
          </div>
          <div class="field-cell-name">
            <span>新增字段</span>
          </div>
        </div>
      </slot>
      <span v-if="editable">
        <button-group>
          <tiny-button type="text" @click.stop="saveField">保存</tiny-button>
          <svg-button class="close-plugin-setting-icon" name="close" @click.stop="handleCancel"></svg-button>
        </button-group>
      </span>
    </div>
    <div v-if="editable" class="field-content">
      <tiny-form ref="form" label-position="left" :rules="rules" :model="state.field" validate-type="text">
        <tiny-form-item class="title-content" prop="title" label="字段名称" label-width="150px">
          <meta-bind-i18n v-model="state.field.title"></meta-bind-i18n>
        </tiny-form-item>
        <tiny-form-item class="name-content" prop="name" label="字段唯一标识" label-width="150px">
          <tiny-input class="filedName" v-model="state.field.name"></tiny-input>
        </tiny-form-item>
        <!--不同的字段类型对应不同的校验规则-->
        <data-source-field-check :type="state.field.type"></data-source-field-check>
      </tiny-form>
    </div>
  </div>
</template>

<script>
import { reactive, watchEffect, ref, provide } from 'vue'
import { Button, Input, FormItem, Form } from '@opentiny/vue'
import { ButtonGroup, MetaBindI18n, SvgButton } from '@opentiny/tiny-engine-common'
import { iconArrowDown } from '@opentiny/vue-icon'
import DataSourceFieldCheck from './DataSourceFieldCheck.vue'

export const formDataInjectionSymbols = Symbol('DataSourceFieldFormData')

export default {
  components: {
    ButtonGroup,
    SvgButton,
    TinyButton: Button,
    TinyInput: Input,
    TinyForm: Form,
    TinyFormItem: FormItem,
    iconArrowDown: iconArrowDown(),
    MetaBindI18n,
    DataSourceFieldCheck
  },
  props: {
    field: {
      type: Object,
      default: () => ({})
    },
    editable: {
      type: Boolean,
      default: false
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    modelValue: {
      type: Array,
      default: () => []
    }
  },
  emits: ['save', 'cancel'],
  setup(props, { emit }) {
    const state = reactive({
      field: null,
      isOpen: null
    })

    const form = ref(null)

    watchEffect(() => {
      if (props.field) {
        state.field = { ...props.field }
      }
    })

    watchEffect(() => {
      state.isOpen = props.isOpen === undefined ? true : props.isOpen
    })

    const open = () => {
      state.isOpen = true
    }

    const close = () => {
      state.isOpen = false
    }

    const handleCancel = () => {
      emit('cancel')
    }
    const uniqueName = () => {
      return props.modelValue.some((item) => item.name === state.field.name)
    }
    const saveField = () => {
      form.value.validate((valid) => {
        if (valid) {
          state.field.field = state.field.name
          emit('save', state.field)
        }
      })
    }

    provide(formDataInjectionSymbols, state.field)

    const validateIsReserveValue = (rule, value, callback) => {
      if (value === '_id') {
        callback(new Error('_id 是保留字段，不允许添加'))

        return
      }
      if (uniqueName() && rule.field === 'name') {
        callback(new Error('该字段已存在，请重新输入'))
        return
      }
      callback()
    }

    return {
      state,
      handleCancel,
      saveField,
      open,
      close,
      form,
      rules: {
        title: [{ required: true, message: '必填', trigger: 'change' }, { validator: validateIsReserveValue }],
        name: [{ required: true, message: '必填', trigger: 'change' }, { validator: validateIsReserveValue }],
        'format.min': [
          {
            validator: (rule, value, callback) => {
              if (value < 0) {
                callback(new Error(`必须不小于0`))
              } else {
                form.value.validateField('format.max')
                callback()
              }
            },
            trigger: 'change'
          }
        ],
        'format.max': [
          {
            validator: (rule, value, callback) => {
              if (value < state.field.format.min) {
                callback(new Error(`必须不小于${state.field.format.min}`))
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ]
      }
    }
  }
}
</script>

<style lang="less" scoped>
.step-select-second {
  .field-row {
    display: flex;
    flex-wrap: wrap;
    padding: 8px 10px;
    -webkit-box-shadow: none;
    box-shadow: none;
    justify-content: space-between;
    align-items: center;
  }
  .field-content {
    padding: 8px 10px;
  }
  .icon-and-text {
    display: flex;
    align-items: center;
    .field-cell-type {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
    }
    .field-cell-name {
      margin-left: 5px;
      font-weight: bold;
      font-size: 15px;
      .description {
        color: var(--ti-lowcode-datasource-input-icon-color);
        margin-left: 5px;
      }
    }
  }
  svg {
    color: var(--ti-lowcode-datasource-toolbar-icon-color);
  }
}
</style>
