<template>
  <div class="top-panel-logo">
    <h1 class="logo-wrap" @click.stop="handleTitleClick">
      <div class="menu-icon-wrapper">
        <svg-icon name="menu"></svg-icon>
        <span class="menu-title" :title="state.appName">{{ state.appName }}</span>
      </div>
    </h1>
    <div v-if="state.showMenu" class="main-menu">
      <ul>
        <li v-for="(item, index) in menus" :key="index" @click="handleClick(item)">
          <span class="menu-item">{{ item.name }}</span>
        </li>
      </ul>
    </div>
    <tiny-dialog-box v-model:visible="state.show" :title="state.title" width="400px" :append-to-body="true">
      <tiny-form
        ref="form"
        class="publish-app-form"
        :model="state.formData"
        :rules="state.showPreview ? rules : saveRule"
        validate-position="bottom-start"
        :inline-message="true"
        validate-type="text"
        label-position="left"
        :label-align="true"
        label-width="110px"
      >
        <tiny-form-item v-if="!state.showPreview" prop="version" label="历史版本">
          <tiny-input v-model="state.formData.version" placeholder="请输入版本号"></tiny-input>
        </tiny-form-item>
        <div v-else>
          <tiny-form-item prop="commitMsg" label="提交日志">
            <tiny-input
              v-model="state.formData.commitMsg"
              placeholder="请输入提交到git库的日志"
              @blur="repalceTrim"
            ></tiny-input>
          </tiny-form-item>
          <tiny-form-item prop="branch" label="分支名称">
            <tiny-input v-model="state.formData.branch" placeholder="请输入分支名称"></tiny-input>
          </tiny-form-item>

          <tiny-form-item prop="canCreateNewBranch">
            <template #label>创建分支 </template>

            <tiny-switch v-model="state.formData.canCreateNewBranch">
              <template #open>
                <span>是</span>
              </template>
              <template #close>
                <span>否</span>
              </template>
            </tiny-switch>
            <tiny-tooltip
              class="item"
              effect="dark"
              content="分支不存在的时候创建分支。若不开启，分支不存在时发布应用会失败。"
              placement="top"
              popper-class="help-tooltip"
            >
              <icon-help class="tiny-svg-size icon-help"> </icon-help>
            </tiny-tooltip>
          </tiny-form-item>
          <tiny-form-item prop="allGenerate">
            <template #label>生成工程配置 </template>

            <tiny-switch v-model="state.formData.allGenerate">
              <template #open>
                <span>是</span>
              </template>
              <template #close>
                <span>否</span>
              </template>
            </tiny-switch>
            <tiny-tooltip
              class="item"
              effect="dark"
              content="是否生成工程默认配置，如package.json等文件。如选择为否，只生成页面对应代码，不生成配置文件。"
              placement="top"
              popper-class="help-tooltip"
            >
              <icon-help class="tiny-svg-size icon-help"> </icon-help>
            </tiny-tooltip>
          </tiny-form-item>
        </div>
      </tiny-form>
      <template #footer>
        <tiny-button type="primary" @click="confirm">确定</tiny-button>
        <tiny-button @click="state.show = false">取消</tiny-button>
      </template>
    </tiny-dialog-box>

    <tiny-dialog-box v-model:visible="tipBoxVisibility" title="消息" width="30%" :modal="false">
      <span>{{ tipText }}</span>
      <template #footer> </template>
    </tiny-dialog-box>
  </div>
</template>

<script setup>
import { computed, reactive, ref, nextTick, onUnmounted } from 'vue'
import {
  DialogBox as TinyDialogBox,
  Input as TinyInput,
  Button as TinyButton,
  Form as TinyForm,
  FormItem as TinyFormItem,
  Loading,
  Switch as TinySwitch,
  Tooltip as TinyTooltip
} from '@opentiny/vue'
import { iconHelpCircle } from '@opentiny/vue-icon'
import { useLayout, useApp, getGlobalConfig, useModal } from '@opentiny/tiny-engine-controller'
import { useHttp } from '@opentiny/tiny-engine-http'
import { isDevelopEnv } from '@opentiny/tiny-engine-controller/js/environments'

const http = useHttp()

const { activePlugin } = useLayout()

const IconHelp = iconHelpCircle()

