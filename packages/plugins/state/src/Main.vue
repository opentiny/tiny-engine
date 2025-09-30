<template>
  <plugin-panel
    id="data-source"
    title="状态管理"
    class="plugin-state"
    :fixed-name="PLUGIN_NAME.State"
    :fixedPanels="fixedPanels"
    :docsUrl="docsUrl"
    :docsContent="docsContent"
    :isShowDocsIcon="true"
    @close="closePanel"
  >
    <template #content>
      <div class="data-source-left-panel">
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
      <div class="data-source-right-panel" v-if="isPanelShow" :style="alignStyle">
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
    </template>
  </plugin-panel>
</template>

<script lang="ts">
/* metaService: engine.plugins.state.Main */
import { reactive, ref, computed, onActivated, watch, provide } from 'vue'
import type { Component } from 'vue'
import { Button, Search, Tabs, TabItem } from '@opentiny/vue'
import {
  useCanvas,
  useHistory,
  useNotify,
  useHelp,
  useLayout,
  getMetaApi,
  META_APP,
  META_SERVICE
} from '@opentiny/tiny-engine-meta-register'
import { getCommentByKey } from '@opentiny/tiny-engine-common/js/comment'
import { iconSearch } from '@opentiny/vue-icon'
import { CloseIcon, PluginPanel } from '@opentiny/tiny-engine-common'
import DataSourceList from './DataSourceList.vue'
import CreateVariable from './CreateVariable.vue'
import CreateStore from './CreateStore.vue'
import { STATE, OPTION_TYPE } from './js/constants'
import { validateMonacoEditorData } from './js/common'

type StoreRefInstance = InstanceType<typeof CreateStore>
type VariableRefInstance = InstanceType<typeof CreateVariable>

