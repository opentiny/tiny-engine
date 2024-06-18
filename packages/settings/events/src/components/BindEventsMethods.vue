<template>
  <div class="left-action-list">
    <tiny-search v-model="searchValue" placeholder="搜索"></tiny-search>
    <ul class="action-list-wrap">
      <li v-for="item in filteredMethodList" :key="item.name" @click="selectMethod(item)">
        <div :class="['action-name', { active: item.name === bindMethodInfo.name }]">
          {{ item.title || item.name }}
          <icon-yes v-if="item.name === bindMethodInfo.name" class="action-selected-icon"></icon-yes>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { useLayout } from '@opentiny/tiny-engine-entry'
import { Search } from '@opentiny/vue'
import { iconYes } from '@opentiny/vue-icon'
import { ref, watchEffect } from 'vue'
import { INVALID_VARNAME_CHAR_RE, NEW_METHOD_TYPE } from './constants'

export default {
  components: {
    TinySearch: Search,
    IconYes: iconYes()
  },
  inheritAttrs: false,
  props: {
    eventBinding: {
      type: Object,
      default: () => {}
    },
    bindMethodInfo: {
      type: Object,
      default: () => {}
    }
  },
  emits: ['selectMethod'],
  setup(props, { emit }) {
    const { PLUGIN_NAME, getPluginApi } = useLayout()
    const { getMethodNameList } = getPluginApi(PLUGIN_NAME.PageController)

    const searchValue = ref('')
    const filteredMethodList = ref([])

    const generateMethodName = (nameList, eventName) => {
      const max = nameList
        .map((name) => Number.parseInt(name.match(/\d+$/)?.[0]) || 0)
        .sort((a, b) => a - b)
        .pop()

      const functionName = eventName?.replace(INVALID_VARNAME_CHAR_RE, '_') || ''
      let name = `${functionName}New`

      if (max > -1) {
        name += `${max + 1}`
      }

      return name
    }

    const selectMethod = (data) => {
      emit('selectMethod', data)
    }

    watchEffect(() => {})

    watchEffect(() => {
      const eventName = props.eventBinding?.eventName

      const nameList = getMethodNameList?.().filter((action) => action.includes(eventName)) || []
      const newMethodName = generateMethodName(nameList, eventName)

      const newMethod = {
        title: '添加新方法',
        name: newMethodName,
        type: NEW_METHOD_TYPE
      }

      if (props.eventBinding?.ref) {
        selectMethod({ name: props.eventBinding.ref })
      } else {
        selectMethod(newMethod)
      }

      const methodList =
        getMethodNameList?.()
          .filter((item) => item.includes(searchValue.value))
          .map((name) => ({ name })) || []

      filteredMethodList.value = [newMethod, ...methodList]
    })

    return {
      searchValue,
      filteredMethodList,
      selectMethod
    }
  }
}
</script>

<style lang="less" scoped>
.left-action-list {
  flex: 1;
  padding: 12px;
  .action-list-wrap {
    height: 250px;
    margin-top: 8px;
    overflow: auto;
  }

  .action-name {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    cursor: pointer;

    &.active {
      background: var(--ti-lowcode-bind-event-dialog-content-left-list-item-active-bg-color);
    }

    .action-selected-icon {
      font-size: 14px;
      color: var(--ti-lowcode-bind-event-dialog-action-selected-icon-color);
    }
  }
}
</style>
