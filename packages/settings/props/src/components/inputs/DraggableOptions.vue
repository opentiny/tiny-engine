<template>
  <meta-list v-bind="options">
    <template #title>
      <div>{{ props.name }}</div>
    </template>
    <template #actions>
      <meta-list-actions v-bind="actionsOptions" @actionEvents="actionEvents"></meta-list-actions>
    </template>
    <template #items>
      <meta-list-items v-bind="itemsOptions" @deleteItem="deleteItem" @changeItem="changeItem"></meta-list-items>
    </template>
  </meta-list>
</template>

<script>
import { reactive, watchEffect, ref, computed } from 'vue'
import {
  IconDel,
  IconWriting,
  IconMore,
  IconLanguage,
  IconClose,
  IconNew,
  IconEdit,
  IconPlus,
  IconCode
} from '@opentiny/vue-icon'
import { useProperties, useCanvas } from '@opentiny/tiny-engine-meta-register'
import { MetaList, MetaListActions, MetaListItems } from '@opentiny/tiny-engine-common'

export default {
  components: {
    MetaList,
    MetaListActions,
    MetaListItems
  },
  inheritAttrs: false,
  props: {
    modelValue: {
      type: Array,
      default: () => []
    },
    name: {
      type: String,
      default: ''
    },
    data: {
      type: Object,
      default: () => {}
    }
  },
  setup(props, { emit }) {
    const { setProp } = useProperties()
    const { pageState } = useCanvas()

    let properties = []

    Object.keys(pageState.properties).forEach((key) => {
      properties = properties.concat(pageState.properties[key])
    })

    const getPropertyByType = (type) => properties.filter((item) => item.name == type)
    const getModelvalue = (type) => getPropertyByType(type)[0].modelValue
    let optionsList = ref([])

    const actionsOptions = {
      actions: [
        {
          title: '新增',
          type: 'add',
          icon: IconPlus()
        },
        {
          title: '变量绑定',
          type: 'bindVariable',
          icon: IconCode()
        },
        {
          title: '编辑Json',
          type: 'editCode',
          icon: IconWriting()
        }
      ]
    }

    const titleOptions = {
      title: props.name
    }

    const itemsOptions = computed(() => ({
      valueField: getModelvalue('value-field'),
      textField: getModelvalue('text-field'),
      btnList: [
        {
          title: '编辑',
          type: 'edit',
          icon: IconEdit()
        },
        {
          title: '删除',
          type: 'delete',
          icon: IconDel()
        }
      ],
      optionsList: optionsList.value,
      name: props.name,
      draggable: true
    }))

    const change = (value) => {
      setProp('value', value)
    }

    const addSelectOption = () => {
      let newOption = reactive({})
      newOption[itemsOptions.value.valueField] = ''
      newOption[itemsOptions.value.textField] = ''
      optionsList.value.push(newOption)
      setProp(props.name, optionsList.value)
    }

    const changeItem = (params) => {
      optionsList.value = params || optionsList.value
      setProp(props.name, optionsList.value)
    }

    const deleteItem = (params) => {
      optionsList.value.splice(params.index, 1)
      setProp(props.name, optionsList.value)
    }

    const actionEvents = (item) => {
      switch (item.type) {
        case 'add':
          addSelectOption()
          break
        case 'bindVariable':
          emit('openBindVariable', { name: props.name, modelValue: optionsList.value })
          break
        case 'editCode':
          emit('openCodeEditor', { name: props.name, modelValue: optionsList.value })
          break
        default:
          break
      }
    }

    watchEffect(() => {
      optionsList.value = props.modelValue
    })

    return {
      IconDel: IconDel(),
      IconWriting: IconWriting(),
      IconMore: IconMore(),
      IconLanguage: IconLanguage(),
      IconClose: IconClose(),
      IconNew: IconNew(),
      change,
      confirm,
      getPropertyByType,
      changeItem,
      deleteItem,
      actionEvents,
      pageState,
      optionsList,
      actionsOptions,
      titleOptions,
      itemsOptions
    }
  }
}
</script>

<style lang="less" scoped>
.options {
  width: 100%;
  .top {
    color: var(--te-common-text-secondary);
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    .tiny-svg {
      color: var(--ti-lowcode-toolbar-icon-color);
      margin-right: 5px;
      font-size: 16px;
      &:hover {
        cursor: pointer;
      }
    }
  }
}

.batch-edit {
  > p:first-child {
    font-size: 14px;
    font-weight: bold;
  }
  .format-rules {
    border: 1px solid #adb0b8;

    .rulesItem {
      height: 40px;
      line-height: 40px;
      padding: 0 10px;
      display: flex;
      &:first-child {
        border-bottom: 1px solid #adb0b8;
      }
      > span {
        flex: 1;
        > span {
          margin: 0 5px;
        }
      }
    }
  }
}
</style>