const state = reactive({
  hoverState: false,
  showMenu: false,
  show: false,
  showPreview: false,
  formData: {
    version: '',
    account: '',
    password: '',
    commitMsg: '',
    branch: '',
    allGenerate: false,
    canCreateNewBranch: false
  },
  title: computed(() => (state.showPreview ? '发布应用' : '保存历史版本')),
  appName: computed(() => useApp().appInfoState.selectedApp.name),
  leaveTimeoutId: null,
  overTimeoutId: null
})

const tipBoxVisibility = ref(false)
let tipText = ref('发布成功')
const form = ref(null)
const menus = ref(
  getGlobalConfig()?.dslMode === 'Angular' ? [] : [{ name: '应用发布', code: 'publishApp', icon: 'news' }]
)

const repalceTrim = (e) => {
  const val = e.target.value.replaceAll(/^\s*/g, '')
  state.formData.commitMsg = val
}
const getTargetUrl = (centerName) => {
  return `/#/${centerName}/`
}

const actions = {
  pageManagement() {
    activePlugin('AppManage')
  },
  blockManagement() {
    activePlugin('BlockManage')
  },
  gotoPlatformCenter() {
    window.open(getTargetUrl('my-platform'), '_blank')
  },
  gotoMaterialCenter() {
    window.open(getTargetUrl('ecosystem/material'), '_blank')
  },
  logout() {
    window.location.href = '/platform-center/api/logout'
  },
  saveAppHistory() {
    state.show = true
    state.showPreview = false
  },
  publishApp() {
    state.show = true
    const data = localStorage.getItem('tinyengine_publishMsg')
      ? JSON.parse(localStorage.getItem('tinyengine_publishMsg'))
      : ''
    if (data) {
      state.formData.branch = data.branch
      state.formData.allGenerate = false
    }
    state.showPreview = true
  },
  previewApp() {
    const appId = useApp().appInfoState.selectedId
    // 获取租户 id
    const getTenant = () => new URLSearchParams(location.search).get('tenant')
    const tenantId = getTenant() || ''
    const href = window.location.href.split('?')[0] || './'
    const openUrl = isDevelopEnv
      ? `./previewApp.html?appid=${appId}&tenant=${tenantId}`
      : `${href}/previewApp?appid=${appId}&tenant=${tenantId}`
    window.open(openUrl)
  }
}

const confirm = () => {
  const appId = useApp().appInfoState.selectedId

  form.value.validate((valid) => {
    if (valid) {
      if (!state.showPreview) {
        const loading = Loading.service({
          text: '应用保存中，请稍后...',
          customClass: 'new-loading',
          target: document.getElementById('tiny-loading'),
          background: 'rgba(0, 0, 0, 0.8)'
        })
        http.get(`/app-center/api/apps/save/${appId}?version=${state.formData.version}`).then((data) => {
          state.show = false
          loading.close()
          if (data) {
            useModal().message({
              message: '保存成功'
            })
          } else {
            useModal().message({
              message: '保存失败'
            })
          }
        })
      } else {
        const loadingInstance = Loading.service({
          text: '发布中，请稍后...',
          customClass: 'new-loading',
          target: document.getElementById('tiny-loading'),
          background: 'rgba(0, 0, 0, 0.6)'
        })
        state.show = false
        const postData = {
          commitMsg: state.formData.commitMsg,
          branch: state.formData.branch,
          canCreateNewBranch: state.formData.canCreateNewBranch,
          allGenerate: state.formData.allGenerate
        }
        localStorage.setItem('tinyengine_publishMsg', JSON.stringify(postData))
        http
          .post(`/app-center/api/apps/publish/${appId}`, postData)
          .then((data) => {
            if (data.code === 200) {
              tipText.value = '发布成功'
            } else {
              tipText.value = data?.error?.message || '发布失败，请重新发布'
            }

            loadingInstance.close()
            nextTick(() => {
              tipBoxVisibility.value = true
            })
            // 2S后关闭提示窗
            setTimeout(() => {
              tipBoxVisibility.value = false
            }, 5000)
          })
          .catch((err) => {
            loadingInstance.close()
            tipText.value = err?.error?.message || '发布失败，请重新发布'
            nextTick(() => {
              tipBoxVisibility.value = true
            })
            setTimeout(() => {
              tipBoxVisibility.value = false
            }, 5000)
          })
      }
    }
  })
}

