<template>
  <div class="plugin-resource">
    <plugin-panel
      :title="title"
      :fixed-name="PLUGIN_NAME.Resource"
      :fixedPanels="fixedPanels"
      @close="pluginPanelClosed"
      :docsContent="docsContent"
      :isShowDocsIcon="true"
    >
      <template #header>
        <svg-button
          class="add-folder-icon"
          name="add-folder"
          placement="bottom"
          tips="新建分组"
          @click="openCategoryForm"
        ></svg-button>
      </template>
      <template #content>
        <div class="resource-list">
          <div
            v-for="item in resourceList"
            :key="item.id"
            :class="['resource-item', { 'active-item': item.active }]"
            @click="openResourceList(item)"
          >
            <span class="resource-item-content">
              <svg-icon name="plugin-icon-resource"></svg-icon>
              <span>{{ item.name }}</span>
            </span>
            <svg-icon name="setting" class="item-setting" @click.stop="openCategoryForm(item)"></svg-icon>
          </div>
        </div>
        <search-empty :isShow="!resourceList?.length" />
      </template>
    </plugin-panel>
    <resource-setting @refreshCategory="refreshCategory"></resource-setting>
    <resource-list></resource-list>
  </div>
</template>
<script lang="ts">
/* metaService: engine.plugins.resource.Main */
import { ref, reactive, provide, onMounted } from 'vue'
import { useLayout, useNotify } from '@opentiny/tiny-engine-meta-register'
import { PluginPanel, SvgButton, SearchEmpty } from '@opentiny/tiny-engine-common'
import ResourceSetting, { openResourceSettingPanel, closeResourceSettingPanel } from './ResourceSetting.vue'
import ResourceList, { openResourceListPanel, closeResourceListPanel } from './ResourceList.vue'
import { fetchResourceGroupByAppId } from './js/http'

export default {
  components: {
    PluginPanel,
    SvgButton,
    SearchEmpty,
    ResourceSetting,
    ResourceList
  },
  props: {
    title: {
      type: String,
      default: '资源管理'
    },
    fixedPanels: {
      type: Array
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const { PLUGIN_NAME } = useLayout()
    const docsContent = '在这里新增图片资源，包括上传图片和使用uri。'

    const panelState = reactive({
      emitEvent: emit
    })

    provide('panelState', panelState)

    const resourceList = ref([])

    const pluginPanelClosed = () => {
      closeResourceListPanel()
      closeResourceSettingPanel()
      emit('close')
    }

    const setItemActive = (data) => {
      resourceList.value.forEach((item) => {
        if (data.id === item.id) {
          item.active = true
        } else {
          item.active = false
        }
      })
    }

    const openCategoryForm = (data) => {
      if (data) {
        setItemActive(data)
        openResourceSettingPanel(data)
      } else {
        openResourceSettingPanel()
      }
      closeResourceListPanel()
    }

    const getCategoryList = () => {
      fetchResourceGroupByAppId()
        .then((res) => {
          if (Array.isArray(res)) {
            resourceList.value = res
          }
        })
        .catch((error) => {
          useNotify({
            type: 'error',
            message: error
          })
        })
    }

    const refreshCategory = () => {
      getCategoryList()
    }
    const openResourceList = (data) => {
      setItemActive(data)
      openResourceListPanel(data)
      closeResourceSettingPanel()
    }

    onMounted(() => {
      getCategoryList()
    })

    return {
      PLUGIN_NAME,
      docsContent,
      resourceList,
      pluginPanelClosed,
      openCategoryForm,
      openResourceList,
      refreshCategory
    }
  }
}
</script>
<style lang="less" scoped>
.resource-list {
  margin: 8px 0;

  .resource-item {
    padding: 0 16px;
    height: 32px;
    line-height: 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    .item-setting {
      display: none;
    }
    .svg-icon {
      color: var(--te-resource-manage-draggable-icon-color);
      margin-right: 4px;
    }
    &:hover {
      background-color: var(--te-resource-manage-draggable-row-bg-color-hover);
      color: var(--te-resource-manage-draggable-text-color);
      .item-setting {
        display: inline;
      }
    }
    .resource-item-content {
      display: flex;
      align-items: center;
      .svg-icon {
        margin-right: 8px;
      }
    }
  }

  .active-item {
    background-color: var(--te-resource-manage-draggable-row-bg-color-hover);
    color: var(--te-resource-manage-draggable-text-color);
    font-weight: 600;
  }
}
.plugin-resource {
  width: 100%;
  height: 100%;
}
</style>
