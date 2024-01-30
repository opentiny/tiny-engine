<template>
  <div>
    <plugin-setting title="获取远程字段" :isSecond="true" @cancel="closePanel" @save="saveRemote">
      <template #content>
        <div class="create-config">
          <data-source-remote-form v-model="state.remoteData.options"></data-source-remote-form>
          <data-source-remote-autoload v-model="state.remoteData.options.isSync"></data-source-remote-autoload>
          <div class="tabBox">
            <tiny-tabs v-model="state.activeNameTabs">
              <tiny-tab-item class="json-tab" title="请求JSON参数" name="jsonsTab">
                <data-source-remote-parameter v-model="state.remoteData.options.params"></data-source-remote-parameter>
              </tiny-tab-item>
              <tiny-tab-item title="请求处理" name="responseTab">
                <data-source-remote-adapter
                  ref="dataSourceRemoteAdapteRef"
                  v-model="state.responseData"
                  @sendRequst="sendRequest"
                ></data-source-remote-adapter>
              </tiny-tab-item>
            </tiny-tabs>
          </div>
          <div>
            <tiny-collapse v-model="state.activeName">
              <tiny-collapse-item name="result">
                <template #title> 请求结果</template>
                <data-srouce-remote-data-result v-model="state.remoteData.result"></data-srouce-remote-data-result>
              </tiny-collapse-item>
            </tiny-collapse>
          </div>
        </div>
      </template>
    </plugin-setting>
  </div>
</template>

<script>
import { reactive, watch, ref } from 'vue'
import { Collapse, CollapseItem, Tabs, TabItem } from '@opentiny/vue'
import { PluginSetting } from '@opentiny/tiny-engine-common'
import DataSourceRemoteForm, { getServiceForm } from './DataSourceRemoteForm.vue'
import DataSourceRemoteParameter from './DataSourceRemoteParameter.vue'
import DataSourceRemoteAutoload from './DataSourceRemoteAutoload.vue'
import DataSourceRemoteAdapter from './DataSourceRemoteDataAdapter.vue'
import DataSrouceRemoteDataResult, { getResponseData } from './DataSourceRemoteDataResult.vue'
import { open as openRemoteMapping } from './DataSourceRemoteMapping.vue'
import { useModal, useDataSource } from '@opentiny/tiny-engine-controller'
import { isEmptyObject } from '@opentiny/vue-renderless/common/type'
import { obj2String, string2Obj } from '@opentiny/tiny-engine-controller/adapter'
import { getRequest } from './js/datasource'

export const isOpen = ref(false)

export const open = () => {
  isOpen.value = true
}

export const close = () => {
  isOpen.value = false
}

