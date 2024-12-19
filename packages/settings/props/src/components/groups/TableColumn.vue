<template>
  <div class="colums">
    <div class="columsList">
      <meta-list>
        <template #actions>
          <meta-list-actions v-bind="actionsOptions" @actionEvents="actionEvents"></meta-list-actions>
        </template>
        <template #items>
          <meta-list-items
            v-bind="itemsOptions"
            @deleteItem="deleteItem"
            @changeItem="dragEnd"
            @hide="hide"
            @openModal="openColumnSetting"
          >
          </meta-list-items>
        </template>
      </meta-list>
    </div>
    <br />
  </div>
  <table-modal v-if="modal.created" v-show="modal.show" @close="closePanel">
    <table-setting-panel
      :properties="properties"
      :values="state.columnValues"
      :namePrefix="state.namePrefix"
    ></table-setting-panel>
  </table-modal>
</template>

<script>
import { reactive, computed, ref } from 'vue'
import { IconDel, IconEdit, IconPlus, IconCode, IconWriting } from '@opentiny/vue-icon'
import { useProperties } from '@opentiny/tiny-engine-meta-register'
import { useModal, MetaModal, MetaList, MetaListItems, MetaListActions } from '@opentiny/tiny-engine-common'
import TableSettingPanel from '../modal/ModalContent.vue'

export default {
  components: {
    MetaList,
    TableModal: MetaModal,
    TableSettingPanel,
    MetaListItems,
    MetaListActions
  },
  inheritAttrs: false,
  props: {
    name: {
      type: String,
      default: ''
    },
    modelValue: {
      type: Array,
      default: () => []
    },
    properties: {
      type: Array,
      default: () => []
    }
  },

  setup(props, { emit }) {
    const { setProp } = useProperties()

    const columnsList = computed(() => {
      return props.modelValue
    })

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

    const currentIndex = ref(-1)

    const state = reactive({
      namePrefix: '',
      columnValues: {}
    })

    const itemsOptions = computed(() => ({
      valueField: 'field',
      textField: 'title',
      btnList: [
        {
          title: '编辑',
          type: 'openModal',
          icon: IconEdit()
        },

        {
          title: '删除',
          type: 'delete',
          icon: IconDel()
        }
      ],
      optionsList: columnsList.value,
      name: props.name,
      draggable: true
    }))

    const { modal, openModal, closeModal } = useModal()

    const add = () => {
      let newOption = reactive({})
      newOption[itemsOptions.value.valueField] = ''
      newOption[itemsOptions.value.textField] = ''

      columnsList.value.push(newOption)
      setProp(props.name, columnsList.value)
    }

    const actionEvents = (item) => {
      switch (item.type) {
        case 'add':
          add()
          break
        case 'bindVariable':
          emit('openBindVariable', { name: props.name, modelValue: columnsList })
          break
        case 'editCode':
          emit('openCodeEditor', { name: props.name, modelValue: columnsList })
          break
        default:
          break
      }
    }

    const updatedColumns = (list) => {
      emit('update:modelValue', list)
      setProp(props.name, list)
    }

    const deleteItem = (params) => {
      columnsList.value.splice(params.index, 1)
      updatedColumns([...columnsList.value])
    }

    const dragEnd = () => {
      updatedColumns([...columnsList.value])
    }

    const hide = () => {
      updatedColumns([...columnsList.value])
    }

    const openColumnSetting = (params) => {
      currentIndex.value = params.index
      state.namePrefix = `${props.name}.${params.index}.`
      state.columnValues = columnsList.value[params.index]
      openModal()
    }

    const closePanel = () => {
      currentIndex.value = -1
      closeModal()
    }

    return {
      modal,
      state,
      columnsList,
      add,
      deleteItem,
      hide,
      dragEnd,
      openColumnSetting,
      currentIndex,
      closePanel,
      actionsOptions,
      itemsOptions,
      actionEvents
    }
  }
}
</script>

<style lang="less" scoped>
.colums {
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
</style>
