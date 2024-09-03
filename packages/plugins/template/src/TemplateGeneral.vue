<template>
  <div class="general-config">
    <tiny-form v-if="type !== 'generate'" ref="generalForm" :model="templateSettingState.currentTemplateData"
      :rules="templateSettingState.currentTemplateData.type === 'template' ? templateRules : categoryRules"
      label-width="120px" validate-type="text" :inline-message="true" :label-align="true" label-position="left"
      class="general-config-form">
      <tiny-form-item v-if="type === 'add'" prop="type" label="新增" class="form-item-page-type">
        <tiny-radio v-model="templateSettingState.currentTemplateData.type" class="page-type-radio" label="category">
          模板类别
        </tiny-radio>
        <tiny-radio v-model="templateSettingState.currentTemplateData.type" class="page-type-radio" label="template">
          模板
        </tiny-radio>
      </tiny-form-item>
      <tiny-form-item prop="name" label="名称">
        <tiny-input v-model="templateSettingState.currentTemplateData.name" placeholder="请输入名称"></tiny-input>
      </tiny-form-item>

      <tiny-form-item label="选择父模板类别" prop="parentId">
        <tiny-select v-model="templateSettingState.currentTemplateData.parentId" value-field="id" render-type="tree"
          :tree-op="treeFolderOp" text-field="name" placeholder="请选择父模板类型" popper-class="parent-fold-select-dropdown"
          @change="changeParentForderId"></tiny-select>
      </tiny-form-item>
    </tiny-form>
    <div v-else>
      <p>请勾选模版生成页面</p>
      <tiny-tree :props="{ children: 'children', label: 'name' }" ref="treeRef" show-checkbox :check-strictly="false"
        :data="treeData" node-key="id" current-node-key="1-1" default-expand-all>
      </tiny-tree>
      <tiny-button class="generate-page-btn" type="primary" @click="generatePage">生成页面</tiny-button>
    </div>
  </div>
</template>

<script lang="jsx">
import { ref, computed, watchEffect } from 'vue'
import { Form, FormItem, Input, Select, Radio, Tree } from '@opentiny/vue'
import { useTemplate, usePage, useApp, useNotify } from '@opentiny/tiny-engine-controller'
import { constants } from '@opentiny/tiny-engine-utils'
import { Button } from '@opentiny/vue'
import { handleBatchCreatePage } from '@opentiny/tiny-engine-controller/js/http'
import { REGEXP_PAGE_NAME } from '@opentiny/tiny-engine-controller/js/verification'


