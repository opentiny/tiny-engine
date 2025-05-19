<template>
  <div class="general-config">
    <tiny-form
      ref="generalForm"
      :model="pageSettingState.currentPageData"
      :rules="isFolder ? folderRules : pageRules"
      label-width="120px"
      validate-type="text"
      :inline-message="true"
      :label-align="true"
      label-position="top"
      class="general-config-form"
    >
      <tiny-form-item v-if="!isFolder" prop="group" label="页面类型" class="form-item-page-type">
        <tiny-radio v-model="pageSettingState.currentPageData.group" class="page-type-radio" label="staticPages">
          静态页面
        </tiny-radio>
        <tiny-radio v-model="pageSettingState.currentPageData.group" class="page-type-radio" label="publicPages">
          公共页面
        </tiny-radio>
      </tiny-form-item>
      <tiny-form-item prop="name" :label="`${isFolder ? '文件夹' : '页面'}名称`">
        <tiny-input
          v-model="pageSettingState.currentPageData.name"
          :placeholder="`请设置${isFolder ? '文件夹' : '页面'}名称`"
        ></tiny-input>
      </tiny-form-item>

      <tiny-form-item
        v-if="pageSettingState.currentPageData.group !== 'publicPages'"
        label="父文件夹/父页面"
        prop="parentId"
      >
        <tiny-select
          v-model="pageParentId"
          value-field="id"
          render-type="tree"
          :tree-op="treeFolderOp"
          text-field="name"
          placeholder="请选择父文件夹/父页面"
          popper-class="parent-fold-select-dropdown"
          @change="changeParentForderId"
        ></tiny-select>
      </tiny-form-item>

      <tiny-form-item label="页面路由" prop="route">
        <tiny-input v-model="pageSettingState.currentPageData.route" placeholder="请设置路由"> </tiny-input>
        <div class="tip">
          <span class="text" v-if="!pageSettingState.currentPageData.route">路由将以website.com开头</span>
          <span class="route-text" v-else>
            <span class="tip-text">website.com/</span>
            <span class="tip-text-dim">{{ currentRoute }}</span>
          </span>
        </div>
      </tiny-form-item>
      <tiny-form-item
        v-if="pageSettingState.currentPageData.group !== 'publicPages' && !isFolder && state.childPageOp?.length"
        label="设置默认跳转页"
        prop="isDefault"
      >
        <tiny-select
          v-model="state.defaultPageId"
          :options="state.childPageOp"
          placeholder="请选择默认跳转页"
          @change="changeDefaultPage"
        ></tiny-select>
        <div v-if="state.defaultPageId" class="tip">
          <div class="tip-text">访问</div>
          <span class="tip-text-dim">/{{ currentRoute }}</span>
          <div class="tip-text">路由，默认跳转</div>
          <span class="tip-text-dim">/{{ currentRoute }}/{{ pageSettingState?.defaultPage?.route }}</span>
        </div>
      </tiny-form-item>
    </tiny-form>
  </div>
</template>

<script lang="tsx">
/* metaService: engine.plugins.appmanage.PageGeneral */
import { ref, computed, watchEffect, reactive } from 'vue'
import { Form, FormItem, Input, Select, Radio } from '@opentiny/vue'
import { iconFile } from '@opentiny/vue-icon'
import { usePage } from '@opentiny/tiny-engine-meta-register'
import { REGEXP_PAGE_NAME, REGEXP_FOLDER_NAME, REGEXP_ROUTE } from '@opentiny/tiny-engine-common/js/verification'