export default {
  components: {
    TinyCollapse: Collapse,
    TinyCollapseItem: CollapseItem,
    TinyTabs: Tabs,
    TinyTabItem: TabItem,
    PluginSetting,
    DataSourceRemoteForm,
    DataSourceRemoteParameter,
    DataSourceRemoteAutoload,
    DataSourceRemoteAdapter,
    DataSrouceRemoteDataResult
  },
  props: {
    editable: {
      type: Boolean,
      default: true
    },
    modelValue: {
      type: Object,
      default: () => ({
        options: { name: '', descriptions: '', method: '', uri: '', params: '', isSync: true },
        willFetch: {},
        dataHandler: {},
        result: {},
        shouldFetch: {},
        errorHandler: {}
      })
    }
  },
  emits: ['confirm'],
  setup(props, { emit }) {
    const dataSourceRemoteAdapteRef = ref(null)
    const { confirm } = useModal()
    const { dataSourceState } = useDataSource()

    const state = reactive({
      remoteData: { options: {} },
      activeName: ['excute', 'result'],
      responseData: {
        shouldFetch: null,
        dataHandler: null,
        errorHandler: null,
        willFetch: null
      },
      activeNameTabs: 'jsonsTab'
    })

    watch(
      () => props.modelValue,
      (value) => {
        const { willFetch, dataHandler, shouldFetch, errorHandler, columns } = value
        state.remoteData.options = { ...value?.options } || {}
        state.remoteData.options.method = value.method || 'JSONP'
        state.remoteData.options.params = obj2String(value?.options?.params)
        state.responseData.willFetch = willFetch?.value || ''
        state.responseData.dataHandler = dataHandler?.value || ''
        state.responseData.shouldFetch = shouldFetch?.value || ''
        state.responseData.errorHandler = errorHandler?.value || ''
        columns?.length === 0 && (state.remoteData.result = {})
      },
      { immediate: true }
    )

    const saveRemote = () => {
      // 远程表单校验
      getServiceForm().validate((valid) => {
        if (valid) {
          state.remoteData.result = string2Obj(getResponseData())

          const save = () => {
            let params = state.remoteData.options?.params

            if (params) {
              params = string2Obj(params)
            }

            dataSourceState.remoteConfig = {
              options: { ...state.remoteData.options, params },
              ...dataSourceRemoteAdapteRef.value.getEditorValue()
            }

            state.remoteData.result = string2Obj(getResponseData())
            emit('confirm', state.remoteData.result)
            close()
          }

          save()
          if (!isEmptyObject(state.remoteData.result)) {
            openRemoteMapping()
          }
        }
      })
    }

    const sendRequest = () => {
      getServiceForm().validate((valid) => {
        if (!valid) {
          confirm({
            title: '提示',
            message: '请求地址和请求方式必填！！！'
          })

          return
        }
      })

      const options = { ...state.remoteData.options }

      if (options.params) {
        options.params = string2Obj(options.params)
      }

      const request = getRequest({ options, ...dataSourceRemoteAdapteRef.value.getEditorValue() })

      /**
       * 按照数据源请求面板的提示，dataSourceMap函数的相应结果的结构应该会是：
       * 对于对象数组：{ code: string, msg: string, data: {items: any[], total: number} }
       * 对于树结构：{ code: string, msg: string, data: any }
       */
      request
        .load()
        .then((res) => {
          state.remoteData.result = Array.isArray(res?.data?.items) ? res.data.items[0] : res?.data || res
        })
        .catch((error) => {
          useModal().message({ message: error.message || '请求失败，请确认请求地址是否正确！', status: 'error' })
        })
    }

    return {
      state,
      dataSourceRemoteAdapteRef,
      closePanel: close,
      saveRemote,
      sendRequest,
      isOpen
    }
  }
}
</script>

<style lang="less" scoped>
.create-config {
  :deep(.tiny-collapse .tiny-collapse-item__header) {
    font-size: 14px;
    font-weight: normal;
  }
  :deep(.title) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--ti-lowcode-datasource-toolbar-bg);
    border-top: 1px solid var(--ti-lowcode-datasource-tabs-border-color);
    color: var(--ti-lowcode-datasource-toolbar-breadcrumb-color);
  }

  .tip-dot {
    padding-left: 4px;
    color: var(--ti-lowcode-datasource-description-error-color);
  }

  .use-service {
    color: var(--ti-lowcode-datasource-toolbar-breadcrumb-color);
    font-size: 12px;
    margin-top: 10px;

    span {
      color: var(--ti-lowcode-datasource-description-error-color);
    }
  }

  :deep(.send-service) {
    text-align: right;
    border-top: 1px solid var(--ti-lowcode-datasource-tabs-border-color);
    padding: 20px 10px;
    margin-bottom: 10px;

    .use-service {
      text-align: left;
      padding-top: 5px;

      div {
        margin-bottom: 5px;
      }
    }

    .title {
      margin-bottom: 10px;
    }
  }

  :deep(.send-request) {
    margin: 12px;
  }

  .monaco-editor {
    height: 80px;
    margin-top: 8px;
  }
  .tabBox {
    height: 500px;
    box-sizing: border-box;
    overflow-y: scroll;
    :deep(.is-active) {
      border-bottom: 2px solid var(--ti-lowcode-datasource-tabs-bottom-border-color) !important;
      .tiny-tabs__item__title {
        color: var(--ti-lowcode-datasource-tabs-bottom-border-color);
      }
    }
    :deep(.tiny-tabs__item__title) {
      font-size: 14px;
    }
  }
  :deep(.tiny-tabs__item__title) {
    margin-right: 20px;
    margin-left: 15px;
    color: var(--ti-lowcode-datasource-label-color);
  }
}
</style>
