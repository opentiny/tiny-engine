<template>
  <div id="data-source">
    <div class="data-source-left-panel">
      <div class="title">
        <span>状态管理</span>
        <link-button :href="docsUrl"></link-button>
        <close-icon @close="closePanel"></close-icon>
      </div>
      <tiny-tabs v-model="activeName" @click="tabClick" tab-style="button-card">
        <tiny-tab-item :name="STATE.CURRENT_STATE" :title="isBlock ? '区块状态' : '页面状态'"></tiny-tab-item>
        <tiny-tab-item :name="STATE.GLOBAL_STATE" title="应用状态"></tiny-tab-item>
      </tiny-tabs>
      <tiny-search
        :modelValue="query"
        class="left-filter"
        placeholder="请输入搜索条件"
        clearable
        @update:modelValue="search"
      >
        <template #prefix>
          <tiny-icon-search />
        </template>
      </tiny-search>
      <div class="add-btn">
        <tiny-button @click="openPanel(OPTION_TYPE.ADD)">
          <svg-icon name="add" class="add-btn-icon"></svg-icon>
          <span class="add-btn-text">{{ activeName === STATE.CURRENT_STATE ? '添加变量' : '添加全局变量' }}</span>
        </tiny-button>
      </div>
      <data-source-list
        :modelValue="Object.keys(state.dataSource)"
        :stateScope="activeName"
        :query="query"
        :selectedKey="selectedKey"
        @openPanel="openPanel"
        @remove="remove"
        @removeStore="removeStore"
      />
    </div>
    <div v-if="isPanelShow" class="data-source-right-panel">
      <div class="header">
        <span>{{ addDataSource }}</span>
        <span class="options-wrap">
          <tiny-button type="primary" @click="confirm">保存</tiny-button>
          <close-icon @close="cancel"></close-icon>
        </span>
      </div>
      <create-variable
        v-if="activeName === STATE.CURRENT_STATE"
        ref="variableRef"
        :dataSource="state.dataSource"
        :flag="flag"
        :updateKey="updateKey"
        :createData="state.createData"
        @nameInput="updateName"
        @close="cancel"
        @mouseleave="onMouseLeaveVariable"
      />
      <create-store
        v-if="activeName === STATE.GLOBAL_STATE"
        ref="storeRef"
        :dataSource="state.dataSource"
        :flag="flag"
        :updateKey="updateKey"
        :storeData="state.createData"
        @nameInput="validName"
        @close="cancel"
        @mouseleave="onMouseLeaveStore"
      />
    </div>
  </div>
</template>

<script>
import { reactive, ref, computed, onActivated, watch } from 'vue'
import { Button, Search, Tabs, TabItem } from '@opentiny/vue'
import {
  useCanvas,
  useHistory,
  useResource,
  useNotify,
  useHelp,
  getMetaApi,
  META_APP,
  META_SERVICE
} from '@opentiny/tiny-engine-meta-register'
import { getCommentByKey } from '@opentiny/tiny-engine-common/js/comment'
import { iconSearch } from '@opentiny/vue-icon'
import { CloseIcon, LinkButton } from '@opentiny/tiny-engine-common'
import DataSourceList from './DataSourceList.vue'
import CreateVariable from './CreateVariable.vue'
import CreateStore from './CreateStore.vue'
import { updateGlobalState } from './js/http'
import { STATE, OPTION_TYPE } from './js/constants'
import { validateMonacoEditorData } from './js/common'