export default {
  components: {
    TinySearch: Search,
    TinyButton: Button as Component,
    DataSourceList,
    CreateVariable,
    CloseIcon,
    TinyTabs: Tabs,
    TinyTabItem: TabItem,
    CreateStore,
    PluginPanel,
    TinyIconSearch: iconSearch()
  },
  props: {
    fixedPanels: {
      type: Array
    }
  },
  setup(props, { emit }) {
    const variableRef = ref<VariableRefInstance | null>(null)
    const storeRef = ref<StoreRefInstance | null>(null)
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
    const docsContent = '对 state 的响应式变量进行系统管理，包含添加、删除、搜索、编辑 state。'
    const state = reactive<{
      dataSource: Record<string, any>
      createData: {
        name: string
        description: string
        variable: string
      }
    }>({
      dataSource: {},
      createData: {
        name: '',
        description: '',
        variable: ''
      }
    })
    const selectedKey = ref<string>('')
    const { getGlobalState, updateGlobalState, addGlobalState, deleteGlobalState } = getMetaApi(
      META_SERVICE.GlobalStateService
    )
    const globalState = computed(() => {
      const list = getGlobalState()
      return list.reduce((acc: Record<string, any>, store: Record<string, any>) => ({ ...acc, [store.id]: store }), {})
    })

    const { PLUGIN_NAME, getPluginWidth, getPluginByLayout } = useLayout()

    const firstPanelOffset = computed(() => {
      return getPluginWidth(PLUGIN_NAME.State) + 1
    })

    const alignStyle = computed(() => {
      const panelAlign = getPluginByLayout(PLUGIN_NAME.State)
      const align = panelAlign.includes('left') ? 'left' : 'right'
      return `${align}: ${firstPanelOffset.value}px`
    })

    const panelState = reactive({
      emitEvent: emit
    })

    provide('panelState', panelState)

    watch(activeName, () => {
      selectedKey.value = ''
    })

    const openPanel = (flagValue: typeof OPTION_TYPE[keyof typeof OPTION_TYPE], key = '') => {
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
      selectedKey.value = flagValue === OPTION_TYPE.UPDATE ? key : ''
    }

    const cancel = () => {
      errorMessage.value = ''
      isPanelShow.value = false
      selectedKey.value = ''
    }

    const add = (name: string, variable: Record<string, any>) => {
      const { getSchema } = useCanvas()

      if (getSchema()) {
        if (updateKey.value !== name && flag.value === OPTION_TYPE.UPDATE) {
          delete state.dataSource[updateKey.value]
        }
        state.dataSource[name] = variable
      }
    }

    const validName = (name: string) => {
      errorMessage.value = name
    }

    const notifySaveError = (message: string) => {
      useNotify({
        title: '保存错误',
        type: 'error',
        message
      })
    }

    const updateName = (value: string) => {
      state.createData.name = value
    }

    // 删除应用状态
    const removeStore = async (key: string) => {
      try {
        await deleteGlobalState(key)

        // 如果删除的是当前编辑的状态变量，则需要关闭二级面板
        if (state.createData.name === key) {
          isPanelShow.value = false
        }
      } catch (error) {
        useNotify({
          title: '删除失败',
          type: 'error',
          message: error instanceof Error ? error.message : '删除失败'
        })
      }
    }

    // 更新或添加应用状态
    const updateOrAddGlobalState = async () => {
      try {
        if (!storeRef.value) {
          return
        }
        await storeRef.value.validateForm()
        const validateResult = validateMonacoEditorData(storeRef.value.getEditor(), 'state字段', { required: true })

        if (!validateResult.success) {
          notifySaveError(validateResult.message)
          return
        }

        const editor = storeRef.value.getEditor() as { getValue: () => string }
        const storeState = editor?.getValue?.()
        const getters = storeRef.value.saveMethods('gettersEditor')
        const actions = storeRef.value.saveMethods('actionsEditor')
        const { name } = state.createData
        const store = {
          id: name,
          state: storeState,
          getters,
          actions
        }

        const isUpdate = Boolean(globalState.value[name])

        if (isUpdate) {
          await updateGlobalState(store)
        } else {
          await addGlobalState(store)
        }

        isPanelShow.value = false
        useNotify({ message: '保存成功!', type: 'success' })
        openCommon()
      } catch (error) {
        useNotify({ message: '保存失败!', type: 'error' })
      }
    }

    const confirm = async () => {
      const { name } = state.createData
      const { getSchema, updateSchema } = useCanvas()

      if (activeName.value === STATE.CURRENT_STATE) {
        if (!variableRef.value) {
          return
        }

        try {
          // 校验
          await variableRef.value.validateForm()
          // 获取数据
          const variable = variableRef.value.getFormData()

          // 保存数据
          add(name, variable)
          isPanelShow.value = false
          setSaved(false)

          const schema = getSchema()
          updateSchema({ state: { ...(schema.state || {}), [name]: variable } })

          useHistory().addHistory()

          const isFixed = props.fixedPanels?.includes(PLUGIN_NAME.State)
          // 如果面板没有固定，临时固定，避免因保存时清空选中状态导致的面板关闭
          if (!isFixed) {
            useLayout().changeLeftFixedPanels(PLUGIN_NAME.State)
          }
          await openCommon()
          // 恢复原来固定的状态
          if (!isFixed) {
            useLayout().changeLeftFixedPanels(PLUGIN_NAME.State)
          }
        } catch (error) {
          useNotify({ message: '保存失败!', type: 'error' })
        }
      } else {
        await updateOrAddGlobalState()
      }
    }

    const search = (value: string) => {
      if (value === undefined) {
        return
      }

      query.value = value
    }

    const remove = (key) => {
      const { getSchema, updateSchema } = useCanvas()

      delete state.dataSource[key]

      const schema = getSchema()
      const { lifeCycles } = schema
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

    const closePanel = () => {
      emit('close')
    }

    const initDataSource = (tabsName = activeName.value) => {
      const { getSchema } = useCanvas()

      if (tabsName === STATE.GLOBAL_STATE) {
        state.dataSource = globalState.value || {}
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

    // 应用状态发生变化时，同步到 state.dataSource
    watch(globalState, () => {
      if (activeName.value !== STATE.GLOBAL_STATE) {
        return
      }

      state.dataSource = globalState.value
    })

    // 切换 tab，切换显示页面状态或者是应用状态
    watch(
      () => activeName.value,
      () => {
        const { getSchema } = useCanvas()
        const pageSchema = getSchema() || {}

        if (activeName.value === STATE.GLOBAL_STATE) {
          state.dataSource = globalState.value || {}
        } else {
          state.dataSource = pageSchema.state || {}
        }
      },
      {
        immediate: true
      }
    )

    return {
      alignStyle,
      firstPanelOffset,
      PLUGIN_NAME,
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
      docsUrl,
      docsContent,
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
        border-color: var(--te-state-add-btn-border-color);
        &:hover {
          border-color: var(--te-state-add-btn-border-color-hover);
        }
      }
      .add-btn-icon {
        margin-right: 4px;
        font-size: 16px;
        color: var(--te-state-add-btn-icon-color);
        vertical-align: sub;
      }
      .add-btn-text {
        display: inline-block;
      }
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
    box-shadow: 6px 0px 3px 0px var(--te-state-panel-shadow-color);
    border-right: 1px solid var(--te-state-common-border-color-divider);
    background: var(--te-state-common-bg-color);
    position: absolute;
    top: 0;

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 45px;
      padding: 0 12px;
      font-size: 12px;
      font-weight: 700;
      color: var(--te-state-common-text-color);
      background: var(--te-state-common-bg-color);
      border-bottom: 1px solid var(--te-state-common-border-color-divider);
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
    padding: 0 8px 8px 8px;
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
