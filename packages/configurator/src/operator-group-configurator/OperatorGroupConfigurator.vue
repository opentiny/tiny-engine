<template>
  <div class="meta-array-wrap">
    <meta-list>
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
              @hideItem="hideItem"
              @showItem="showItem"
            >
              <template #content>
                <span>{{ translate(item[itemsOptions.textField]) || item.type }}</span>
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
      <template #bottom>
        <div class="add" @click="addItem">
          <svg-icon name="plus"></svg-icon>
          <span>新增</span>
        </div>
      </template>
    </meta-list>
  </div>
</template>

<script>
import { computed, reactive } from 'vue'
import { iconDel, iconEdit, iconEyeclose, iconEyeopen } from '@opentiny/vue-icon'
import MetaListItem from './MetaListItem.vue'
import MetaChildItem from './MetaChildItem.vue'
import MetaList from './MetaList.vue'
import { TranslateService } from '@opentiny/tiny-engine-plugin-i18n'
import { VueDraggableNext } from 'vue-draggable-next'

export default {
  name: 'ArrayItemConfigurator',
  components: {
    MetaList,
    MetaListItem,
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
    const { translate } = TranslateService.apis
    const columnsList = computed(() => {
      return props.meta.widget.props.modelValue?.value || props.meta.widget.props.modelValue || []
    })

    const itemsOptions = computed(() => ({
      valueField: 'prop',
      textField: props.meta.widget.props.textField || 'value',
      btnList: [
        {
          title: '编辑',
          type: 'edit',
          icon: iconEdit()
        },
        {
          title: '删除',
          type: 'delete',
          icon: iconDel()
        },
        {
          title: '显示',
          type: 'show',
          icon: iconEyeclose()
        },
        {
          title: '隐藏',
          type: 'hide',
          icon: iconEyeopen()
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
      emit('update:modelValue', { ...props.meta.widget.props.modelValue, value: columnsList.value })
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

    const hideItem = (params) => {
      columnsList.value[params.index].itemVisible = false
      updatedColumns()
    }

    const showItem = (params) => {
      columnsList.value[params.index].itemVisible = true
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

    return {
      state,
      itemsOptions,
      columnsList,
      editItem,
      addItem,
      deleteItem,
      changeItem,
      hideItem,
      showItem,
      onValueChange,
      translate,
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
.add {
  display: flex;
  align-items: center;
  color: var(--te-configurator-common-text-color-emphasize);
  &:hover {
    cursor: pointer;
  }

  & .icon-plus {
    font-size: 14px;
    margin-right: 5px;
  }
}
</style>
