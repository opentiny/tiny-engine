<template>
  <div class="plugin-modelmanager">
    <plugin-panel
      :title="title"
      :fixed-name="PLUGIN_NAME.ModelManager"
      :fixedPanels="fixedPanels"
      @close="pluginPanelClosed"
    >
      <template #header>
        <svg-button class="add-icon" name="add" placement="bottom" tips="新建模型" @click="handleAddModel"></svg-button>
        <svg-button
          class="flow-download-icon"
          name="flow-download"
          placement="bottom"
          tips="导出SQL"
          @click="exportModel"
        ></svg-button>
      </template>
      <template #content>
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
              @click="selectModel(model)"
            >
              <div class="model-info">
                <div class="model-name">{{ model.nameCn }}</div>
                <div class="model-english-name">{{ model.nameEn }}</div>
                <div class="model-desc">{{ model.description || '暂无描述' }}</div>
              </div>
              <div class="model-actions">
                <svg-icon name="delete" @click.stop="handleDeleteModel(model)"></svg-icon>
              </div>
            </div>
          </template>
          <search-empty v-else />
        </div>
      </template>
    </plugin-panel>
    <model-setting
      :model="selectedModel"
      :models="models"
      @editCallback="editCallback"
      @exportModel="exportModel"
    ></model-setting>
  </div>
</template>

<script setup>
import { ref, reactive, provide, computed, onMounted } from 'vue'
import { TinySearch, Modal } from '@opentiny/vue'
import { IconSearch } from '@opentiny/vue-icon'
import { PluginPanel, SvgButton, SearchEmpty } from '@opentiny/tiny-engine-common'
import { useLayout } from '@opentiny/tiny-engine-meta-register'
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
const TinyIconSearch = IconSearch()
const selectedModel = ref(null) // 当前选中的模型
// 模型数据列表，包含模型及其字段
const models = ref([])
const localKeyword = ref('')

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
    version: '',
    modelUrl: '',
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
  models.value = data.records
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
      padding: 10px;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;

      &:hover {
        background-color: var(--te-model-manage-draggable-row-bg-color-hover);
        color: var(--te-model-manage-draggable-text-color);
      }

      &.active {
        background-color: var(--te-model-manage-draggable-row-bg-color-hover);
        color: var(--te-model-manage-draggable-text-color);
      }

      svg {
        cursor: pointer;
      }

      .model-info {
        .model-name {
          font-weight: 600;
          margin-bottom: 2px;
          font-size: 14px;
        }
        .model-english-name {
          font-size: 11px;
          margin-bottom: 4px;
          font-family: monospace;
        }
        .model-desc {
          font-size: 12px;
          color: var(--te-model-manage-tip-text-color);
          display: -webkit-box;
          overflow: hidden;
        }
      }
    }
  }
}
</style>