const handleClick = ({ code }) => {
  actions[code]?.()
}

const rules = {
  account: [{ required: true, message: '必填', trigger: 'change' }],
  password: [{ required: true, message: '必填', trigger: 'change' }],
  commitMsg: [{ required: true, message: '必填', trigger: 'change' }],
  branch: [{ required: true, message: '必填', trigger: 'change' }]
}

const saveRule = {
  version: [{ required: true, message: '必填', trigger: 'change' }]
}

const handleCloseMenu = () => {
  state.showMenu = false
  window.removeEventListener('click', handleCloseMenu)
}

const handleTitleClick = () => {
  state.showMenu = !state.showMenu

  if (state.showMenu) {
    window.addEventListener('click', handleCloseMenu)
  } else {
    window.removeEventListener('click', handleCloseMenu)
  }
}

onUnmounted(() => {
  window.removeEventListener('click', handleCloseMenu)
})
</script>

<style lang="less" scoped>
.top-panel-logo {
  --menu-title-max-width: 300px;
  position: relative;
  order: -1;
  height: var(--base-top-panel-height);
  display: flex;
  align-items: center;
  .logo-wrap {
    margin: 0 0 0 10px;
    cursor: pointer;
    color: var(--ti-lowcode-toolbar-title-color);
    &:active,
    &:hover {
      .menu-icon-wrapper .icon-menu,
      .menu-title {
        text-decoration: underline;
      }
    }

    .menu-icon-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      color: var(--ti-lowcode-toolbar-title-color);
      font-weight: normal;
      .icon-menu {
        font-size: 20px;
      }
    }
    .menu-title {
      margin-left: 4px;
      font-size: 14px;
      min-width: 48px;
      max-width: var(--menu-title-max-width);
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }

  .main-menu {
    position: absolute;
    top: var(--base-top-panel-height);
    left: 10px;
    color: var(--ti-lowcode-toolbar-icon-color);
    ul {
      min-width: 130px;
      border: 1px solid transparent;
      border-radius: 6px;
      background-color: var(--ti-lowcode-main-menu-bg);
      box-shadow: 0 1px 15px 0 rgb(0 0 0 / 20%);
      padding: 8px 0;
      display: flex;
      flex-direction: column;
      li {
        font-size: 14px;
        color: var(--ti-lowcode-toolbar-title-color);
        cursor: pointer;
        height: 32px;
        width: 100%;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        .tiny-svg {
          margin: 0 9px;
          font-size: 16px;
        }
        &:hover {
          background: var(--ti-lowcode-toolbar-hover-color);
        }

        &:first-child {
          border-radius: 2px 2px 0 0;
        }

        &:last-child {
          border-radius: 0 0 2px 2px;
        }
        .menu-item {
          margin: 0 16px;
          line-height: 20px;
        }
      }
    }
  }
}
.icon-help {
  cursor: pointer;
  margin-left: 8px;
  color: var(--ti-lowcode-toolbar-publish-icon-color);
}

.app-switching-modal {
  &.modal-wrapper {
    left: 34px;
    top: 34px;
    right: auto;
    z-index: 999;

    :deep(.modal-content) {
      text-align: left;
      padding: 0;
      border-radius: 0px;
    }

    .app-list-item {
      padding: 8px 12px;
      display: flex;
      .svg-icon {
        font-size: 18px;
        margin-right: 6px;
      }

      &:hover {
        background: var(--ti-lowcode-toolbar-view-hover-bg);
      }
    }
  }
}

@media screen and(max-width: 1920px) {
  .top-panel-logo {
    --menu-title-max-width: 200px;
  }
}
@media screen and(max-width: 1600px) {
  .top-panel-logo {
    --menu-title-max-width: 100px;
  }
}
@media screen and(max-width: 1400px) {
  .top-panel-logo {
    --menu-title-max-width: 60px;
  }
}
</style>
<style lang="less">
.publish-app-form {
  .tiny-form-item {
    &:last-child {
      margin-bottom: 0;
    }
  }
}
.tiny-tooltip.help-tooltip {
  max-width: 310px;
}
</style>