export default {
  components: {
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinyInput: Input,
    TinySelect: Select,
    TinyRadio: Radio
  },
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    },
    isFolder: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const { pageSettingState, changeTreeData, STATIC_PAGE_GROUP_ID, getPageChildren } = usePage()
    const ROOT_ID = pageSettingState.ROOT_ID

    const pageParentId = computed({
      get() {
        return String(pageSettingState.currentPageData.parentId)
      },
      set(value) {
        pageSettingState.currentPageData.parentId = value
      }
    })

    const oldParentId = ref(pageParentId.value)
    const state = reactive({
      childPageList: [],
      childPageOp: [],
      defaultPageId: ''
    })

    const setChildAndDefaultPage = async (id) => {
      if (pageSettingState.isNew) {
        state.childPageList = []
        state.childPageOp = []
        state.defaultPageId = ''
      } else {
        state.childPageList = await getPageChildren(id)
        const defaultPage = state.childPageList?.find((item) => item.isDefault)
        pageSettingState.defaultPage = defaultPage ? defaultPage : null
        state.defaultPageId = defaultPage ? defaultPage.id : ''
        state.childPageOp = state.childPageList.map((item) => {
          return {
            value: item.id,
            label: item.name,
            icon: iconFile()
          }
        })
      }
    }

    const changeDefaultPage = () => {
      pageSettingState.defaultPage = state.childPageList.find((item) => item.id === state.defaultPageId)
    }

    watchEffect(() => {
      oldParentId.value = pageSettingState.oldParentId
      setChildAndDefaultPage(pageSettingState.currentPageData?.id)
    })

    const currentRoute = computed(() => {
      let route = pageSettingState.currentPageData.route || ''
      let parentId = pageParentId.value

      while (parentId !== ROOT_ID) {
        const parent = pageSettingState.treeDataMapping[parentId]
        if (!parent) {
          break
        }
        route = `${parent.route}/${route}`
        parentId = parent.parentId
      }
      if (route.startsWith('/')) {
        route = route.slice(1)
      }

      return route
    })

    // 新建页面/更新页面校验规则
    const pageRules = {
      name: [
        { required: true, message: '请输入页面 ID' },
        {
          pattern: REGEXP_PAGE_NAME,
          message: '只允许包含英文字母，且为大写开头驼峰格式, 如DemoPage'
        },
        {
          min: 3,
          max: 25,
          message: '长度在 3 到 25 个字符'
        }
      ],
      route: [
        {
          required: true,
          message: '请输入页面路由'
        },
        {
          pattern: REGEXP_ROUTE,
          message: '只允许包含英文字母、数字、下横线_、中横线-、正斜杠/, 且以英文字母开头'
        }
      ]
    }
    const folderRules = {
      name: [
        { required: true, message: '请输入页面文件夹 ID' },
        {
          pattern: REGEXP_FOLDER_NAME,
          message: '只允许包含英文字母、数字、下横线_、中横线-, 且以英文字母开头'
        },
        { min: 3, max: 25, message: '长度在 3 到 25 个字符' }
      ],
      route: [
        { required: true, message: '请输入页面文件夹路由' },
        {
          pattern: REGEXP_ROUTE,
          message: '只允许包含英文字母、数字、下横线_、中横线-、正斜杠/, 且以英文字母开头'
        }
      ],
      group: [{ required: true, message: '必须选择页面类型' }]
    }

    const pageToTreeData = (page) => {
      const { id, name, isPage, children } = page

      const result = { id: String(id), name, isPage }

      if (Array.isArray(children)) {
        result.children = children
          .filter((page) => page.id !== pageSettingState.currentPageData.id)
          .map((page) => pageToTreeData(page))
      }

      return result
    }

    const getNodeIcon = (data) => {
      if (data.id === ROOT_ID) {
        return null
      }

      if (data.isPage) {
        return <SvgIcon name="text-page-common"></SvgIcon>
      }

      return <SvgIcon name="text-page-folder"></SvgIcon>
    }

    const treeFolderOp = computed(() => {
      const staticPages = pageSettingState.pages[STATIC_PAGE_GROUP_ID]?.data || []
      const dummyRoot = pageToTreeData({ children: [{ name: '无', id: ROOT_ID }].concat(staticPages) })
      const data = dummyRoot.children
      const options = {
        data: data,
        shrinkIcon: null,
        expandIcon: null,
        renderContent: (_h, { node, data }) => {
          return (
            <>
              {getNodeIcon(data)}
              <div>{node.label}</div>
            </>
          )
        }
      }

      return options
    })

    const generalForm = ref(null)

    const validGeneralForm = () => {
      return new Promise((resolve) => {
        generalForm.value.validate((valid) => {
          if (valid) {
            resolve(valid)
          }
        })
      })
    }

    const changeParentForderId = (value) => {
      changeTreeData(value.id, oldParentId.value)
      oldParentId.value = value.id
    }

    return {
      pageRules,
      folderRules,
      pageSettingState,
      pageParentId,
      generalForm,
      validGeneralForm,
      treeFolderOp,
      currentRoute,
      changeParentForderId,
      state,
      changeDefaultPage
    }
  }
}
</script>

<style lang="less" scoped>
.general-config {
  .general-config-form {
    .input-head {
      color: var(--te-page-manage-input-head-text-color);
    }
    :deep(.tiny-form-item) {
      margin-bottom: 16px;
      .tiny-input-group__prepend {
        border: 1px solid var(--te-page-manage-input-border-color);
        background: var(--te-page-manage-input-bg-color);
      }
      .page-type-radio {
        color: var(--te-page-manage-title-text-color);
      }
      .tiny-form-item__label {
        height: 24px;
        line-height: 18px;
        font-size: 12px;
        color: var(--te-page-manage-text-color);
      }
    }
  }
  .tip {
    color: var(--te-page-manage-tip-color);
    font-size: 12px;
    border-radius: 3px;
    margin-top: 4px;
    width: 100%;
    word-wrap: break-word;
    height: auto;
    line-height: 16px;
    .text {
      color: var(--te-page-manage-tip-text-color);
    }
    .tip-text {
      width: 100%;
      color: var(--te-page-manage-tip-text-color);
    }
    .tip-text-dim {
      color: var(--te-page-manage-tip-dim-text-color);
    }
  }
}
</style>
<style lang="less">
.tiny-select-dropdown.parent-fold-select-dropdown {
  padding: 8px;
  .tiny-tree {
    .tiny-tree-node {
      .tiny-tree-node__content {
        padding: 0;
        background-color: var(--te-page-manage-tree-node-bg-color);
        &:hover {
          background-color: var(--te-page-manage-tree-node-bg-color-hover);
        }
        // 移除子节点的的背景色，才能保证鼠标hover到.tiny-tree-node__content节点任意位置时，整行都有hover状态的背景色
        .tiny-tree-node__content-left,
        .tiny-tree-node__content-left .tiny-tree-node__content-box {
          background-color: unset;
          &:hover {
            background-color: unset;
          }
        }
        .tiny-tree-node__content-left {
          padding: 0;
          .tree-node-icon {
            margin: 0;
          }
          .tiny-tree-node__content-box {
            padding: 0 12px;
            svg {
              margin-right: 8px;
            }
          }
          .tiny-tree-node__label {
            font-size: 12px;
          }
        }
      }
    }
  }
}
</style>
