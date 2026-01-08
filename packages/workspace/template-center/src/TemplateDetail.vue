<template>
  <tiny-drawer :visible="visible" title="模板详情" :placement="placement" :height="height" @update:visible="setVisible">
    <div class="template-detail">
      <div class="template-detail-info">
        <div class="template-detail-name">
          <svg-icon class="template-detail-img" name="template-cover-1" />
          <span class="template-detail-name-text">{{ state.templateDetail.name }}</span>
        </div>
        <div class="template-detail-desc">{{ state.templateDetail.description }}</div>
        <div class="template-detail-tag">
          <div v-if="state.templateDetail.sceneId" class="tag">
            {{ state.templateDetail.scene[0]?.name }}
          </div>
          <div v-if="state.templateDetail.industryId" class="tag">
            {{ state.templateDetail.industry[0]?.name }}
          </div>
          <div v-if="state.templateDetail?.framework" class="tag">{{ state.templateDetail.framework }}</div>
        </div>
        <div class="template-detail-from">来自TinyEngine官方</div>
        <tiny-button type="primary" class="create-app-btn" @click="openCreateAppDialog">用此模板创建应用</tiny-button>
      </div>
      <div class="template-detail-preview">
        <div class="template-detail-preview-title">预览体验</div>
        <div class="template-detail-preview-content">
          <iframe id="preview" ref="iframe" :src="previewSrc" style="border: none; width: 100%; height: 100%"></iframe>
        </div>
      </div>
    </div>
    <template-dialog
      v-model:visible="state.appVisible"
      :template="state.templateDetail"
      :openByTemplate="true"
      @confirm="confirmCreateApp"
    ></template-dialog>
  </tiny-drawer>
</template>
<script lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Button, Drawer, Notify, Modal } from '@opentiny/vue'
import { getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import TemplateDialog from './TemplateDialog.vue'
import { isDevelopEnv, createAppFromTemplate, getPageList } from './js/http'

export default {
  components: {
    TinyButton: Button,
    TinyDrawer: Drawer,
    TemplateDialog
  },
  props: {
    template: {
      type: Object,
      default: () => ({})
    }
  },

  setup(props, { emit }) {
    const state = reactive({
      appVisible: false,
      templateDetail: props.template
    })

    const previewSrc = ref('')

    const setVisible = (visible: boolean) => emit('update:visible', visible)

    const openCreateAppDialog = () => {
      state.appVisible = true
    }

    const confirmCreateApp = (formData: any) => {
      createAppFromTemplate(formData)
        .then(() => {
          Modal.confirm({
            message: '应用创建成功，是否直接跳转到应用列表查看？',
            title: '创建成功'
          }).then((res: string) => {
            if (res === 'confirm') {
              emit('handleMenu')
            }
          })
          Notify({
            type: 'success',
            message: '应用创建成功，请到应用列表查看',
            position: 'top-right',
            duration: 5000
          })
        })
        .catch((error: any) => {
          Notify({
            type: 'error',
            message: error,
            position: 'top-right',
            duration: 5000
          })
        })
    }

    onMounted(() => {
      getPageList(1).then((pages: any) => {
        if (pages?.length) {
          const href = window.location.href.split('?')[0] || './'
          // 从预览组件配置获取自定义URL
          const customPreviewUrl = getMergeMeta('engine.toolbars.preview')?.options?.previewUrl
          const defaultPreviewUrl = isDevelopEnv ? `./preview.html` : `${href.endsWith('/') ? href : `${href}/`}preview`
          const query = `tenant=${props.template.tenantId}&id=1&theme=light&framework=${props.template.framework}&platform=${props.template.platform}&pageid=${pages[0].id}&previewType=app&debugMode=hide`
          if (customPreviewUrl) {
            // 如果配置了自定义预览URL，则使用自定义URL
            previewSrc.value =
              typeof customPreviewUrl === 'function'
                ? customPreviewUrl(defaultPreviewUrl, query)
                : `${customPreviewUrl}?${query}`
          } else {
            // 否则使用默认生成的URL
            previewSrc.value = `${defaultPreviewUrl}?${query}`
          }
        }
      })
    })

    return {
      state,
      previewSrc,
      setVisible,
      openCreateAppDialog,
      confirmCreateApp
    }
  }
}
</script>

<style lang="less" scoped>
.tiny-drawer {
  :deep(.tiny-drawer__main) {
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }
}

.template-detail {
  display: flex;
  gap: 60px;
  height: 100%;

  .template-detail-info {
    width: 200px;
    .template-detail-name {
      display: flex;
      gap: 8px;
      align-items: center;
      .template-detail-img {
        width: 40px;
        height: 40px;
      }
      .template-detail-name-text {
        font-size: 18px;
        font-weight: 600;
      }
    }
    .template-detail-tag {
      display: flex;
      gap: 4px;
      margin-top: 12px;
      .tag {
        padding: 2px 4px;
        border-radius: 2px;
        background: var(--te-template-center-common-item-tag-bg-color);
      }
    }
    .template-detail-desc {
      margin-top: 12px;
      color: var(--te-template-center-common-item-desc-text-color);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .template-detail-from {
      margin-top: 16px;
      color: var(--te-template-center-common-item-from-text-color);
    }
    .create-app-btn {
      margin-top: 50px;
      padding: 5px 24px;
    }
  }
  .template-detail-preview {
    width: 100%;
    &-title {
      font-size: 16px;
    }
    &-content {
      margin-top: 20px;
      padding: 24px;
      height: 100%;
      background: var(--te-template-center-detail-bg-color);
    }
  }
}
</style>
