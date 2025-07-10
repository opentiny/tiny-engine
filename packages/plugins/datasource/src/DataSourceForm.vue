<template>
  <plugin-setting
    v-if="isOpen"
    title="设置数据源"
    class="data-source-form plugin-datasource"
    :fixed-name="PLUGIN_NAME.Collections"
    :align="align"
  >
    <template #header>
      <button-group>
        <tiny-button class="field-save" type="primary" @click="save">保存</tiny-button>
        <svg-button name="delete" v-if="editable" @click="deleteDataSource"></svg-button>
        <svg-button name="close" @click="closeAllPanel"></svg-button>
      </button-group>
    </template>
    <template #content>
      <tiny-form label-width="0">
        <!-- dataSource类型 -->
        <data-source-type v-model="state.dataSource.data.type" :editable="editable"></data-source-type>

        <!-- dataSource name -->
        <data-source-name v-model="state.dataSource.name"></data-source-name>

        <!-- dataSource settings -->
      </tiny-form>
      <data-source-settings
        v-model="state.dataSource"
        :editable="editable"
        ref="settingRef"
        @renderRemoteData="renderRemoteData"
        :activeTabName="state.activeTabName"
        @activeTab="activeTabChange"
      ></data-source-settings>
    </template>
  </plugin-setting>
</template>

<script lang="tsx">
/* metaService: engine.plugins.collections.DataSourceForm */
import { reactive, ref, watch, computed } from 'vue'
import { Form, Button } from '@opentiny/vue'
import { camelize, capitalize } from '@vue/shared'
import { ButtonGroup, PluginSetting, SvgButton } from '@opentiny/tiny-engine-common'
import DataSourceType from './DataSourceType.vue'
import DataSourceName, { getDataSourceName } from './DataSourceName.vue'
import { getServiceForm } from './DataSourceRemoteForm.vue'
import DataSourceSettings from './DataSourceSettings.vue'
import { close as closeRemoteResult, open as openRemoteResult } from './DataSourceSettingRemoteResult.vue'
import { getRecordGrid } from './DataSourceSettingRecordList.vue'
import {
  requestUpdateDataSource,
  requestAddDataSource,
  fetchTemplateDetail,
  requestDeleteDataSource,
  requestGenerateDataSource
} from './js/http'
import {
  useLayout,
  useModal,
  useDataSource,
  useNotify,
  getMetaApi,
  META_SERVICE,
  useCanvas
} from '@opentiny/tiny-engine-meta-register'
import { extend } from '@opentiny/vue-renderless/common/object'

const isOpen = ref(false)

export const open = () => {
  isOpen.value = true
}

export const close = () => {
  isOpen.value = false
}

