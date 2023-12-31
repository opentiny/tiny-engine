<template>
  <data-source-field-form
    class="form-item-border"
    v-for="(field, index) in state.fields"
    :key="field.name"
    :field="field"
    :editable="field.editable"
    @cancel="closeFieldForm(index)"
    @save="saveFieldForm"
    @click="openFieldForm(index)"
  >
    <div class="icon-and-text">
      <div class="field-cell-type">
        <component :is="getFieldType(field.type, 'icon')"></component>
      </div>
      <div class="field-cell-name">
        <span>{{ field.name }}</span>
        <span class="description">({{ getFieldType(field.type, 'name') }})</span>
      </div>
    </div>
    <div class="field-handler" v-if="!field.editable" @click="deleteField($event, field)">
      <svg-button tips="删除" name="text-source-delete"></svg-button>
    </div>
  </data-source-field-form>
</template>

<script>
import { reactive, watchEffect } from 'vue'
import fieldTypes from './config'
import DataSourceFieldForm from './DataSourceFieldForm.vue'
import { IconDel } from '@opentiny/vue-icon'
import { SvgButton } from '@opentiny/tiny-engine-common'

export default {
  components: {
    SvgButton,
    DataSourceFieldForm,
    IconDel: IconDel()
  },
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props, { emit }) {
    const state = reactive({
      fields: null
    })

    watchEffect(() => {
      state.fields = props.modelValue.map((item) => {
        item.editable = false
        return item
      })
    })

    const getFieldType = (type, key) => {
      const fieldType = fieldTypes.filter((item) => item.type === type)
      if (fieldType && fieldType.length === 1) {
        return fieldType[0][key]
      } else {
        return fieldTypes[0][key]
      }
    }

    const openFieldForm = (index) => {
      state.fields = state.fields.map((item, i) => {
        if (index === i) {
          item.editable = true
        } else {
          item.editable = false
        }
        return item
      })
    }

    const reset = () => {
      state.fields = state.fields.map((item) => {
        item.editable = false
        return item
      })
    }

    const closeFieldForm = (index) => {
      state.fields[index].editable = false
    }

    const saveFieldForm = (field) => {
      const { name, title } = field
      const editableFields = state.fields.map((item) => item.editable)
      const index = editableFields.indexOf(true)

      if (name && title && index > -1) {
        Object.assign(state.fields[index], field, { editable: false })
      }
    }

    const deleteField = (e, field) => {
      e.stopPropagation()
      const index = state.fields.findIndex((item) => item.name === field.name && item.title === field.title)
      state.fields.splice(index, 1)
      emit('update:modelValue', state.fields)
    }

    return {
      state,
      reset,
      getFieldType,
      openFieldForm,
      closeFieldForm,
      saveFieldForm,
      deleteField
    }
  }
}
</script>

<style lang="less" scoped>
.form-item-border {
  border-bottom: 1px solid var(--ti-lowcode-datasource-list-bottom-border-color);
  .icon-and-text {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    .field-cell-type {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
    }
    .field-cell-name {
      margin-left: 5px;
      .description {
        color: var(--ti-lowcode-datasource-input-icon-color);
        margin-left: 5px;
      }
    }
    svg {
      color: var(--ti-lowcode-datasource-toolbar-icon-color);
    }
  }
}
.field-handler {
  cursor: pointer;
  font-size: 16px;
}
</style>
