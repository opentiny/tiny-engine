<template>
  <tiny-dialog-box
    class="dialog-box"
    :visible="visible"
    :close-on-click-modal="false"
    :append-to-body="true"
    width="1000"
    title="请选择生成到本地的文件"
    @close="$emit('cancel')"
  >
    <div class="dialog-grid">
      <div class="tree-wrap">
        <tiny-tree
          ref="fileTreeRef"
          :data="treeData.treeArray"
          node-key="id"
          :default-checked-keys="treeData.checkedTreeData"
          :expand-icon="expandIcon"
          :shrink-icon="shrinkIcon"
          show-checkbox
          @node-click="nodeClick"
        ></tiny-tree>
      </div>
      <div class="editor-wrap">
        <monaco-editor
          v-if="options.language"
          ref="container"
          class="code-edit-content"
          :value="fileContent"
          :options="options"
        ></monaco-editor>
      </div>
    </div>
    <template #footer>
      <tiny-button type="primary" @click="confirm">确定</tiny-button>
      <tiny-button @click="$emit('cancel')">取消</tiny-button>
    </template>
  </tiny-dialog-box>
</template>

<script lang="ts">
/* metaService: engine.toolbars.generate-code.FileSelector */
import { DialogBox, Button, Tree } from '@opentiny/vue'
import { iconPutAway, iconExpand } from '@opentiny/vue-icon'
import { reactive, ref, nextTick } from 'vue'
import { useNotify } from '@opentiny/tiny-engine-meta-register'
import { VueMonaco } from '@opentiny/tiny-engine-common'

export default {
  components: {
    MonacoEditor: VueMonaco,
    TinyDialogBox: DialogBox,
    TinyButton: Button,
    TinyTree: Tree
  },
  props: {
    visible: { type: Boolean, default: false },
    data: {
      type: Array,
      default: () => []
    },
    treeData: {
      type: Object,
      default: () => {}
    }
  },
  emits: ['cancel', 'confirm'],
  setup(props, { emit }) {
    const shrinkIcon = iconExpand()
    const expandIcon = iconPutAway()

    const fileTreeRef = ref<any>(null)

    const options = reactive({
      language: 'javascript',
      readOnly: true,
      minimap: {
        enabled: false
      }
    })

    const fileContent = ref('')

    const nodeClick = (node: any) => {
      if (node?.originData) {
        nextTick(() => {
          fileContent.value = node.originData.fileContent
        })
      }
    }

    const confirm = () => {
      const selectedData = fileTreeRef.value
        .getCheckedNodes()
        .map((node: any) => node.originData)
        .filter((node: any) => node !== undefined)
      if (!selectedData?.length) {
        useNotify({
          type: 'error',
          title: '生成代码失败',
          message: '选中列表为空，请先选择需要生成到本地的文件再点击确定按钮.'
        })
        return
      }

      emit('confirm', selectedData)
    }

    return {
      shrinkIcon,
      expandIcon,
      options,
      fileContent,
      fileTreeRef,
      nodeClick,
      confirm
    }
  }
}
</script>

<style lang="less" scoped>
.dialog-box {
  :deep(.tiny-dialog-box__body) {
    height: 480px;
  }
  :deep(.tiny-dialog-box__content) {
    background-color: var(--te-toolbars-generate-code-bg-color);

    .tiny-dialog-box__header {
      background-color: var(--te-toolbars-generate-code-bg-color);

      .tiny-dialog-box__title {
        color: var(--te-toolbars-generate-code-text-color);
      }

      .tiny-dialog-box__headerbtn .tiny-dialog-box__close {
        fill: var(--te-toolbars-generate-code-icon-color) !important;

        &:hover {
          fill: var(--te-toolbars-generate-code-icon-color-primary) !important;
        }
      }
    }

    .tiny-dialog-box__footer {
      .tiny-button--primary {
        background-color: var(--te-toolbars-generate-code-bg-color-primary);
        border: none;
      }
    }
  }

  .dialog-grid {
    display: flex;
    .tree-wrap {
      overflow: scroll;
      .tiny-tree {
        max-width: 400px;
        height: 480px;
      }
    }
    .editor-wrap {
      width: 100%;
      max-width: 744px;
      background-color: #f8f8f8;
      .code-edit-content {
        width: 100%;
        height: 480px;
      }
    }
  }
}
</style>
