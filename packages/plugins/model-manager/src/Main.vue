<template>
  <div class="plugin-modelmanager">
    <plugin-panel
      :title="title"
      :fixed-name="PLUGIN_NAME.ModelManager"
      :fixedPanels="fixedPanels"
      @close="pluginPanelClosed"
    >
      <template #header>
        <svg-button
          v-if="showExportSql"
          class="flow-download-icon"
          name="flow-download"
          placement="bottom"
          tips="导出SQL"
          @click="exportModel"
        ></svg-button>
      </template>
      <template #content>
        <tiny-button class="add-model" @click="handleAddModel"> <svg-icon name="add"></svg-icon>新建模型 </tiny-button>
        <div class="model-manager-search" clearable placeholder="搜索">
          <tiny-search v-model="localKeyword">
            <template #prefix>
              <tiny-icon-search />
            </template>
          </tiny-search>
        </div>
        <div class="model-list">
          <template v-if="models.length">
            <div
              v-for="model in filteredModels"
              :key="model.id"
              :class="['model-item', { active: selectedModel?.id === model.id }]"
            >
              <div class="item-label">
                <div class="item-name">
                  <svg-icon name="plugin-icon-modelmanager" class="plugin-icon-modelmanager"> </svg-icon>
                  {{ model.nameCn }}
                </div>
                <div class="item-handler">
                  <svg-button
                    class="set-page"
                    :hoverBgColor="false"
                    tips="设置模型"
                    name="setting"
                    @mousedown.stop.prevent="selectModel(model)"
                  >
                  </svg-button>
                </div>
              </div>
            </div>
          </template>
          <search-empty :isShow="!models.length" />
        </div>
      </template>
    </plugin-panel>
    <model-setting
      :model="selectedModel"
      :models="models"
      :showExport="showExportSql"
      @deleteCallback="handleDeleteModel"
      @editCallback="editCallback"
      @exportModel="exportModel"
    ></model-setting>
  </div>
</template>

<script setup>
import { ref, reactive, provide, computed, onMounted } from 'vue'
import { TinySearch, Modal, TinyButton } from '@opentiny/vue'
import { IconSearch } from '@opentiny/vue-icon'
import { PluginPanel, SvgButton, SearchEmpty } from '@opentiny/tiny-engine-common'
import { useLayout, useEnv } from '@opentiny/tiny-engine-meta-register'
import ModelSetting, { openModelSettingPanel, closeModelSettingPanel } from './components/ModelSetting.vue'
import { getModelList, deleteModel, getModelSql, getModelSqlById } from './composable/useModelManager'

defineProps({
  title: {
    type: String,
    default: '模型管理'
  },
  fixedPanels: {
    type: Array
  }
})
const emit = defineEmits(['close'])

const { PLUGIN_NAME } = useLayout()
const { VITE_ORIGIN } = useEnv()
const TinyIconSearch = IconSearch()
const selectedModel = ref(null) // 当前选中的模型
// 模型数据列表，包含模型及其字段
const models = ref([])
const localKeyword = ref('')
const showExportSql = ref(false)
const panelState = reactive({
  emitEvent: emit
})

provide('panelState', panelState)
// 根据搜索关键字过滤模型列表
const filteredModels = computed(() => {
  if (!localKeyword.value) return models.value
  return models.value.filter(
    (model) =>
      (model.nameCn || '').toLowerCase().includes(localKeyword.value.toLowerCase()) ||
      (model.description || '').toLowerCase().includes(localKeyword.value.toLowerCase())
  )
})

const pluginPanelClosed = () => {
  emit('close')
  closeModelSettingPanel()
}

// 选中模型
const selectModel = (model) => {
  if (model.parameters?.length > 0) {
    model.parameters.forEach((item) => {
      item.isModel = false
      if (item.type === 'Enum') {
        item.options = typeof item.options === 'string' ? JSON.parse(item.options) : item.options || []
      }
      if (item.type === 'ModelRef') {
        item.isModel = true
        item.defaultValue = Number(item.defaultValue)
      }
    })
  }
  selectedModel.value = model
  openModelSettingPanel()
}
// 添加新模型
const handleAddModel = () => {
  selectedModel.value = {
    id: null,
    nameCn: '',
    nameEn: '',
    modelUrl: `${VITE_ORIGIN}platform-center/api/model-data`,
    description: '',
    parameters: []
  }
  openModelSettingPanel()
}

// 删除模型（TinyVue 二次确认）
const handleDeleteModel = async (model) => {
  const name = model.nameCn || model.nameEn || model.id
  try {
    const result = await Modal.confirm({
      title: '提示',
      message: `确认删除模型「${name}」吗？该操作不可恢复。`
    })
    const confirmed = result === 'confirm' || result?.action === 'confirm' || result === true || result === undefined
    if (!confirmed) return
    await deleteModel(model.id)
    const index = models.value.findIndex((m) => m.id === model.id)
    if (index > -1) {
      models.value.splice(index, 1)
      if (selectedModel.value?.id === model.id) selectedModel.value = null
    }
  } catch (error) {
    // 用户取消或弹窗异常，不做处理
  }
}

const getModelLists = async () => {
  const data = await getModelList({
    currentPage: 1,
    pageSize: 500
  })
  models.value = data.records || []
}
// 导出模型的sql
const exportModel = async (id) => {
  const sqlContent = id ? await getModelSqlById(id) : await getModelSql()
  // 创建 Blob 对象，指定 MIME 类型为 text/sql
  const blob = new Blob([sqlContent], { type: 'text/sql' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${id ? selectedModel.value?.nameEn : 'models'}.sql`
  // 将 <a> 元素添加到 DOM 中
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const editCallback = async () => {
  await getModelLists()
  selectedModel.value = null
  closeModelSettingPanel()
}

// 生命周期：页面加载时拉取模型列表
onMounted(async () => {
  await getModelLists()
})
</script>

<style lang="less" scoped>
.plugin-modelmanager {
  height: 100%;
  width: 280px;
  .add-model {
    margin: 0 12px 12px 12px;
    width: calc(100% - 24px);
  }
  .model-manager-search {
    padding: 0 12px 12px 12px;
  }

  .model-list {
    border-top: 1px solid var(--te-model-common-border-color-divider);
    padding-top: 12px;
    overflow-y: scroll;
    color: var(--te-common-text-primary);
    font-size: var(--te-base-font-size-base);

    .model-item {
      box-shadow: var(--te-model-manage-input-border-color) 0, -1px;
      height: 24px;
      line-height: 24px;
      align-items: center;
      display: grid;
      padding: 0 12px;
      position: relative;
      color: var(--te-model-manage-text-color);
      cursor: pointer;
      &:hover,
      &.active {
        background: var(--te-model-manage-tree-node-bg-color-hover);
        .item-handler {
          display: inline-block;
        }
      }
      .item-label {
        overflow: hidden;
        text-overflow: ellipsis;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: var(--te-model-manage-draggable-text-color);
        .item-name {
          display: flex;
          align-items: center;
        }
        .plugin-icon-modelmanager {
          color: var(--te-model-manage-draggable-icon-color);
          margin-right: 8px;
        }
      }
      .item-handler {
        height: 24px;
        line-height: 24px;
        display: none;
      }
    }
  }
}
</style>
