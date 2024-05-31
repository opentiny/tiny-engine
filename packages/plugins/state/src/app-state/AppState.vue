<template>
  <div class="state-list">
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
      <tiny-button @click="addState(OPTION_TYPE.ADD)">添加全局变量</tiny-button>
    </div>
    <data-source-list
      :modelValue="Object.keys(state.dataSource)"
      :stateScope="activeName"
      :query="query"
      :selectedKey="selectedKey"
      @openPanel="addState"
      @remove="remove"
      @removeStore="removeStore"
    />
    <div v-if="statePanelRef">
      <teleport to=".state-panel-content">
        <create-store
          ref="storeRef"
          :dataSource="state.dataSource"
          :flag="flag"
          :updateKey="updateKey"
          :storeData="state.createData"
          @nameInput="validName"
        />
      </teleport>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, reactive, computed } from 'vue'
import { Button, Search } from '@opentiny/vue'
import { IconSearch } from '@opentiny/vue-icon'
import {
  useCanvas,
  useHistory,
  useEditorInfo,
  useResource,
  useNotify,
  useData,
  useLayout,
  useHelp
} from '@opentiny/tiny-engine-controller'
import DataSourceList from '../common/components/DataSourceList.vue'
import { STATE, OPTION_TYPE } from '../common/js/constants'
import { validateMonacoEditorData } from '../common/js/common'
import { updateGlobalState } from '../common/js/http'
import CreateStore from './CreateStore.vue'

export default {
  components: {
    TinySearch: Search,
    TinyButton: Button,
    DataSourceList,
    CreateStore,
    TinyIconSearch: IconSearch()
  },
  props: {
    activeName: { type: String },
    openPanel: { type: Function },
    closePanel: { type: Function },
    isPanelShow: {
      type: Boolean,
      default: false
    },
    statePanelRef: {
      type: Object
    }
  },
  setup(props, { expose }) {
    const variableRef = ref(null)
    const storeRef = ref(null)
    const errorMessage = ref('')
    const flag = ref('')
    const query = ref('')
    const updateKey = ref('')
    const addDataSource = ref('添加变量')
    const isBlock = computed(() => useCanvas().isBlock())
    const { setSaved } = useCanvas()
    const { PLUGIN_NAME, getPluginApi } = useLayout()
    const { openCommon } = getPluginApi(PLUGIN_NAME.save)
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

    const addState = (flagValue, key = '') => {
      updateKey.value = key
      flag.value = flagValue
      const isCurrent = props.activeName === STATE.CURRENT_STATE
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

      props.openPanel(addDataSource.value)
      selectedKey.value = flagValue === OPTION_TYPE.UPDATE ? key : null
    }

    const cancel = () => {
      errorMessage.value = ''
      selectedKey.value = null
    }

    const add = (name, variable) => {
      const { getSchema } = useCanvas().canvasApi.value

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
      const { setState, setGlobalState } = useCanvas().canvasApi.value

      if (!name || errorMessage.value) {
        notifySaveError('变量名未填写或名称不符合规范，请按照提示修改后重试。')
        return
      }

      if (props.activeName === STATE.CURRENT_STATE) {
        // 校验
        const validateResult = variableRef.value.validate()
        if (!validateResult.success) {
          notifySaveError(validateResult.message)
          return
        }

        // 获取数据
        let variable = variableRef.value.getFormData()

        // 保存数据
        add(name, variable)
        props.closePanel()
        setSaved(false)

        // 触发画布渲染
        setState({ [name]: variable })
        useHistory().addHistory()
      } else {
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

        const { id } = useEditorInfo().useInfo()
        updateGlobalState(id, { global_state: storeList }).then((res) => {
          props.closePanel()
          setGlobalState(res.global_state || [])
        })
      }
      openCommon()
    }

    const search = (value) => {
      if (value === undefined) {
        return
      }

      query.value = value
    }

    const remove = (key) => {
      const { deleteState, getSchema } = useCanvas().canvasApi.value

      delete state.dataSource[key]
      // 删除变量也需要同步触发画布渲染
      deleteState(key)

      if (key.startsWith('datasource')) {
        const pageSchema = getSchema()
        const { getCommentByKey } = useData()
        const { start, end } = getCommentByKey(key)

        /**
         * 匹配提前注入的 loadDataSource 表达式和注释，级联删除
         * 等价：/([\s\n]*\/\*\* start \*\/[\s\S]*\/\*\* end \*\/)/
         * "任意换行或空白字符 /** start-key *\/ 任意字符 /** end-key *\/"，该字符串会被匹配
         */
        const pattern = new RegExp(`([\\s\\n]*\\/\\*\\* ${start} \\*\\/[\\s\\S]*\\/\\*\\* ${end} \\*\\/)`)

        pageSchema.lifeCycles.setup.value = pageSchema.lifeCycles.setup.value.replace(pattern, '')
      }

      // 如果删除的是当前编辑的状态变量，则需要关闭二级面板
      if (state.createData.name === key) {
        props.closePanel()
      }

      setSaved(false)
    }

    const setGlobalStateToDataSource = () => {
      const { getGlobalState } = useCanvas().canvasApi.value
      const globalState = getGlobalState()

      if (!globalState) {
        state.dataSource = {}

        return
      }

      state.dataSource = getGlobalState().reduce((acc, store) => ({ ...acc, [store.id]: store }), {})
    }

    const removeStore = (key) => {
      const storeListt = [...useResource().resState.globalState] || []
      const index = storeListt.findIndex((store) => store.id === key)
      const { setGlobalState } = useCanvas().canvasApi.value

      if (index !== -1) {
        const { id } = useEditorInfo().useInfo()

        storeListt.splice(index, 1)
        updateGlobalState(id, { global_state: storeListt }).then((res) => {
          setGlobalState(res.global_state)
          setGlobalStateToDataSource()
        })

        // 如果删除的是当前编辑的状态变量，则需要关闭二级面板
        if (state.createData.name === key) {
          props.closePanel()
        }
      }
    }

    const initDataSource = (tabsName = props.activeName) => {
      const { getSchema } = useCanvas().canvasApi.value

      if (tabsName === STATE.GLOBAL_STATE) {
        setGlobalStateToDataSource()
      } else {
        const pageSchema = getSchema() || {}

        pageSchema.state = pageSchema?.state || {}
        state.dataSource = pageSchema.state
      }
    }

    onMounted(() => {
      initDataSource()
    })

    expose({ confirm, cancel })

    return {
      isBlock,
      errorMessage,
      state,
      variableRef,
      addDataSource,
      updateName,
      cancel,
      confirm,
      search,
      query,
      remove,
      validName,
      flag,
      updateKey,
      selectedKey,
      STATE,
      removeStore,
      storeRef,
      OPTION_TYPE,
      open,
      docsUrl,
      addState
    }
  }
}
</script>
<style lang="less" scoped>
.state-list {
  .add-btn {
    margin: 10px 0px 0px 10px;
    max-width: none;
  }

  .left-filter {
    margin-top: 12px;
    padding: 0 10px;
  }
}
</style>
