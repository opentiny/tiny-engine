<template>
  <div id="help-plugin" class="plugin-help">
    <tiny-popover
      :offset="-100"
      placement="right"
      width="208"
      trigger="click"
      :visible-arrow="false"
      id="help-icon-popover"
    >
      <template #reference>
        <div title="帮助" class="help-plugin-reference">
          <svg-icon name="plugin-icon-plugin-help"></svg-icon>
        </div>
      </template>
      <div class="help-plugin-box">
        <div class="help-plugin-box-title">
          {{ helpTitle }}
        </div>
        <div class="help-plugin-box-body">
          <a :href="courseUrl" target="_blank" class="help-plugin-box-item">
            <span><svg-icon class="svg-icon" name="user-guide"></svg-icon>使用手册</span
            ><icon-fillet-external-link class="icon-fillet-external-link" />
          </a>
          <div class="help-plugin-box-item" @click="toShowStep">
            <span><svg-icon class="svg-icon" name="beginner-guide"></svg-icon>新手引导</span>
          </div>
        </div>
        <div class="help-plugin-box-ques">
          <div class="help-plugin-box-title help-plugin-box-ques-title">{{ questionTitle }}</div>
          <a
            v-for="(item, idx) in questionList"
            :key="idx"
            :href="item.url"
            target="_blank"
            class="help-plugin-box-item"
          >
            <span> {{ idx + 1 }}.{{ item.label }} </span>
            <icon-fillet-external-link class="icon-fillet-external-link" />
          </a>
        </div>
      </div>
    </tiny-popover>

    <tiny-guide
      ref="tinyGuideRef"
      :show-step="state.showStep"
      :dom-data="domData"
      :width="state.guideWidth"
    ></tiny-guide>
  </div>
</template>

<script lang="ts">
/* metaService: engine.plugins.editorhelp.HelpIcon */
import { reactive, onMounted, ref } from 'vue'
import { Guide, Popover } from '@opentiny/vue'
import { IconFilletExternalLink } from '@opentiny/vue-icon'
import { useLayout, META_APP } from '@opentiny/tiny-engine-meta-register'

const GUIDE_VERSION = '1.0.0-20230818'
const GUIDE_STORAGE_KEY = 'tinyengine_guide'

export default {
  components: {
    TinyGuide: Guide,
    TinyPopover: Popover,
    IconFilletExternalLink: IconFilletExternalLink()
  },
  setup() {
    const { activePlugin, layoutState, getPluginState } = useLayout()
    const pluginState = getPluginState()

    const tinyGuideRef = ref()
    const helpTitle = '帮助与指引'
    const questionTitle = '常见问题'
    const courseUrl = 'https://opentiny.design/tiny-engine#/help-center/course/engine'
    const imgUrl = 'https://tinyengine-assets.obs.myhuaweicloud.com/files/designer/drag-drop-action-guide.svg'
    const questionList = [
      {
        label: '如何引入第三方组件库',
        url: 'https://opentiny.design/tiny-engine#/help-center/course/dev/third-party-library-in-designer'
      },
      {
        label: '如何使用AI功能创建页面',
        url: 'https://opentiny.design/tiny-engine#/help-center/course/engine/integrating-chatgpt-for-simple-pages'
      },
      {
        label: '答疑视频回放',
        url: 'https://opentiny.design/tiny-engine#/help-center/course/engine/issue-1-2023.10.27'
      }
    ]

    const state = reactive({
      showStep: false,
      guideWidth: '310',
      helpBox: false
    })
    const closeHelpBox = () => {
      state.helpBox = false
    }

    const openHelpBox = () => {
      state.helpBox = !state.helpBox
    }

    const toShowStep = () => {
      if (!tinyGuideRef.value?.state?.tour?.isActive()) {
        state.showStep = !state.showStep
        state.helpBox = false
      }
    }

    const domData = [
      {
        title: '锁定',
        text: '编辑前请先锁定该页面，锁定后其他用户将无法编辑。',
        domElement: '.toolbar-left .reference-wrapper .icon',
        classes: 'lwocode-guide-materials',
        button: [
          {
            text: '下一步',
            secondary: true,
            action: 'next'
          }
        ],
        beforeShow: () => {
          closeHelpBox()
        }
      },
      {
        popPosition: 'right',
        title: '选择组件/区块',
        text: `<div>
          <div><img src="${imgUrl}" /></div>
          <div>组件和区块来源于物料资源包（门户网站），下拉滚动面板或搜索您需要的组件（区块），拖拽至画布中，进行页面搭建。</div>
        </div>
        `,
        domElement: '#tiny-engine-left-panel',
        classes: 'lwocode-guide-materials',
        button: [
          {
            text: '上一步',
            action: 'back'
          },
          {
            text: '下一步',
            secondary: true,
            action: 'next'
          }
        ],
        beforeShow: () => {
          activePlugin(META_APP.Materials)
          pluginState.pluginEvent = 'none'
        }
      },
      {
        title: '组件设置',
        text: '拖拽至画布中的组件或区块，在这里进行属性、样式、事件绑定等众多高级配置。',
        domElement: '.tiny-engine-right-wrap',
        classes: 'lwocode-guide-toolbar-right',
        popPosition: 'left',
        button: [
          {
            text: '上一步',
            action: 'back'
          },
          {
            text: '下一步',
            secondary: true,
            action: 'next'
          }
        ],
        beforeShow: () => {
          const { settings } = layoutState
          settings.render = META_APP.Props
        }
      },
      {
        title: '预览/出码',
        text: `<div>
          <div>预览：打开新 Tab 页签预览当前页面或区块；</div>
          <div>出码：下载源代码，将当前数据转换并生成代码到本地</div>
        </div>
        `,
        domElement: '.toolbar-helpGuid',
        classes: 'lwocode-guide-toolbar-right',
        button: [
          {
            text: '上一步',
            action: 'back'
          },
          {
            text: '立即体验',
            secondary: true,
            action: 'complete'
          }
        ],
        destroy: () => {
          pluginState.pluginEvent = 'all'
          window.localStorage.setItem(GUIDE_STORAGE_KEY, GUIDE_VERSION)
        }
      }
    ]

    onMounted(() => {
      // 需要注意，同一个平台，有可能会同时出现多个不同版本的设计器。
      const localStorageVersion = window.localStorage.getItem(GUIDE_STORAGE_KEY)

      if (!localStorageVersion || localStorageVersion < GUIDE_VERSION) {
        toShowStep()
      }
    })

    return {
      tinyGuideRef,
      helpTitle,
      questionTitle,
      questionList,
      courseUrl,
      domData,
      state,
      closeHelpBox,
      openHelpBox,
      toShowStep
    }
  }
}
</script>

