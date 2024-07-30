<template>
  <div class="meta-array-wrap">
    <meta-list>
      <template #title>
        <label>{{ meta.label?.text?.zh_CN }}</label>
      </template>
      <template #actions>
        <meta-list-actions v-bind="actionsOptions" @actionEvents="actionEvents"></meta-list-actions>
      </template>
      <template #items>
        <vue-draggable-next
          :list="itemsOptions.optionsList"
          :disabled="disableDrag"
          handle=".tiny-svg-size"
          @change="dragEnd"
        >
          <div v-for="(item, index) in itemsOptions.optionsList" :key="index">
            <meta-list-item
              :item="item"
              :index="index"
              :dataScource="itemsOptions"
              :currentIndex="state.currentIndex"
              :expand="expand"
              @changeItem="changeItem"
              @deleteItem="deleteItem"
              @editItem="editItem"
            >
              <template #content>
                <span @click="editItem({ index })">{{ translate(item[itemsOptions.textField]) || item.type }}</span>
              </template>
              <template #metaForm>
                <meta-child-item
                  type="array"
                  :meta="meta"
                  :index="index"
                  :arrayIndex="state.currentIndex"
                  @update:modelValue="onValueChange(index, $event)"
                ></meta-child-item>
              </template>
            </meta-list-item>
          </div>
        </vue-draggable-next>
      </template>
    </meta-list>
  </div>
</template>

<script>
import { computed, reactive } from 'vue'
import { IconDel, IconEdit, IconPlus } from '@opentiny/vue-icon'
import { MetaList, MetaListActions, MetaListItem, MetaChildItem } from '@opentiny/tiny-engine-common'
import { useTranslate } from '@opentiny/tiny-engine-meta-register'
import { VueDraggableNext } from 'vue-draggable-next'

export default {
  name: 'ArrayItemConfigurator',
  components: {
    MetaList,
    MetaListItem,
    MetaListActions,
    MetaChildItem,
    VueDraggableNext
  },
  inheritAttrs: false,
  props: {
    meta: {
      type: Object,
      default: () => {}
    },
    expand: {
      type: Boolean,
      default: false
    },
    disableDrag: {
      type: Boolean,
      default: false
    }
  },

  setup(props, { emit }) {
    const columnsList = computed(() => {
      return props.meta.widget.props.modelValue?.value || props.meta.widget.props.modelValue || []
    })

    const actionsOptions = {
      actions: [
        {
          title: '新增一列',
          type: 'add',
          icon: IconPlus()
        }
      ]
    }

    const itemsOptions = computed(() => ({
      valueField: 'field',
      textField: props.meta.widget.props.textField || 'value',
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
      optionsList: columnsList.value,
      name: props.name,
      draggable: true
    }))

    const state = reactive({
      currentIndex: -1
    })

    const editItem = (data) => {
      state.currentIndex = data.index
    }

    const updatedColumns = () => {
      emit('update:modelValue', [...columnsList.value])
    }

    const addItem = () => {
      const defaultValue = props.meta.defaultValue?.[0] || null
      const newOption = ['string', 'boolean', 'number'].includes(props.meta.widget.props.type)
        ? defaultValue
        : { ...defaultValue }

      columnsList.value.push(newOption)
      state.currentIndex = columnsList.value.length - 1
      updatedColumns()
    }

    const deleteItem = (params) => {
      columnsList.value.splice(params.index, 1)
      updatedColumns()
    }

    const changeItem = (item) => {
      columnsList.value[item.index] = item.data
      updatedColumns()
    }

    const onValueChange = (index, { propertyKey, propertyValue }) => {
      if (propertyValue === '' || propertyValue === undefined || propertyValue === null) {
        delete columnsList.value[index][propertyKey]
      } else {
        columnsList.value[index][propertyKey] = propertyValue
      }
      updatedColumns()
    }

    const dragEnd = () => {
      updatedColumns()
    }

    const actionEvents = (item) => {
      switch (item.type) {
        case 'add':
          addItem()
          break
        default:
          break
      }
    }

    return {
      state,
      actionsOptions,
      itemsOptions,
      columnsList,
      editItem,
      addItem,
      deleteItem,
      changeItem,
      onValueChange,
      actionEvents,
      translate: useTranslate().translate,
      dragEnd
    }
  }
}
</script>

<style lang="less" scoped>
.meta-array-wrap {
  font-size: 12px;
  display: block;
}
</style>
