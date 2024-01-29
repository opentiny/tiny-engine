<template>
  <plugin-setting v-if="isOpen" title="设置数据源">
    <template #header>
      <button-group>
        <tiny-button class="field-save" type="primary" @click="save">保存</tiny-button>
        <div class="field-handler" @click="deleteDataSource" v-if="editable" tips="删除">
          <svg-button name="text-source-delete"></svg-button>
        </div>
      </button-group>
      <svg-button class="close-plugin-setting-icon" name="close" @click="closeAllPanel"></svg-button>
    </template>
    <template #content>
      <tiny-form label-width="0">
        <!-- dataSource类型 -->
        <data-source-type v-model="state.dataSource.data.type" :editable="editable"></data-source-type>

        <!-- dataSource name -->
        <data-source-name v-model="state.dataSource.name"></data-source-name>

        <!-- dataSource field -->
        <data-source-field
          v-model="state.dataSource.data.columns"
          :editable="editable"
          @openRemotePanel="openRemotePanel"
        ></data-source-field>
      </tiny-form>
    </template>
  </plugin-setting>
</template>

<script lang="jsx">
import { reactive, ref, watch } from 'vue'
import { Form, Button } from '@opentiny/vue'
import { ButtonGroup, PluginSetting, SvgButton } from '@opentiny/tiny-engine-common'
import DataSourceType from './DataSourceType.vue'
import DataSourceName, { getDataSourceName } from './DataSourceName.vue'
import DataSourceField from './DataSourceField.vue'
import { close as closeRemotePanel, open as openRemotePanel } from './DataSourceRemotePanel.vue'
import {
  requestUpdateDataSource,
  requestAddDataSource,
  fetchTemplateDetail,
  requestDeleteDataSource,
  requestGenerateDataSource
} from './js/http'
import { useModal, useApp, useDataSource } from '@opentiny/tiny-engine-controller'
import { extend } from '@opentiny/vue-renderless/common/object'

let isOpen = ref(false)

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
    DataSourceField
  },
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    },
    editable: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue', 'save'],
  setup(props, { emit }) {
    const { confirm, message } = useModal()
    const { appInfoState } = useApp()
    const { dataSourceState } = useDataSource()

    const state = reactive({
      dataSource: {}
    })

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

        dataSourceState.dataSourceColumn = { name, type: type || 'array', columns: filterColumns }
        dataSourceState.dataSourceColumnCopies = extend(true, {}, dataSourceState.dataSourceColumn)
      }
    )

    const closeAllPanel = () => {
      close()
      closeRemotePanel()
    }

    const deleteDataSource = () => {
      const execDelete = () =>
        requestDeleteDataSource(state.dataSource.id)
          .then((data) => {
            if (data) {
              requestGenerateDataSource(appInfoState.selectedId)
              confirm({
                title: '提示',
                message: { render: () => <span>数据源删除成功</span> },
                exec: () => {
                  close()
                  emit('save')
                }
              })
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

    const save = () => {
      getDataSourceName().validate((valid) => {
        if (valid) {
          close()
          closeRemotePanel()

          const columns = state.dataSource.data.columns.map(({ name, title, type, format, field }) => {
            return {
              name,
              title,
              field,
              type,
              format
            }
          })

          if (props.editable) {
            requestUpdateDataSource(state.dataSource.id, {
              name: state.dataSource.name,
              data: Object.assign(state.dataSource.data, { columns, ...dataSourceState.remoteConfig })
            }).then(() => {
              requestGenerateDataSource(appInfoState.selectedId)
              // 修改dataSource成功
              confirm({
                title: '提示',
                message: { render: () => <span>数据源修改成功</span> },
                exec: () => {
                  emit('save')
                  dataSourceState.dataSourceColumn = {}
                  dataSourceState.dataSourceColumnCopies = {}
                }
              })
            })
          } else {
            requestAddDataSource({
              name: state.dataSource.name,
              app: appInfoState.selectedId,
              data: {
                columns,
                data: [],
                type: state.dataSource.data.type ? state.dataSource.data.type : 'array',
                ...dataSourceState.remoteConfig
              }
            })
              .then(() => {
                requestGenerateDataSource(appInfoState.selectedId)
                confirm({
                  title: '提示',
                  message: { render: () => <span>数据源新增成功</span> },
                  exec: () => {
                    emit('save')
                    dataSourceState.dataSourceColumn = {}
                    dataSourceState.dataSourceColumnCopies = {}
                  }
                })
              })
              .catch((error) => {
                message({ message: `数据源保存失败：${error?.message || ''}`, status: 'error' })
              })
          }
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

    return {
      state,
      isOpen,
      save,
      closeAllPanel,
      openRemotePanel,
      selectDataSourceTemplate,
      deleteDataSource
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
    background-color: var(--ti-lowcode-datasource-delete-button-hover-bg);
  }
}
.field-handler {
  cursor: pointer;
  margin: 2px 10px 4px 10px;
  font-size: 16px;
}
</style>
