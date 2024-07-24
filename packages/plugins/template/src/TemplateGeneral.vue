<template>
  <div class="general-config">
    <tiny-form v-if="type !== 'generate'" ref="generalForm" :model="templateSettingState.currentTemplateData"
      :rules="templateRules" label-width="120px" validate-type="text" :inline-message="true" :label-align="true"
      label-position="left" class="general-config-form">
      <tiny-form-item v-if="type === 'add'" prop="type" label="新增" class="form-item-page-type">
        <tiny-radio v-model="templateSettingState.currentTemplateData.type" class="page-type-radio" label="category">
          模板类别
        </tiny-radio>
        <tiny-radio v-model="templateSettingState.currentTemplateData.type" class="page-type-radio" label="template">
          模板实例
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
      <tiny-tree :props="{ children: 'children', label: 'name' }" ref="treeRef" show-checkbox check-strictly
        :data="treeData" node-key="id" current-node-key="1-1" default-expand-all>
      </tiny-tree>
    </div>
  </div>
</template>

<script lang="jsx">
import { ref, computed, watchEffect } from 'vue'
import { Form, FormItem, Input, Select, Radio, Tree } from '@opentiny/vue'
import { useTemplate } from '@opentiny/tiny-engine-controller'

export default {
  components: {
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinyInput: Input,
    TinySelect: Select,
    TinyRadio: Radio,
    TinyTree: Tree
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

    watchEffect(() => {
      oldParentId.value = templateSettingState.oldParentId
    })


    // 新建模板类别/实例校验规则
    const templateRules = {
      name: [
        { required: true, message: '请输入名称' },
        // {
        //   pattern: REGEXP_FOLDER_NAME,
        //   message: '只允许包含英文字母、数字、下横线_、中横线-, 且以英文字母开头'
        // },
        { min: 3, max: 25, message: '长度在 3 到 25 个字符' }
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


    return {
      templateRules,
      templateSettingState,
      generalForm,
      validGeneralForm,
      treeFolderOp,
      changeParentForderId,
      treeData
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
