<template>
  <plugin-setting v-if="isShow" :title="title" class="pageFolder-plugin-setting">
    <template #header>
      <button-group>
        <tiny-button v-if="operateType !== 'generate'" type="primary" @click="saveTemplateSetting">保存</tiny-button>
        <svg-button v-if="operateType === 'edit'" name="delete" placement="bottom" tips="删除"
          @click="deleteTemplate"></svg-button>
        <svg-button class="close-plugin-setting-icon" name="close" @click="closeTemplateSetting"></svg-button>
      </button-group>
    </template>

    <template #content>
      <div class="page-setting-content">
        <template-general ref="templateGeneralRef" :type="operateType"></template-general>
      </div>
    </template>
  </plugin-setting>
</template>

<script>
import { reactive, ref, computed } from 'vue'
import { Button } from '@opentiny/vue'
import { PluginSetting, SvgButton, ButtonGroup } from '@opentiny/tiny-engine-common'
import { useModal, useApp, useNotify, useTemplate, useCanvas } from '@opentiny/tiny-engine-controller'
import { isEqual } from '@opentiny/vue-renderless/common/object'
import throttle from '@opentiny/vue-renderless/common/deps/throttle'
import TemplateGeneral from './TemplateGeneral.vue'
import http from './http.js'

let isShow = ref(false)
let operateType = ref('add')
let node = ref(null)

export const openTemplateSettingPanel = (node = null, type = 'add') => {
  isShow.value = true
  operateType.value = type
  node && (node.value = node)
}

const { resetTemplateData, initCurrentTemplateData } = useTemplate()

export const closeTemplateSettingPanel = () => {
  isShow.value = false

  resetTemplateData()
}

export default {
  components: {
    TinyButton: Button,
    PluginSetting,
    TemplateGeneral,
    SvgButton,
    ButtonGroup
  },
  props: {},
  setup() {
    const state = reactive({
      activeName: ['templateGeneralRef']
    })
    const templateGeneralRef = ref(null)
    const { requestCreateTemplate, requestUpdateTemplate, requestDeleteTemplate } = http
    const { appInfoState } = useApp()
    const { templateSettingState, changeTreeData, DEFAULT_TEMPLATE } = useTemplate()
    const { confirm } = useModal()

    const title = computed(() => {
      return operateType.value === 'add' ? '新增' : operateType.value === 'edit' ? '编辑' : '生成页面'
    })

    const closeTemplateSetting = () => {
      if (isEqual(templateSettingState.currentTemplateData, templateSettingState.currentTemplateDataCopy)) {
        closeTemplateSettingPanel()
      } else {
        confirm({
          title: '提示',
          message: '您即将使用未保存的更改关闭此页。是否要在关闭之前放弃这些更改？',
          exec: () => {
            if (!templateSettingState.isNew) {
              changeTreeData(templateSettingState.oldParentId, templateSettingState.currentTemplateData.parentId)
              Object.assign(templateSettingState.currentTemplateData, templateSettingState.currentTemplateDataCopy)
            }
            closeTemplateSettingPanel()
          }
        })
      }
    }

    const createTemplate = () => {
      const { template_content, ...other } = DEFAULT_TEMPLATE
      const { template_content: template_content_state, ...templateSettingStateOther } =
        templateSettingState.currentTemplateData
      const createParams = {
        ...other,
        ...templateSettingStateOther,
        template_content: {
          ...template_content,
          ...template_content_state,
          fileName: templateSettingState.currentTemplateData.name
        },
        app: appInfoState.selectedId,
        isTemplate: true
      }

      if (createParams.id) {
        delete createParams.id
        delete createParams._id
      }

      requestCreateTemplate(createParams)
        .then(() => {
          templateSettingState.updateTreeData()
          templateSettingState.isNew = false
          closeTemplateSettingPanel()
          useNotify({
            type: 'success',
            message: '新建成功!'
          })
        })
        .catch((error) => {
          useNotify({
            type: 'error',
            title: '新建失败',
            message: JSON.stringify(error?.message || error)
          })
        })
    }

    const updateTemplate = (id, params) => {
      return requestUpdateTemplate(id, params)
        .then((res) => {
          const { setTemplateSaved } = useCanvas()

          templateSettingState.updateTreeData()
          templateSettingState.isNew = false

          closeTemplateSettingPanel()
          setTemplateSaved(true)

          useNotify({
            type: 'success',
            message: '更新成功!'
          })
          return res
        })
        .catch((error) => {
          useNotify({
            type: 'error',
            title: '更新失败',
            message: JSON.stringify(error?.message || error)
          })
        })
    }

    const editTemplate = async () => {
      // 更新模板
      const { id, name, template_content } = templateSettingState.currentTemplateData
      const params = {
        ...templateSettingState.currentTemplateData,
        template_content: {
          ...template_content,
          fileName: name
        }
      }

      const res = await updateTemplate(id, params)

      initCurrentTemplateData(res)
    }
    const saveTemplateSetting = () => {
      templateGeneralRef.value.validGeneralForm().then(() => {
        if (templateSettingState.isNew) {
          createTemplate()
        } else {
          editTemplate()
        }
      })
    }

    const deleteTemplate = () => {
      if (templateSettingState.treeDataMapping[templateSettingState.currentTemplateData.id]?.children?.length) {
        useNotify({
          type: 'error',
          message: '此模板类型不为空，不能删除！'
        })

        return
      }
      const message = templateSettingState.currentTemplateData.isTemplate
        ? '您是否要删除该模板?'
        : '您是否要删除该模板类型?'
      confirm({
        title: '提示',
        message,
        exec: () => {
          const id = templateSettingState.currentTemplateData?.id || ''
          requestDeleteTemplate(id)
            .then(() => {
              templateSettingState.updateTreeData()
              closeTemplateSettingPanel()
              useNotify({
                type: 'success',
                message: '删除成功！'
              })
            })
            .catch((error) => {
              useNotify({
                type: 'success',
                title: '删除失败！',
                message: JSON.stringify(error?.message || error)
              })
            })
        }
      })
    }
    const generatePage = () => {
      alert('开发中。。。')
    }

    return {
      saveTemplateSetting,
      deleteTemplate: throttle(5000, true, deleteTemplate),
      templateGeneralRef,
      closeTemplateSettingPanel,
      isShow,
      state,
      templateSettingState,
      closeTemplateSetting,
      title,
      operateType,
      node,
      generatePage
    }
  }
}
</script>

<style lang="less" scoped>
.pageFolder-plugin-setting {
  :deep(.plugin-setting-header) {
    .close-plugin-setting-icon {
      margin-left: 8px;
    }
  }
}
</style>
