<template>
  <div class="remote">
    <plugin-setting title="查看远程字段" class="remote-setting plugin-datasource" :isSecond="true">
      <template #header>
        <button-group>
          <tiny-button class="field-save" type="primary" @click="saveMapping">保存</tiny-button>
          <svg-button name="close" @click="closePanel"></svg-button>
        </button-group>
      </template>
      <template #content>
        <div class="create-config">
          <div>
            <tiny-collapse v-model="state.activeName">
              <tiny-collapse-item name="result">
                <template #title>请求结果</template>
                <data-srouce-remote-data-result
                  v-model="state.remoteData.result"
                  @change="resultChange"
                ></data-srouce-remote-data-result>
              </tiny-collapse-item>
              <tiny-collapse-item name="field">
                <template #title>查看字段</template>
                <data-source-remote-result-mapping
                  ref="dataSourceRemoteResultMappingref"
                  :data="mappingData()"
                  :modelValue="state.remoteFields"
                ></data-source-remote-result-mapping>
              </tiny-collapse-item>
            </tiny-collapse>
          </div>
        </div>
      </template>
    </plugin-setting>
  </div>
</template>

<script lang="ts">
import { reactive, watch, ref, computed } from 'vue'
import { Collapse, CollapseItem, Button } from '@opentiny/vue'
import { ButtonGroup, PluginSetting, SvgButton } from '@opentiny/tiny-engine-common'
import DataSrouceRemoteDataResult from './DataSourceRemoteDataResult.vue'
import DataSourceRemoteResultMapping from './DataSourceRemoteResultMapping.vue'
import { useLayout, useDataSource } from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'

const { string2Obj } = utils

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
    TinyButton: Button,
    TinyCollapseItem: CollapseItem,
    PluginSetting,
    ButtonGroup,
    SvgButton,
    DataSrouceRemoteDataResult,
    DataSourceRemoteResultMapping
  },
  props: {
    editable: {
      type: Boolean,
      default: true
    },
    remoteData: {
      type: Object,
      default: () => ({})
    },
    modelValue: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['confirm'],
  setup(props, { emit }) {
    const dataSourceRemoteResultMappingref = ref(null)
    const { dataSourceState } = useDataSource()

    const { PLUGIN_NAME, getPluginByLayout } = useLayout()
    const align = computed(() => getPluginByLayout(PLUGIN_NAME.Collections))

    const state = reactive({
      remoteData: props.remoteData,
      activeName: ['result', 'field'],
      remoteFields: {}
    })

    watch(
      () => props.modelValue,
      (value) => {
        state.remoteFields = value || {}
      },
      { immediate: true }
    )

    watch(
      () => props.remoteData,
      (value) => {
        state.remoteData = value || {}
      },
      { immediate: true, deep: true }
    )

    const mappingData = () => {
      const data = state.remoteData.result
      let params = state.remoteData.options?.params

      if (params) {
        params = string2Obj(params)
      }

      dataSourceState.remoteConfig = {
        options: { ...state.remoteData.options, params },
        ...state.remoteData.dataSourceRemoteAdapteRef
      }
      return data
    }

    const resultChange = (data) => {
      state.remoteData.result = string2Obj(data)

      mappingData()
    }

    const saveMapping = () => {
      const newColumns = dataSourceRemoteResultMappingref.value.saveMapping()
      emit('update:modelValue', newColumns)
      emit('activeTab', 'field')
      close()
    }

    return {
      align,
      state,
      closePanel: close,
      isOpen,
      saveMapping,
      resultChange,
      mappingData,
      dataSourceRemoteResultMappingref
    }
  }
}
</script>

<style lang="less" scoped>
.remote {
  .remote-setting {
    :deep(.plugin-save) {
      display: none;
    }
  }
  :deep(.plugin-setting-content) {
    padding: 0;
  }
  .create-config {
    :deep(.title) {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: var(--te-datasource-toolbar-bg-color);
      border-top: 1px solid var(--te-datasource-tabs-border-color);
      color: var(--te-datasource-toolbar-breadcrumb-text-color);
    }
    .send {
    }
    .tip-dot {
      padding-left: 4px;
      color: var(--te-datasource-description-text-color-error);
    }

    .use-service {
      color: var(--te-datasource-toolbar-breadcrumb-text-color);
      font-size: 12px;
      margin-top: 10px;

      span {
        color: var(--te-datasource-description-text-color-error);
      }
    }

    :deep(.send-service) {
      text-align: right;
      border-top: 1px solid var(--te-datasource-tabs-border-color);
      padding: 12px 0px 0px;

      .use-service {
        text-align: left;
        padding-top: 5px;
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
      box-sizing: border-box;
      overflow-y: scroll;
      :deep(.tiny-tabs.tiny-tabs--button-card .tiny-tabs__item) {
        border-radius: 4px;
        &:hover {
          color: var(--te-datasource-common-text-color-primary);
        }
      }
      :deep(.tiny-tabs__content) {
        margin: 12px 0;
      }
      :deep(.is-active) {
        .tiny-tabs__item__title {
          color: var(--te-datasource-common-text-color-primary);
        }
      }
    }
    :deep(.tiny-collapse) {
      .tiny-collapse-item:first-child {
        border-top: 0;
      }
      .tiny-collapse-item__header {
        .tiny-collapse-item__word-overflow {
          margin: var(--te-common-vertical-item-spacing-normal) 0px 0;
        }
      }
    }
  }
}
</style>