export default {
  components: {
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinyInput: Input,
    TinySelect: Select,
    TinyRadio: Radio,
    TinyTree: Tree,
    TinyButton: Button
  },
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    },
    type: {
      type: String,
      default: 'add'
    }
  },
  setup(props) {
    const { templateSettingState, changeTreeData } = useTemplate()
    const ROOT_ID = templateSettingState.ROOT_ID
    const oldParentId = ref(templateSettingState.currentTemplateData.parentId)

    const treeRef = ref(null)
    const { DEFAULT_PAGE, STATIC_PAGE_GROUP_ID, pageSettingState } = usePage()
    const { COMPONENT_NAME } = constants
    const { appInfoState } = useApp()

    watchEffect(() => {
      oldParentId.value = templateSettingState.oldParentId
    })


    // 新建模板类别/实例校验规则
    const templateRules = {
      name: [
        { required: true, message: '请输入名称' },
        {
          pattern: REGEXP_PAGE_NAME,
          message: '只允许包含英文字母，且为大写开头驼峰格式, 如DemoPage'
        },
        { min: 3, max: 25, message: '长度在 3 到 25 个字符' }
      ],

      type: [{ required: true, message: '必须选择新增类型' }]
    }

    const categoryRules = {
      name: [
        { required: true, message: '请输入名称' },
        { min: 2, max: 25, message: '长度在 2 到 25 个字符' }
      ],
      type: [{ required: true, message: '必须选择新增类型' }]
    }

    const getFolders = (templates) => {
      const list = []

      templates.forEach((template) => {
        if (!template.isTemplate && (props.type !== 'edit' || template.id !== templateSettingState.currentTemplateData.id)) {
          list.push(template)
          if (!template.children) {
            template.children = []
          }
          template.children = getFolders(template.children)
        }
      })

      return list
    }

    const treeFolderOp = computed(() => {
      const expandIcon = <SvgIcon name="text-page-folder-closed" class="folder-icon"></SvgIcon>
      const shrinkIcon = <SvgIcon name="text-page-folder" class="folder-icon"></SvgIcon>
      const templates = templateSettingState.templates || []
      const data = [...getFolders(JSON.parse(JSON.stringify(templates)))]
      const options = {
        data: data,
        shrinkIcon: shrinkIcon,
        expandIcon: expandIcon,
        renderContent: (_h, { node, data }) => {
          return (
            <span style="display:flex">
              {node.isLeaf && data.id !== ROOT_ID ? (
                <svg-icon name="text-page-folder-closed" style="margin-right:14px"></svg-icon>
              ) : null}
              <span class="label">{node.label}</span>
            </span>
          )
        }
      }

      return options
    })

    const treeData = computed(() => {
      const data = templateSettingState.currentNodeTreeData ? [templateSettingState.currentNodeTreeData] : []
      return data
    })

    const generalForm = ref(null)

    const validGeneralForm = () => {
      return new Promise((resolve, reject) => {
        generalForm.value.validate((valid) => {
          if (valid) {
            resolve(valid)
          } else {
            reject(valid)
          }
        })
      })
    }

    const changeParentForderId = (value) => {
      changeTreeData(value.id, oldParentId.value)
      oldParentId.value = value.id
    }

    const transTemplateToPage = (template) => {
      const { page_content, ...other } = DEFAULT_PAGE
      const createParams = {
        ...other,
        page_content: {
          ...page_content,
          ...template.template_content,
          componentName: COMPONENT_NAME.Page,
          fileName: template.template_content.fileName
        },
        app: appInfoState.selectedId,
        isPage: true,
        parentId: STATIC_PAGE_GROUP_ID + '',
        name: template.name,
        route: template.name.toLowerCase()
      }

      if (createParams.id) {
        delete createParams.id
        delete createParams._id
      }

      return createParams
    }

    const generatePage = () => {
      const checkedNodes = treeRef.value.getCheckedNodes()
      const templates = checkedNodes.filter((node) => node.isTemplate)
      const pagesArr = templates.map((template) => transTemplateToPage(template))

      handleBatchCreatePage(pagesArr)
        .then(() => {
          useNotify({
            type: 'success',
            message: '生成页面成功，请去页面管理中查看!'
          })
          pageSettingState.updateTreeData()
        })
        .catch((err) => {
          useNotify({
            type: 'error',
            title: '生成页面失败',
            message: JSON.stringify(err?.message || err)
          })
        })
    }


    return {
      templateRules,
      categoryRules,
      templateSettingState,
      generalForm,
      validGeneralForm,
      treeFolderOp,
      changeParentForderId,
      treeData,
      treeRef,
      generatePage
    }
  }
}
</script>

<style lang="less" scoped>
.general-config {
  padding: 20px;

  .general-config-form {
    .input-head {
      color: var(--ti-lowcode-page-manage-input-head-text-color);
    }

    :deep(.tiny-form-item) {
      padding: 0 12px;

      .tiny-input-group__prepend {
        border: 1px solid var(--ti-lowcode-page-manage-input-group-border-color);
        background: var(--ti-lowcode-page-manage-input-group-color);
        border-right: 1px solid var(--ti-lowcode-page-manage-input-group-border-right-color);
      }

      .page-type-radio {
        color: var(--ti-lowcode-page-manage-title-background-text-color);
      }

      .tiny-form-item__label {
        font-size: 14px;
        color: var(--ti-lowcode-page-manage-text-color);
      }

      .tiny-form-item__error {
        font-size: 14px;
        color: var(--ti-lowcode-page-manage-error-color);
      }
    }
  }

  .tip {
    color: var(--ti-lowcode-page-manage-tip-border-color);
    font-size: 14px;
    border-radius: 3px;
    display: flex;
    align-items: center;

    .icon {
      color: var(--ti-lowcode-page-manage-icon-text-color);
    }

    .text {
      color: var(--ti-lowcode-page-manage-btn-text-color);
    }

    .text-dim {
      color: var(--ti-lowcode-page-manage-btn-text-color);
    }
  }
}

.generate-page-btn {
  margin-top: 20px;
}
</style>
<style lang="less">
.tiny-select-dropdown.parent-fold-select-dropdown {
  .tiny-tree {
    background-color: var(--ti-lowcode-page-manage-tree-text-background-color);

    .tiny-tree-node {
      &.is-current {
        .tiny-tree-node__content {
          background-color: var(--ti-lowcode-page-manage-tree-node-background-color);
        }
      }
    }
  }

  .tiny-tree-node__content {
    &:hover {
      --ti-lowcode-tree-node-content-hover-bg-color: var(--ti-lowcode-page-manage-tree-node-background-color);
    }
  }
}
</style>
