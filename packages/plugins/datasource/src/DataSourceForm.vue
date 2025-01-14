<template>
  <plugin-setting v-if="isOpen" title="设置数据源" class="data-source-form">
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
import { useModal, useDataSource, useNotify, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
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
    const { message } = useModal()
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
              requestGenerateDataSource(getAppId())
              // 修改dataSource成功
              useNotify({
                title: '数据源修改成功',
                type: 'success'
              })
              emit('save')
              dataSourceState.dataSourceColumn = {}
              dataSourceState.dataSourceColumnCopies = {}
            })
          } else {
            requestAddDataSource({
              name: state.dataSource.name,
              app: getAppId(),
              data: {
                columns,
                data: [],
                type: state.dataSource.data.type ? state.dataSource.data.type : 'array',
                ...dataSourceState.remoteConfig
              }
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
</style>
