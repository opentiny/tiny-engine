<template>
  <plugin-setting v-if="isShow" :fixed-name="PLUGIN_NAME.Resource" :align="align" :title="state.title">
    <template #header>
      <svg-button name="close" @click="cancelResourceList"></svg-button>
    </template>

    <template #content>
      <div class="resource-list-content">
        <tiny-button round @click="openAddSourceForm"><svg-icon name="add"></svg-icon>添加资源</tiny-button>
        <span class="resource-description">支持上传png、jpg、svg文件，支持批量上传</span>
        <div class="action-wrap">
          <div>
            <span :class="[{ 'resource-type-active': sourceType === 'all' }]" @click="sourceTypeChange('all')"
              >全部</span
            >
            <tiny-divider direction="vertical"></tiny-divider>
            <span :class="[{ 'resource-type-active': sourceType === 'image' }]" @click="sourceTypeChange('image')"
              >图片</span
            >
          </div>
          <div class="batch-action">
            <tiny-button v-if="enableBatchAction" class="action-item" @click="batchDeleteSource">
              <svg-icon name="delete"></svg-icon>
              <span>删除</span>
            </tiny-button>
            <tiny-button @click="enableBatchAction = !enableBatchAction" class="action-item"> 批量操作 </tiny-button>
          </div>
        </div>
        <div class="source-list-wrap">
          <div v-for="item in state.sourceList" :key="item.id" class="source-list-item">
            <div class="source-image-wrap">
              <img :src="item.thumbnailUrl ?? item.resourceUrl" />
              <tiny-checkbox
                v-if="enableBatchAction"
                name="tiny-checkbox"
                @change="selectSource($event, item)"
              ></tiny-checkbox>
              <div class="source-action">
                <tiny-popover placement="bottom" :visible-arrow="false" :offset="-18" trigger="hover">
                  <div class="actions">
                    <tiny-popover
                      placement="bottom"
                      :visible-arrow="false"
                      trigger="manual"
                      :content="copyTipContent"
                      :modelValue="item?.id === copySourceId"
                    >
                      <template #reference>
                        <span @click="copySourceLink(item)">复制</span>
                      </template>
                    </tiny-popover>
                    <span @click="deleteSource(item)">删除</span>
                  </div>
                  <template #reference>
                    <div class="action-popover">
                      <tiny-icon-popup></tiny-icon-popup>
                    </div>
                  </template>
                </tiny-popover>
              </div>
              <div class="source-name-wrap">
                <span :title="item.name">{{ item.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <search-empty :isShow="!state.sourceList.length" />
    </template>
  </plugin-setting>
  <teleport to="body">
    <tiny-dialog-box v-model:visible="enableUrlForm" title="添加资源" width="700px">
      <tiny-alert
        :closable="false"
        description="资源名称只能包含中文、英文、数字、下划线、中划线、=、+、()、{}、[]等字符，且以文件后缀名为结尾"
      ></tiny-alert>
      <div class="resource-action">
        <tiny-file-upload
          accept=".png, .jpg, .jpeg, .svg"
          action="#"
          :multiple="true"
          :auto-upload="false"
          :show-file-list="false"
          @change="chooseFileChange"
        >
          <template #trigger>
            <tiny-button round><svg-icon name="add"></svg-icon>上传资源</tiny-button>
          </template>
        </tiny-file-upload>
        <tiny-button round @click="addSourceGridRow"><svg-icon name="edit"></svg-icon>通过URL添加</tiny-button>
      </div>
      <tiny-grid
        ref="addSourceGridRef"
        :data="addSourceData"
        show-overflow="tooltip"
        :edit-config="{ trigger: 'click', mode: 'row', autoClear: false }"
        :valid-config="{ message: 'inline' }"
        :edit-rules="validRules"
      >
        <tiny-grid-column field="name" title="资源名称" width="170" :show-icon="false" :editor="{}">
          <template #edit="data">
            <span v-if="data.row.type === 'upload'"> {{ data.row.name }} </span>
            <tiny-input
              v-else
              v-model="data.row.name"
              :disabled="data.row.type === 'upload'"
              placeholder="请输入资源名称"
            ></tiny-input>
          </template>
        </tiny-grid-column>
        <tiny-grid-column field="resourceUrl" title="资源URL" width="170" :show-icon="false" :editor="{}">
          <template #edit="data">
            <span v-if="data.row.type === 'upload'"></span>
            <tiny-input
              v-else
              v-model="data.row.resourceUrl"
              :disabled="data.row.type === 'upload'"
              placeholder="请输入资源URL"
            ></tiny-input>
          </template>
        </tiny-grid-column>
        <tiny-grid-column field="description" title="描述" :show-icon="false" :editor="{}">
          <template #edit="data">
            <tiny-input v-model="data.row.description" placeholder="请输入资源描述"></tiny-input>
          </template>
        </tiny-grid-column>
        <tiny-grid-column title="操作" width="100">
          <template #default="data">
            <template v-if="$refs.addSourceGridRef && $refs.addSourceGridRef.hasActiveRow(data.row)">
              <tiny-button type="text" @click="saveRowEvent(data.row)"> 保存 </tiny-button>
              <tiny-button type="text" @click="cancelRowEvent(data)"> 取消 </tiny-button>
            </template>
            <tiny-button v-else type="text" @click="removeSource(data)">删除</tiny-button>
          </template>
        </tiny-grid-column>
      </tiny-grid>
      <template #footer>
        <tiny-button type="primary" size="mini" class="text-button" @click="submitSourceAdd" round>确 定</tiny-button>
        <tiny-button size="mini" @click="cancelAddSource" round>取 消</tiny-button>
      </template>
    </tiny-dialog-box>
  </teleport>
</template>
<script lang="ts">
/* metaService: engine.plugins.resource.ResourceList */
import { ref, reactive, computed, watch } from 'vue'
import type { Component } from 'vue'
import useClipboard from 'vue-clipboard3'
import {
  TinyButton,
  Divider,
  Grid,
  GridColumn,
  Input,
  Checkbox as TinyCheckbox,
  Popover as TinyPopover,
  DialogBox,
  Alert,
  FileUpload
} from '@opentiny/vue'
import { iconPopup } from '@opentiny/vue-icon'
import { useLayout, useModal, useNotify } from '@opentiny/tiny-engine-meta-register'
import { PluginSetting, SvgButton, SearchEmpty } from '@opentiny/tiny-engine-common'
import { fetchResourceListByGroupId, batchCreateResource, updateResourceGroup } from './js/http'

const isShow = ref(false)

const enableBatchAction = ref(false)

const state = reactive({
  title: '资源设置',
  group: {},
  sourceList: []
})

export const openResourceListPanel = (group) => {
  state.group = { ...group }
  isShow.value = true
}

export const closeResourceListPanel = () => {
  isShow.value = false
}

export default {
  components: {
    PluginSetting,
    SvgButton,
    TinyButton: TinyButton as Component,
    TinyDivider: Divider as Component,
    TinyGrid: Grid,
    TinyGridColumn: GridColumn,
    TinyInput: Input,
    TinyCheckbox: TinyCheckbox as Component,
    TinyPopover: TinyPopover as Component,
    TinyDialogBox: DialogBox,
    TinyAlert: Alert,
    TinyFileUpload: FileUpload,
    SearchEmpty,
    TinyIconPopup: iconPopup()
  },
  setup() {
    const { PLUGIN_NAME, getPluginByLayout } = useLayout()
    const { toClipboard } = useClipboard()
    const { confirm } = useModal()
    const align = computed(() => getPluginByLayout(PLUGIN_NAME.Resource))

    const sourceType = ref('all')

    const copyTipContent = ref('')

    const copySourceId = ref('')

    const selectedSources = ref([])

    const enableUrlForm = ref(false)

    const addSourceGridRef = ref()

    const addSourceData = ref([])

    const validRules = {
      name: [
        { required: true, message: '资源名称必填' },
        {
          type: 'string',
          validator: ({ row }, value) => {
            return new Promise((resolve, reject) => {
              const regex = /^[a-zA-Z0-9_\-=+(){}[\]\u4e00-\u9fa5]+\.(png|jpg|jpeg|svg|PNG|JPG|JPEG|SVG)$/
              if (!regex.test(value)) {
                reject(new Error('资源名称格式错误'))
              } else if (addSourceData.value.find((item) => item._RID !== row._RID && item.name === value)) {
                reject(new Error('已存在的资源名称'))
              } else {
                resolve()
              }
            })
          }
        }
      ],
      resourceUrl: {
        type: 'string',
        validator: ({ row }, value) => {
          const { type } = row
          return new Promise((resolve, reject) => {
            if (type === 'url') {
              if (!value) {
                reject(new Error('资源URL必填'))
              } else if (!/^(http|https):\/\/[^\s]+$/.test(value)) {
                reject(new Error('URL以http或https开头'))
              }
            }
            resolve()
          })
        }
      }
    }

    const chooseFileChange = (file) => {
      let base64String = ''
      const reader = new FileReader()
      reader.readAsDataURL(file.raw)
      reader.onload = () => {
        base64String = reader.result
      }
      reader.onloadend = () => {
        addSourceData.value.push({
          type: 'upload',
          name: file.name,
          resourceData: base64String
        })
      }
    }

    const sourceTypeChange = (type) => {
      sourceType.value = type
    }

    const cancelResourceList = () => {
      closeResourceListPanel()
    }

    const getSourceList = () => {
      fetchResourceListByGroupId(state.group.id)
        .then((res) => {
          if (Array.isArray(res)) {
            state.sourceList = res
          }
        })
        .catch((error) => {
          useNotify({
            type: 'error',
            message: error
          })
        })
    }

    const copySourceLink = async (item) => {
      copySourceId.value = item.id
      try {
        await toClipboard(item.resourceUrl)
        copyTipContent.value = '复制URL成功'
      } catch (e) {
        copyTipContent.value = '复制失败'
        // eslint-disable-next-line no-console
        console.error('Clipboard operation failed:', e)
      } finally {
        copySourceId.value = ''
      }
    }

    const selectSource = (checked, item) => {
      if (checked) {
        selectedSources.value.push(item)
      } else {
        selectedSources.value = selectedSources.value.filter((source) => source.id !== item.id)
      }
    }

    const deleteSource = (item) => {
      confirm({
        title: '删除资源',
        message: '即将删除资源，删除后不可恢复。',
        exec: () => {
          updateResourceGroup(state.group.id, {
            name: state.group.name,
            description: state.group.description,
            resources: state.sourceList
              .map((source) => {
                if (source.id === item.id) {
                  return null
                }
                return { id: source.id }
              })
              .filter((source) => source !== null)
          })
            .then(() => {
              getSourceList()
              selectedSources.value = []
            })
            .catch((error) => {
              useNotify({
                type: 'error',
                message: error
              })
            })
        }
      })
    }

    const batchDeleteSource = () => {
      if (!selectedSources.value.length) {
        useNotify({
          type: 'info',
          message: '请先选择一个资源'
        })
        return
      }
      confirm({
        title: '删除资源',
        message: `即将删除${selectedSources.value.length}个资源，删除后不可恢复。`,
        exec: () => {
          updateResourceGroup(state.group.id, {
            name: state.group.name,
            description: state.group.description,
            resources: state.sourceList
              .map((source) => {
                if (selectedSources.value.find((item) => item.id === source.id)) {
                  return null
                }
                return { id: source.id }
              })
              .filter((source) => source !== null)
          })
            .then(() => {
              getSourceList()
              selectedSources.value = []
            })
            .catch((error) => {
              useNotify({
                type: 'error',
                message: error
              })
            })
        }
      })
    }
    const openAddSourceForm = () => {
      addSourceData.value = []
      enableUrlForm.value = true
    }

    const addSourceGridRow = () => {
      const newUrlData = { type: 'url', name: '', resourceUrl: '', description: '', isAdd: true }
      addSourceData.value.push(newUrlData)
      addSourceGridRef.value.setActiveRow(newUrlData)
    }

    const saveRowEvent = (row) => {
      addSourceGridRef.value.validate((valid) => {
        if (valid) {
          addSourceGridRef.value.clearActived().then(() => {
            delete row?.isAdd
            addSourceGridRef.value.refreshData()
          })
        }
      })
    }

    const cancelRowEvent = (data) => {
      if (data.row?.isAdd) {
        addSourceData.value.splice(data.rowIndex, 1)
      } else {
        addSourceGridRef.value.revertData()
      }
    }

    const removeSource = (data) => {
      addSourceData.value.splice(data.rowIndex, 1)
    }

    const submitSourceAdd = () => {
      addSourceGridRef.value.fullValidate((valid) => {
        if (!valid) {
          return
        }
        const params = addSourceData.value.map((item) => {
          return {
            name: item.name,
            description: item.description || '',
            resourceGroupId: state.group.id,
            resourceData: item?.resourceData || '',
            resourceUrl: item?.resourceUrl || '',
            category: 'image'
          }
        })
        batchCreateResource(params)
          .then(() => {
            getSourceList()
            enableUrlForm.value = false
            addSourceData.value = []
          })
          .catch((error) => {
            useNotify({
              type: 'error',
              message: error
            })
          })
      })
    }

    const cancelAddSource = () => {
      enableUrlForm.value = false
    }

    watch(
      () => state.group.id,
      () => {
        getSourceList()
      }
    )

    return {
      PLUGIN_NAME,
      align,
      isShow,
      state,
      enableBatchAction,
      sourceType,
      copyTipContent,
      copySourceId,
      enableUrlForm,
      addSourceGridRef,
      addSourceData,
      validRules,
      chooseFileChange,
      sourceTypeChange,
      cancelResourceList,
      copySourceLink,
      selectSource,
      deleteSource,
      batchDeleteSource,
      openAddSourceForm,
      addSourceGridRow,
      saveRowEvent,
      cancelRowEvent,
      removeSource,
      submitSourceAdd,
      cancelAddSource
    }
  }
}
</script>
<style lang="less" scoped>
.resource-list-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: start;
  .resource-description {
    padding: 8px 0;
    color: var(--te-resource-manage-tip-text-color);
  }

  .action-wrap {
    width: 100%;
    padding: 16px 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;

    .resource-type-active {
      font-weight: 600;
    }

    .batch-action {
      display: flex;
      gap: 12px;
      .action-item {
        display: flex;
        gap: 4px;
        align-items: center;
      }
    }
  }

  .source-list-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;

    .source-list-item {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .source-image-wrap {
        width: 185px;
        height: 120px;
        background-color: var(--te-resource-manage-draggable-row-bg-color-hover);
        transition: unset;
        position: relative;

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .tiny-checkbox {
          position: absolute;
          left: 8px;
          top: 8px;
        }

        .source-name-wrap {
          display: none;
          height: 28px;
          position: absolute;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0));
          left: 0;
          right: 0;
          bottom: 0;
          text-align: left;
          line-height: 28px;
          width: 185px;
          color: var(--te-resource-manage-button-text-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          span {
            padding: 0 6px;
          }
        }

        .source-action {
          display: none;
          position: absolute;
          right: 8px;
          top: 8px;

          .action-popover {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            background-color: rgba(0, 0, 0, 0.2);

            svg {
              fill: var(--te-resource-manage-button-text-color);
            }
          }
        }

        &:hover {
          .source-name-wrap,
          .source-action {
            display: block;
          }
        }
      }
    }
  }
}
:deep(.tiny-button.tiny-button.tiny-button--text) {
  padding: 0;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    cursor: pointer;
  }
}

.resource-action {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
