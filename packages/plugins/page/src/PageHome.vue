<template>
  <div class="home">
    <tiny-checkbox class="selectHome" v-model="state.checked" :disabled="state.selectDisable" @change="settingHome"
      >设为主页</tiny-checkbox
    >
    <div class="tip">
      <span>当前主页是</span>
      <span class="home-page">【{{ homePage }}】</span>
    </div>
  </div>
</template>

<script>
import { computed, reactive, watchEffect, inject } from 'vue'
import { Checkbox } from '@opentiny/vue'
import { usePage, useModal, useNotify } from '@opentiny/tiny-engine-meta-register'
import { isVsCodeEnv } from '@opentiny/tiny-engine-common/js/environments'
import { generateRouter } from '@opentiny/tiny-engine-common/js/vscodeGenerateFile'
import http from './http.js'

export default {
  components: {
    TinyCheckbox: Checkbox
  },
  setup() {
    const { pageSettingState, STATIC_PAGE_GROUP_ID } = usePage()
    const { handleRouteHomeUpdate } = http
    const { confirm } = useModal()
    const state = reactive({
      checked: false,
      selectDisable: false
    })
    watchEffect(() => {
      const isChecked = Boolean(pageSettingState.currentPageData?.isHome)
      state.checked = isChecked
      state.selectDisable = isChecked
    })
    const homePage = computed(() => {
      let home = '暂无主页'
      if (pageSettingState.pages[STATIC_PAGE_GROUP_ID]) {
        const data = pageSettingState.pages[STATIC_PAGE_GROUP_ID].data
        const homeData = data.filter((item) => item.isHome)

        if (homeData[0]) {
          home = homeData[0].name
        }
      }

      return home
    })

    const openSettingPanel = inject('openSettingPanel')

    const settingHome = () => {
      confirm({
        title: '提示',
        type: 'warning ',
        message: '是否确定要将此页面设置为主页？您所做的任何未保存的更改都将被丢弃。',
        exec: () => {
          const { id } = pageSettingState.currentPageData
          const params = { ...pageSettingState.currentPageData }

          params.isHome = true

          handleRouteHomeUpdate(id, params)
            .then(() => {
              pageSettingState.updateTreeData()
              openSettingPanel(pageSettingState.currentPageData)
              pageSettingState.isNew = false
              if (isVsCodeEnv) {
                generateRouter({
                  pageId: id,
                  componentsTree: params
                })
              }
              useNotify({ message: '主页设置成功！', type: 'success' })
            })
            .catch(() => {
              useNotify({ message: '主页设置失败！', type: 'error' })
            })
        },
        cancel: () => {
          state.checked = false
        }
      })
    }
    return {
      pageSettingState,
      settingHome,
      homePage,
      state
    }
  }
}
</script>

<style lang="less" scoped>
.home {
  color: var(--te-page-manage-text-color);
  line-height: 24px;
  .homeTitle {
    margin: 10px 0 0 5px;
    display: inline-block;
  }

  .tip {
    color: var(--te-page-manage-tip-text-color);
    margin-top: 4px;
    margin-bottom: 12px;
    font-size: 11px;
    line-height: 16px;
    span {
      color: var(--te-page-manage-tip-text-color);
    }
    .home-page {
      display: inline-block;
    }
  }
  .tiny-button {
    max-width: 300px;
    max-height: 50px;
    height: 33px;
    padding: 0px 20px;
    margin-top: 12px;
    display: flex;
    align-items: center;
    .icon-home {
      display: inline-block;
      margin-right: 8px;
    }
  }
}
</style>