export default {
  components: {
    TinySearch: Search,
    TinyButton: Button,
    DataSourceList,
    CreateVariable,
    CloseIcon,
    TinyTabs: Tabs,
    TinyTabItem: TabItem,
    CreateStore,
    LinkButton,
    TinyIconSearch: iconSearch()
  },
  setup(props, { emit }) {
    const variableRef = ref(null)
    const storeRef = ref(null)
    const isPanelShow = ref(false)
    const errorMessage = ref('')
    const flag = ref('')
    const query = ref('')
    const updateKey = ref('')
    const addDataSource = ref('添加变量')
    const activeName = ref(STATE.CURRENT_STATE)
    const isBlock = computed(() => useCanvas().isBlock())
    const { setSaved } = useCanvas()
    const { openCommon } = getMetaApi(META_APP.Save)
    const docsUrl = useHelp().getDocsUrl('data')
    const state = reactive({
      dataSource: {},
      createData: {
        name: '',
        description: '',
        variable: ''
      }
    })
    const selectedKey = ref(null)

    watch(activeName, () => {
      selectedKey.value = null
    })

    const openPanel = (flagValue, key = '') => {
      updateKey.value = key
      flag.value = flagValue
      const isCurrent = activeName.value === STATE.CURRENT_STATE
      if (flagValue === OPTION_TYPE.ADD) {
        state.createData.name = ''
        state.createData.variable = ''
        errorMessage.value = ''
        addDataSource.value = isCurrent ? '添加变量' : '添加全局变量'
      } else if (flagValue === OPTION_TYPE.UPDATE) {
        state.createData.name = key
        state.createData.variable = state.dataSource[key]
        addDataSource.value = isCurrent ? '修改变量' : '修改全局变量'
      } else {
        state.createData.name = `${key}_copy`
        state.createData.variable = state.dataSource[key]
        addDataSource.value = isCurrent ? '复制变量' : '复制全局变量'
      }

      isPanelShow.value = true
      selectedKey.value = flagValue === OPTION_TYPE.UPDATE ? key : null
    }

    const cancel = () => {
      errorMessage.value = ''
      isPanelShow.value = false
      selectedKey.value = null
    }

    const add = (name, variable) => {
      const { getSchema } = useCanvas()

      if (getSchema()) {
        if (updateKey.value !== name && flag.value === OPTION_TYPE.UPDATE) {
          delete state.dataSource[updateKey.value]
        }
        state.dataSource[name] = variable
      }
    }

    const validName = (name) => {
      errorMessage.value = name
    }

    const notifySaveError = (message) => {
      useNotify({
        title: '保存错误',
        type: 'error',
        message
      })
    }

    const updateName = (value) => {
      state.createData.name = value
    }

    const confirm = () => {
      const { name } = state.createData
      const { getSchema, updateSchema } = useCanvas()

      if (activeName.value === STATE.CURRENT_STATE) {
        // 校验
        variableRef.value.validateForm().then(() => {
          // 获取数据
          let variable = variableRef.value.getFormData()

          // 保存数据
          add(name, variable)
          isPanelShow.value = false
          setSaved(false)

          const schema = getSchema()
          updateSchema({ state: { ...(schema.state || {}), [name]: variable } })

          useHistory().addHistory()
          openCommon()
        })
      } else {
        storeRef.value.validateForm().then(() => {
          const validateResult = validateMonacoEditorData(storeRef.value.getEditor(), 'state字段', { required: true })
          if (!validateResult.success) {
            notifySaveError(validateResult.message)
            return
          }

          const storeState = storeRef.value.getEditor().getValue()
          const getters = storeRef.value.saveMethods('gettersEditor')
          const actions = storeRef.value.saveMethods('actionsEditor')
          const store = {
            [name]: {
              id: name,
              state: storeState,
              getters,
              actions
            }
          }

          if (updateKey.value !== name && flag.value === OPTION_TYPE.UPDATE) {
            delete state.dataSource[updateKey.value]
          }

          Object.assign(state.dataSource, store)
          const storeList = Object.values(state.dataSource)

          const { id } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
          updateGlobalState(id, { global_state: storeList }).then((res) => {
            isPanelShow.value = false
            useResource().appSchemaState.globalState = res.global_state || []
          })
          openCommon()
        })
      }
    }

    const search = (value) => {
      if (value === undefined) {
        return
      }

      query.value = value
    }

    const remove = (key) => {
      const { getSchema, updateSchema } = useCanvas()

      delete state.dataSource[key]

      const schema = getSchema()
      let { lifeCycles } = schema
      const { [key]: deletedKey, ...restState } = schema.state

      if (key.startsWith('datasource')) {
        const pageSchema = getSchema()
        const { start, end } = getCommentByKey(key)

        /**
         * 匹配提前注入的 loadDataSource 表达式和注释，级联删除
         * 等价：/([\s\n]*\/\*\* start \*\/[\s\S]*\/\*\* end \*\/)/
         * "任意换行或空白字符 /** start-key *\/ 任意字符 /** end-key *\/"，该字符串会被匹配
         */
        const pattern = new RegExp(`([\\s\\n]*\\/\\*\\* ${start} \\*\\/[\\s\\S]*\\/\\*\\* ${end} \\*\\/)`)

        lifeCycles.setup.value = pageSchema.lifeCycles.setup.value.replace(pattern, '')
      }

      updateSchema({ state: restState, lifeCycles })

      // 如果删除的是当前编辑的状态变量，则需要关闭二级面板
      if (state.createData.name === key) {
        isPanelShow.value = false
      }

      setSaved(false)
    }

    const setGlobalStateToDataSource = () => {
      const globalState = useResource().appSchemaState.globalState

      if (!globalState) {
        state.dataSource = {}

        return
      }

      state.dataSource = globalState.reduce((acc, store) => ({ ...acc, [store.id]: store }), {})
    }

    const removeStore = (key) => {
      const storeList = [...useResource().appSchemaState.globalState] || []
      const index = storeList.findIndex((store) => store.id === key)

      if (index !== -1) {
        const { id } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()

        storeList.splice(index, 1)
        updateGlobalState(id, { global_state: storeList }).then((res) => {
          useResource().appSchemaState.globalState = res.global_state || []
          setGlobalStateToDataSource()
        })

        // 如果删除的是当前编辑的状态变量，则需要关闭二级面板
        if (state.createData.name === key) {
          isPanelShow.value = false
        }
      }
    }

    const closePanel = () => {
      emit('close')
    }

    const initDataSource = (tabsName = activeName.value) => {
      const { getSchema } = useCanvas()

      if (tabsName === STATE.GLOBAL_STATE) {
        setGlobalStateToDataSource()
      } else {
        const pageSchema = getSchema() || {}

        state.dataSource = pageSchema.state || {}
      }
    }

    const tabClick = () => {
      isPanelShow.value = false
      query.value = ''
      initDataSource()
    }
    const onMouseLeaveVariable = () => {
      variableRef.value?.clearValidateForm()
    }
    const onMouseLeaveStore = () => {
      storeRef.value?.clearValidateForm()
    }

    onActivated(() => {
      initDataSource()
    })

    return {
      isBlock,
      isPanelShow,
      errorMessage,
      state,
      variableRef,
      addDataSource,
      updateName,
      openPanel,
      cancel,
      confirm,
      search,
      query,
      remove,
      closePanel,
      validName,
      flag,
      updateKey,
      activeName,
      selectedKey,
      tabClick,
      STATE,
      removeStore,
      storeRef,
      OPTION_TYPE,
      open,
      docsUrl,
      onMouseLeaveVariable,
      onMouseLeaveStore
    }
  }
}
</script>

