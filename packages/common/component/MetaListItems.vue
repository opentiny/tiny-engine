<template>
  <template v-if="draggable">
    <vue-draggable-next class="dragArea list-group w-full" :list="optionsList" @change="dragEnd">
      <div v-for="(item, index) in optionsList" :key="index" class="option-item">
        <meta-list-item
          :item="item"
          :index="index"
          :itemClick="itemClick"
          :dataScource="listItemOption"
          @changeItem="changeItem"
          @deleteItem="deleteItem"
          @editItem="editItem"
        >
          <template #content>
            <slot name="content" :data="item">
              <span>{{ item[textField] || formatName(item) }}</span>
            </slot>
          </template>
          <template #operate>
            <slot name="operate" :data="item"></slot>
          </template>
          <template #metaForm>
            <slot name="form" :data="item"></slot>
          </template>
          <template #footer>
            <slot name="footer" :data="item"></slot>
          </template>
        </meta-list-item>
      </div>
    </vue-draggable-next>
  </template>
  <template v-else>
    <div v-for="(item, index) in optionsList" :key="index" class="option-item not-draggable">
      <meta-list-item
        :item="item"
        :index="index"
        :itemClick="itemClick"
        :dataScource="listItemOption"
        @changeItem="changeItem"
        @deleteItem="deleteItem"
        @editItem="editItem"
      >
        <template #content>
          <slot name="content" :data="item">
            <span>{{ item[textField] || formatName(item) }}</span>
          </slot>
        </template>
        <template #operate>
          <slot name="operate" :data="item"></slot>
        </template>
        <template #metaForm>
          <slot name="form" :data="item"></slot>
        </template>
        <template #footer>
          <slot name="footer" :data="item"></slot>
        </template>
      </meta-list-item>
    </div>
  </template>
</template>

<script>
import { computed } from 'vue'
import { VueDraggableNext } from 'vue-draggable-next'
import { useResource } from '@opentiny/tiny-engine-controller'
import MetaListItem from './MetaListItem.vue'

export default {
  components: {
    MetaListItem,
    VueDraggableNext
  },
  props: {
    draggable: {
      type: Boolean,
      default: true
    },
    optionsList: {
      type: Array,
      default: () => []
    },
    name: {
      type: String,
      default: ''
    },
    valueField: {
      type: String,
      default: ''
    },
    textField: {
      type: String,
      default: ''
    },
    btnList: {
      type: Array,
      default: () => []
    },
    // 使用itemClick判断是否由双击触发弹出面板
    itemClick: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const listItemOption = computed(() => props)
    const { resState } = useResource()

    const changeItem = (params) => {
      const optionsList = [...props.optionsList]
      if (params.data) {
        optionsList[params.index] = params.data
      }

      emit('changeItem', optionsList)
    }

    const deleteItem = (params) => {
      emit('deleteItem', params)
    }

    const dragEnd = (value) => {
      emit('dragEnd', value)
    }

    const editItem = (params) => {
      const optionsList = [...props.optionsList]

      switch (params.action) {
        case 'openModal':
          emit('openModal', { index: params.index })
          break

        default:
          optionsList[params.index] = params.data
          emit('changeItem', optionsList)
          break
      }
    }

    const typeDesc = {
      index: '序号',
      selection: '复选框',
      radio: '单选框',
      expand: '展开行'
    }

    const formatName = (item) => {
      if (!item) {
        return ''
      }

      let text = ''

      let name = computed(() => {
        if (item.type) {
          text = typeDesc[item.type]
        }

        if (item[props.textField]) {
          if (item[props.textField].i18nKey) {
            let i18nKey = item[props.textField].i18nKey
            text = resState.langs[i18nKey][resState.currentLang]
          } else {
            text = item[props.textField]
          }
        }

        return text
      })

      return name
    }

    return {
      listItemOption,
      changeItem,
      deleteItem,
      dragEnd,
      editItem,
      formatName
    }
  }
}
</script>
<style lang="less" scoped>
.option-item.not-draggable {
  :deep(.item-content .option-input > div.left .icon-more) {
    cursor: auto;
  }
}
</style>
