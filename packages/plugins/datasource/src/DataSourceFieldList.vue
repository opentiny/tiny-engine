<template>
  <data-source-field-form
    class="form-item-border"
    v-for="(field, index) in state.fields"
    :key="field.name"
    :field="field"
    :isRow="true"
    :editable="field.editable"
    @cancel="closeFieldForm(index)"
    @save="saveFieldForm"
  >
    <div class="icon-and-text">
      <div class="field-cell-type">
        <component :is="getFieldType(field.type, 'icon')"></component>
      </div>
      <div class="field-cell-name">
        <span class="field-name">{{ field.name }}</span>
        <span class="description">({{ getFieldType(field.type, 'name') }})</span>
      </div>
    </div>
    <div class="field-operation" v-if="!field.editable">
      <div class="field-handler" @click="openFieldForm(index)">
        <svg-button name="to-edit" :hoverBgColor="false" @click="handleEdit(data)"></svg-button>
      </div>
      <div class="field-handler" @click="deleteField($event, field)">
        <svg-button :hoverBgColor="false" name="text-source-delete"></svg-button>
      </div>
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
  margin-bottom: 8px;
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
      .field-name {
        color: var(--ti-lowcode-datasource-color);
      }
      .description {
        color: var(--ti-lowcode-datasource-tip-color);
        margin-left: 5px;
      }
    }
    svg {
      color: var(--ti-lowcode-datasource-toolbar-icon-color);
    }
  }
}
.field-operation {
  display: none;

  .field-handler {
    cursor: pointer;
    font-size: 16px;
  }
}
.form-item-border:hover {
  background: var(--ti-lowcode-datasource-box-bg);
  .field-operation {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .field-handler {
      cursor: pointer;
      font-size: 16px;
    }
  }
}
</style>