<style lang="less" scoped>
#data-source {
  height: 100%;
  position: relative;

  .data-source-left-panel {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    .add-btn {
      margin: 12px 0;
      padding: 0 8px;
      width: 100%;
      .tiny-button {
        width: 100%;
        border-color: var(--te-common-border-default);
        &:hover {
          border-color: var(--te-common-border-hover);
        }
      }
      .add-btn-icon {
        margin-right: 4px;
        font-size: 16px;
        stroke: var(--ti-lowcode-chat-model-button-text);
        color: var(--te-common-icon-secondary);
        vertical-align: sub;
      }
      .add-btn-text {
        display: inline-block;
      }
    }

    .title {
      padding: 10px;
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
        'Helvetica Neue', sans-serif;
      color: var(--ti-lowcode-plugin-panel-title-color);
      font-weight: var(--ti-lowcode-plugin-panel-title-font-weight);
      border-bottom: 1px solid var(--ti-lowcode-data-header-border-bottom-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .left-filter {
      margin-top: 4px;
      padding: 0 8px;
    }

    & > span {
      display: inline-block;
      padding: 0 10px;
      &,
      .left-btn,
      :deep(.tiny-popover__reference) {
        width: 100%;
      }
    }
    .left-btn {
      max-width: 100%;
      margin-top: 12px;
    }
  }

  .data-source-right-panel {
    width: 492px;
    height: 100%;
    box-shadow: 6px 0px 3px 0px var(--te-base-box-shadow-rgba-3);
    border-right: 1px solid var(--te-common-border-divider);
    background: var(--te-common-bg-default);
    position: absolute;
    left: var(--base-left-panel-width);
    top: 0;

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 45px;
      padding: 0 12px;
      font-size: 12px;
      font-weight: 700;
      color: var(--te-common-text-primary);
      background: var(--te-common-bg-default);
      border-bottom: 1px solid var(--ti-lowcode-data-header-border-bottom-color);
      .options-wrap {
        display: flex;
        column-gap: 8px;
        align-items: center;
        :deep(button.tiny-button.tiny-button--primary) {
          display: flex;
          align-items: center;
          min-width: 40px;
          justify-content: center;
          height: 24px;
          border-radius: 4px;
        }
      }
    }
  }

  :deep(.tiny-tabs__header) {
    padding: 8px;
  }

  :deep(.tiny-tabs__header .tiny-tabs__active-bar) {
    bottom: auto;
    top: 0;
    height: 2px;
    background-color: transparent;
  }

  :deep(.tiny-tabs__header .tiny-tabs__nav-wrap::after) {
    content: none;
  }

  :deep(.tiny-tabs__item) {
    flex: 1 1 auto;
    text-align: center;
  }

  :deep(.tiny-tabs__nav) {
    float: none;
    display: flex;
    flex-wrap: wrap;
  }

  :deep(.tiny-tabs__content) {
    margin: 0;
    padding: 0;
  }
  :deep(.help-box) {
    position: absolute;
    left: 60px;
    top: 10px;
  }
}
</style>