export default {
  components: {
    ButtonGroup,
    SvgButton,
    TinyForm: Form,
    TinyButton: Button,
    PluginSetting,
    DataSourceType,
    DataSourceName,
    DataSourceSettings
  },
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    },
    editable: {
      type: Boolean,
      default: true
    },
    activeTabName: {
      type: String,
      default: 'remote'
    }
  },
  emits: ['update:modelValue', 'save'],
  setup(props, { emit }) {
    const { message } = useModal()
    const { dataSourceState } = useDataSource()

    const settingRef = ref(null)

    const state = reactive({
      dataSource: {},
      activeTabName: props.activeTabName
    })

    const { PLUGIN_NAME, getPluginByLayout } = useLayout()
    const align = computed(() => getPluginByLayout(PLUGIN_NAME.Collections))

    watch(
      () => state.dataSource.name,
      (value) => {
        dataSourceState.dataSourceColumn.name = value
      }
    )

    watch(
      () => state.dataSource.data?.columns,
      (value) => {
        if (!value || !state.dataSource.id) {
          return
        }

        dataSourceState.dataSourceColumn.columns = value?.map(({ name, title, type, format }) => ({
          name,
          title,
          type,
          format
        }))
      },
      { deep: true }
    )

    watch(
      () => props.modelValue,
      (value) => {
        state.dataSource = value || {}
        const {
          id,
          name,
          data: { columns, type }
        } = value

        if (!id) {
          return
        }

        const filterColumns = (columns || []).map(({ name, title, type, format }) => ({
          name,
          title,
          type,
          format
        }))

        dataSourceState.dataSourceColumn = { name, type: type || 'remote', columns: filterColumns }
        dataSourceState.dataSourceColumnCopies = extend(true, {}, dataSourceState.dataSourceColumn)
      },
      { immediate: true }
    )

    watch(
      () => props.activeTabName,
      (value) => {
        state.activeTabName = value
      },
      { immediate: true, deep: true }
    )

    const closeAllPanel = () => {
      close()
      closeRemoteResult()
    }

    const getAppId = () => getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id

    const deleteDataSource = () => {
      const execDelete = () =>
        requestDeleteDataSource(state.dataSource.id)
          .then((data) => {
            if (data) {
              requestGenerateDataSource(getAppId())
              useNotify({
                title: '数据源删除成功',
                type: 'success'
              })
              close()
              emit('save')
            }
          })
          .catch((error) => {
            message({ message: `数据源删除失败,${error?.message || ''}`, status: 'error' })
          })

      useModal().confirm({
        message: '确认删除此条数据源配置吗？',
        exec: execDelete
      })
    }

    const activeTabChange = (name) => {
      emit('activeTab', name)
    }

    const save = async () => {
      try {
        // await validate() 如果验证不通过会抛出异常，而不是返回 false
        await getServiceForm().validate()
      } catch (error) {
        activeTabChange('remote')
        return
      }
      getDataSourceName().validate(async (valid) => {
        if (valid) {
          const columns = state.dataSource.data.columns.map(({ name, title, type, format, field }) => {
            return {
              name,
              title,
              field,
              type,
              format
            }
          })

          try {
            // await validate() 如果验证不通过会抛出异常，而不是返回 false
            await getRecordGrid().fullValidate()
          } catch (error) {
            activeTabChange('record')
            return
          }

          settingRef.value.saveRecord().then((record) => {
            const editRequestData = {
              name: state.dataSource.name,
              data: Object.assign(state.dataSource.data, {
                columns,
                ...dataSourceState.remoteConfig,
                data: record ? record.requestData.data.data : state.dataSource.data.data
              })
            }
            const addRequestData = {
              columns,
              data: record ? record.requestData.data.data : [],
              type: state.dataSource.data.type ? state.dataSource.data.type : 'remote',
              ...dataSourceState.remoteConfig
            }
            if (props.editable) {
              requestUpdateDataSource(state.dataSource.id, editRequestData).then(() => {
                requestGenerateDataSource(getAppId())
                // 修改dataSource成功
                if (record) {
                  const { name } = record.requestData
                  const key = `datasource${capitalize(camelize(name))}`
                  const pageSchema = useCanvas().getSchema()

                  if (pageSchema.state[key]) {
                    pageSchema.state[key] = record.data.map(({ _id, ...other }) => other)
                  }
                }
                useNotify({
                  title: '数据源修改成功',
                  type: 'success'
                })
                emit('save')
                dataSourceState.dataSourceColumn = {}
                dataSourceState.dataSourceColumnCopies = {}
                dataSourceState.remoteConfig = {}
              })
            } else {
              requestAddDataSource({
                name: state.dataSource.name,
                app: getAppId(),
                data: addRequestData
              })
                .then(() => {
                  requestGenerateDataSource(getAppId())
                  useNotify({
                    title: '数据源新增成功',
                    type: 'success'
                  })
                  emit('save')
                  dataSourceState.dataSourceColumn = {}
                  dataSourceState.dataSourceColumnCopies = {}
                  dataSourceState.remoteConfig = {}
                })
                .catch((error) => {
                  message({ message: `数据源保存失败：${error?.message || ''}`, status: 'error' })
                })
            }
          })
          close()
          closeRemoteResult()
        }
      })
    }

    const selectDataSourceTemplate = (templateId) => {
      fetchTemplateDetail(templateId).then((res) => {
        if (res && res.length > 0) {
          state.dataSource.data.columns = (res[0].data.columns || []).map(({ title, field, name, type }) => ({
            title,
            name,
            field,
            type,
            format: {}
          }))
        }
      })
    }

    const renderRemoteData = (remoteData) => {
      emit('renderRemoteData', remoteData)
    }

    watch(
      () => state.dataSource.data?.type,
      (value) => {
        activeTabChange(value)
      }
    )

    return {
      align,
      settingRef,
      PLUGIN_NAME,
      state,
      isOpen,
      save,
      closeAllPanel,
      openRemoteResult,
      selectDataSourceTemplate,
      deleteDataSource,
      renderRemoteData,
      activeTabChange
    }
  }
}
</script>
<style lang="less" scoped>
.datasource-form-footer {
  padding: 12px;
  .tiny-svg {
    margin-right: 6px;
  }

  .del:hover {
    background-color: var(--te-datasource-delete-button-bg-color-hover);
  }
}
</style>