<style scoped lang="less">
.help-plugin-reference {
  display: flex;
}
</style>

<!-- tiny-guide在body元素上，所以不使用scoped -->
<style lang="less">
div.tiny-guide.shepherd-element {
  width: 310px;
  border-radius: var(--te-base-border-radius-1);

  .shepherd-content {
    .shepherd-header {
      padding: 20px 20px 0;
      border-top-left-radius: var(--te-base-border-radius-1);
      border-top-right-radius: var(--te-base-border-radius-1);

      .shepherd-title {
        font-size: 14px;
        line-height: 19px;
        color: var(--te-help-guide-title-text-color);
      }
    }

    .shepherd-text {
      font-size: 12px;
      line-height: 20px;
      padding: 16px 20px 20px;
      color: var(--te-help-guide-content-text-color);
    }

    .shepherd-footer {
      border-bottom-left-radius: var(--te-base-border-radius-1);
      border-bottom-right-radius: var(--te-base-border-radius-1);
      padding: 0 20px 24px;
      .progress-style {
        color: var(--te-help-guide-progress-style-text-color);
      }

      .shepherd-button {
        border-radius: 4px;
      }
      .shepherd-button-secondary {
        background-color: var(--te-help-guide-button-secondary-bg-color);
        color: var(--te-help-guide-button-secondary-text-color);
        border: 1px solid var(--te-help-guide-button-secondary-border-color);
      }
    }
  }
}

.help-plugin-box {
  cursor: auto;
  border-radius: 6px;
  padding: 4px 0;
  &-top {
    text-align: right;
  }
  &-title {
    color: var(--te-help-box-title-text-color);
    font-size: 12px;
    font-weight: 600;
    line-height: 18px;
    margin: 0 0 8px;
  }
  &-body {
    padding-bottom: 8px;
  }
  &-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    height: 28px;
    line-height: 28px;
    font-size: 12px;
    margin: 0 -16px;
    padding: 0 16px;
    color: var(--te-help-box-item-text-color);
    fill: currentcolor;
    span {
      display: flex;
      align-items: center;
      .svg-icon {
        margin-right: 4px;
      }
    }
  }
  &-item:hover {
    background: var(--te-help-box-item-hover-bg-color);
  }

  &-ques {
    &-title {
      padding-top: 8px;
      border-top: 1px solid var(--te-help-box-question-border-color);
    }
  }

  .icon-fillet-external-link {
    width: 16px;
    height: 16px;
  }
}
</style>
