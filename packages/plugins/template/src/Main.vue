<template>
  <plugin-panel :title="title" @close="pluginPanelClosed">
    <template #header>
      <link-button :href="docsUrl"></link-button>
      <svg-button class="add-template-icon" name="add-template" placement="bottom" tips="新建模板"
        @click="createNewTemplate"></svg-button>
    </template>

    <template #content>
      <template-tree ref="templateTreeRef" @openSettingPanel="openSettingPanel"></template-tree>
    </template>
  </plugin-panel>

  <template-setting :operateType="state.operateType"></template-setting>
</template>

<script lang="jsx">
import { reactive, ref, provide, watchEffect } from 'vue'
import { useApp, useResource, useHelp, useTemplate } from '@opentiny/tiny-engine-controller'
import { PluginPanel, SvgButton, LinkButton } from '@opentiny/tiny-engine-common'
import TemplateSetting, { openTemplateSettingPanel, closeTemplateSettingPanel } from './TemplateSetting.vue'
import TemplateTree from './TemplateTree.vue'
import { fetchTemplateDetail } from './http'
import { extend } from '@opentiny/vue-renderless/common/object'

export const api = {
  getTemplateById: async (id) => {
    if (id) {
      return fetchTemplateDetail(id)
    }

    return undefined
  },
}

export default {
  components: {
    PluginPanel,
    SvgButton,
    TemplateSetting,
    TemplateTree,
    LinkButton
  },
  props: {
    title: {
      type: String,
      default: '模板管理'
    }
  },
  setup() {
    const { appInfoState } = useApp()
    const { resState } = useResource()
    const templateTreeRef = ref(null)
    const docsUrl = useHelp().getDocsUrl('template')
    const { templateSettingState, isTemporaryTemplate, initCurrentTemplateData } = useTemplate()

    const ROOT_ID = templateSettingState.ROOT_ID
    const state = reactive({
      operateType: 'add'
    })

    const createNewTemplate = () => {
      templateSettingState.isNew = true
      templateSettingState.currentTemplateData = { parentId: ROOT_ID, name: 'untitled' }
      templateSettingState.currentTemplateDataCopy = extend(true, {}, templateSettingState.currentTemplateData)
      openTemplateSettingPanel()
    }

    const openSettingPanel = async ({ node, type }) => {
      templateSettingState.isNew = type === 'add'
      openTemplateSettingPanel(node, type)
      const templateDetail = await fetchTemplateDetail(node.data?.id)
      templateDetail.name = type === 'add' ? 'untitled' : templateDetail.name
      templateDetail.parentId = type === 'add' ? node.data?.id : templateDetail.parentId
      templateDetail.nodeTreeData = node.data || []
      initCurrentTemplateData(templateDetail)
    }

    provide('openSettingPanel', openSettingPanel)

    const pluginPanelClosed = () => {
      closeTemplateSettingPanel()
    }

    watchEffect(() => {
      if (isTemporaryTemplate.saved) {
        openTemplateSettingPanel()
      }
    })

    return {
      state,
      resState,
      appInfoState,
      templateTreeRef,
      pluginPanelClosed,
      openSettingPanel,
      createNewTemplate,
      docsUrl
    }
  }
}
</script>

<style lang="less" scoped>
:deep(.help-box) {
  position: absolute;
  left: 72px;
  top: 3px;
}
</style>
