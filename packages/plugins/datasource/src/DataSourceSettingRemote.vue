<template>
  <div class="data-source-setting-remote">
    <div>
      <data-source-remote-form v-model="state.remoteData.options"></data-source-remote-form>
      <data-source-remote-autoload v-model="state.remoteData.options.isSync"></data-source-remote-autoload>
      <div class="tabBox">
        <div class="title">请求设置</div>
        <tiny-tabs v-model="state.activeNameTabs" tab-style="button-card">
          <tiny-tab-item class="json-tab" title="请求JSON参数" name="jsonsTab">
            <data-source-remote-parameter v-model="state.remoteData.options.params"></data-source-remote-parameter>
          </tiny-tab-item>
          <tiny-tab-item title="请求处理" name="responseTab">
            <data-source-remote-adapter
              ref="dataSourceRemoteAdapteRef"
              v-model="state.responseData"
            ></data-source-remote-adapter>
          </tiny-tab-item>
        </tiny-tabs>
      </div>
    </div>
    <tiny-button type="primary" @click.stop="sendRequest" class="send"> 查看远程字段</tiny-button>
  </div>
</template>

<script lang="ts">
import { reactive, watch, ref } from 'vue'
import { TinyTabs, TinyTabItem, TinyButton } from '@opentiny/vue'
import DataSourceRemoteForm, { getServiceForm } from './DataSourceRemoteForm.vue'
import DataSourceRemoteParameter from './DataSourceRemoteParameter.vue'
import DataSourceRemoteAutoload from './DataSourceRemoteAutoload.vue'
import DataSourceRemoteAdapter from './DataSourceRemoteDataAdapter.vue'
import { useNotify } from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'
import { getRequest } from './js/datasource'

const { reactiveObj2String: obj2String, string2Obj } = utils

export default {
  components: {
    TinyButton,
    TinyTabs,
    TinyTabItem,
    DataSourceRemoteForm,
    DataSourceRemoteParameter,
    DataSourceRemoteAutoload,
    DataSourceRemoteAdapter
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

    const state = reactive({
      remoteData: { options: {} },
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
        state.remoteData.options.params = obj2String(value?.options?.params)
        state.responseData.willFetch = willFetch?.value || ''
        state.responseData.dataHandler = dataHandler?.value || ''
        state.responseData.shouldFetch = shouldFetch?.value || ''
        state.responseData.errorHandler = errorHandler?.value || ''
        if (columns?.length === 0) {
          state.remoteData.result = {}
        }
      },
      { immediate: true }
    )

    const sendRequest = async () => {
      try {
        // await validate() 如果验证不通过会抛出异常，而不是返回 false
        await getServiceForm().validate()
      } catch (error) {
        throw new Error(`请先完成表单验证: ${error?.message || ''}`)
      }

      const options = { ...state.remoteData.options }

      if (options.params) {
        options.params = string2Obj(options.params)
      }

      emit('update:modelValue', { ...props.modelValue, options })

      const request = getRequest({ options, ...dataSourceRemoteAdapteRef.value.getEditorValue() })

      /**
       * 按照数据源请求面板的提示，dataSourceMap函数的相应结果的结构应该会是：
       * { code: string, msg: string, data: {items: any[], total: number} }
       */
      request
        .load()
        .then((res) => {
          state.remoteData.result = Array.isArray(res?.data?.items) ? res.data.items[0] : res?.data || res

          useNotify({
            type: 'success',
            title: '请求成功',
            message: '返回已填充到"请求结果"'
          })

          emit('renderRemoteData', {
            ...state.remoteData,
            dataSourceRemoteAdapteRef: dataSourceRemoteAdapteRef.value.getEditorValue()
          })
        })
        .catch((error) => {
          useNotify({
            type: 'error',
            title: '请求失败',
            message: error.message || '请求失败，请确认请求地址是否正确！'
          })
        })
    }

    return {
      state,
      dataSourceRemoteAdapteRef,
      sendRequest,
      closePanel: close
    }
  }
}
</script>

<style lang="less" scoped>
.data-source-setting-remote {
  .tabBox {
    .title {
      font-size: 12px;
      color: var(--te-datasource-label-text-color);
      margin-bottom: 12px;
    }
    :deep(.tiny-tabs.tiny-tabs) {
      .tiny-tabs__nav-scroll {
        margin-left: 0;
      }
      .tiny-tabs__item {
        background-color: var(--te-datasource-settings-remote-tabs-bg-color);
        margin-right: 0;
        &:first-child {
          border-top-left-radius: var(--te-base-border-radius-1);
          border-bottom-left-radius: var(--te-base-border-radius-1);
        }

        &:last-child {
          border-top-right-radius: var(--te-base-border-radius-1);
          border-bottom-right-radius: var(--te-base-border-radius-1);
        }

        &.is-active {
          border: 1px solid var(--te-datasource-settings-tabs-border-color-active);
          background-color: var(--te-datasource-settings-bg-color);
        }
        .tiny-tabs__item__title {
          padding: 0;
        }
      }
      .tiny-tabs__nav-wrap-not-separator::after {
        z-index: 2;
        background-color: transparent !important;
        margin-bottom: 16px;
      }
    }
  }
  .send {
    margin-top: 12px;
  }
}
</style>
