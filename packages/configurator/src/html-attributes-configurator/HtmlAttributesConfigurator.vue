<template>
  <div class="attr-header">
    <span class="header-title">自定义属性</span>
    <tiny-popover
      v-model="state.visible"
      placement="bottom"
      title=""
      width="200"
      popper-class="option-popper"
      trigger="manual"
    >
      <div class="attr-form">
        <icon-close class="icon-close" @click="closePopover"></icon-close>
        <tiny-form label-position="left" label-width="53px">
          <tiny-form-item label="name">
            <tiny-input v-model="state.formData.key"></tiny-input>
          </tiny-form-item>
          <tiny-form-item label="value">
            <tiny-input v-model="state.formData.value"></tiny-input>
          </tiny-form-item>
          <div class="footer">
            <tiny-button size="small" @click="cancel">取消</tiny-button>
            <tiny-button size="small" type="primary" @click="save">保存</tiny-button>
          </div>
        </tiny-form>
      </div>

      <template #reference>
        <tiny-tooltip class="item" effect="dark" content="新增原生属性" placement="top">
          <span class="icon-wrap"><IconPlus @click="addAttr"></IconPlus></span>
        </tiny-tooltip>
      </template>
    </tiny-popover>
  </div>
  <div class="attr-list">
    <div v-for="item in attrs" :key="item" class="list-item">
      <div class="item-content">{{ item.text }}</div>
      <div class="item-controller">
        <icon-edit @click="edit(item)"></icon-edit>
        <icon-del @click="deleteAttr(item)"></icon-del>
      </div>
    </div>
    <div v-if="!attrs.length" class="list-item">
      <div class="item-content">无数据</div>
    </div>
  </div>
  <div class="attr-popover"></div>
</template>
<script>
import { reactive, ref, watchEffect } from 'vue'
import { useProperties, useResource } from '@opentiny/tiny-engine-controller'
import { IconDel, IconEdit, IconClose, IconPlus } from '@opentiny/vue-icon'
import { Form, FormItem, Input, Button, Popover, Tooltip } from '@opentiny/vue'
import { utils } from '@opentiny/tiny-engine-utils'

export default {
  inheritAttrs: false,
  components: {
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinyInput: Input,
    TinyButton: Button,
    IconEdit: IconEdit(),
    IconDel: IconDel(),
    TinyPopover: Popover,
    IconClose: IconClose(),
    IconPlus: IconPlus(),
    TinyTooltip: Tooltip
  },
  props: {
    modelValue: {
      type: String,
      default: 'h1'
    },
    show: Boolean
  },
  setup() {
    const state = reactive({
      visible: false,
      formData: {},
      currentAttr: {}
    })

    const attrs = ref([])
    const properties = ['style']

    watchEffect(() => {
      if (!useProperties().getSchema()?.props) {
        return
      }

      const { schema } = useResource().getMaterial(useProperties().getSchema().componentName)
      schema?.properties?.forEach(({ content }) => {
        content.forEach(({ property }) => properties.push(property))
      })

      for (const [key, value] of Object.entries(useProperties().getSchema()?.props)) {
        !properties.includes(key) &&
          attrs.value.push({
            text: `${key} = '${value}'`,
            data: { key, value },
            id: utils.guid()
          })
      }
    })

    const cancel = () => {
      state.visible = false
    }

    const updateSchema = () => {
      const mergeProps = {}
      const { props } = useProperties().getSchema()
      for (const [key, value] of Object.entries(props)) {
        if (properties.includes(key)) {
          mergeProps[key] = value
        }
      }

      attrs.value.forEach((attr) => {
        mergeProps[attr.data.key] = attr.data.value
      })

      useProperties().getSchema().props = mergeProps
    }

    const save = () => {
      state.visible = false
      let data = {}
      let index = -1

      if (state.currentAttr.id) {
        index = attrs.value.findIndex((item) => item.id === state.currentAttr.id)
        data.id = state.currentAttr.id
        state.currentAttr = {}
      } else {
        data.id = utils.guid()
        index = attrs.value.length
      }

      data.text = `${state.formData.key} = '${state.formData.value}'`
      data.data = { key: state.formData.key, value: state.formData.value }

      attrs.value.splice(index, 1, data)
      updateSchema()
    }

    const edit = (attr) => {
      state.visible = true
      state.currentAttr = attr
      state.formData = attr.data
    }

    const addAttr = () => {
      state.visible = !state.visible
      state.formData = {}
    }

    const deleteAttr = (attr) => {
      const index = attrs.value.findIndex((item) => item.id === attr.id)
      attrs.value.splice(index, 1)
      attrs.value = [...attrs.value]
      updateSchema()
    }

    const closePopover = () => {
      state.visible = false
    }

    return {
      state,
      cancel,
      save,
      attrs,
      edit,
      addAttr,
      deleteAttr,
      closePopover
    }
  }
}
</script>

<style lang="less" scoped>
.attr-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;

  .header-title {
    line-height: 24px;
  }

  .icon-wrap {
    width: 24px;
    height: 24px;
    font-size: 16px;
    color: var(--ti-lowcode-toolbar-breadcrumb-color);
    background: var(--ti-lowcode-canvas-wrap-bg);
    border: 1px solid var(--ti-lowcode-left-button-border-color);
    border-radius: 2px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
}

.attr-form {
  padding: 0 10px 10px;
  .icon-close {
    float: right;
    margin: 10px 0;
  }
  .footer {
    width: 100%;
    text-align: center;
  }
}

.attr-list {
  .list-item {
    border: 1px solid var(--ti-lowcode-optionitem-border-color);
    background: var(--ti-lowcode-optionitem-background-color);
    margin-bottom: -1px;
    color: var(--ti-lowcode-toolbar-breadcrumb-color);
    padding: 7px;
    display: grid;
    grid-template-columns: 3fr auto;

    .item-controller {
      display: grid;
      column-gap: 3px;
      grid-template-columns: 1fr auto;
      cursor: pointer;
    }
  }
}
</style>
