<template>
  <div id="help-plugin">
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

<script>
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
    const { activePlugin, getPluginState } = useLayout()
    const pluginState = getPluginState()

    const tinyGuideRef = ref()
    const helpTitle = '帮助与指引'
    const questionTitle = '常见问题'
    const courseUrl = 'https://opentiny.design/tiny-engine#/help-center/course/engine'
    const questionList = [
      {
        label: '如何引入第三方组件库',
        url: 'https://opentiny.design/tiny-engine#/help-center/course/engine/15'
      },
      {
        label: '如何使用AI功能创建页面',
        url: 'https://opentiny.design/tiny-engine#/help-center/course/engine/16'
      },
      {
        label: '答疑视频回放',
        url: 'https://opentiny.design/tiny-engine#/help-center/course/video/38'
      }
    ]

    const state = reactive({
      showStep: false,
      guideWidth: '360',
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
        popPosition: 'right',
        title: '选择组件/区块',
        text: '组件和区块来源于物料资源包（门户网站），下拉滚动面板或搜索您需要的组件（区块），拖拽至画布中，进行页面构建；',
        domElement: '#tiny-engine-left-panel',
        classes: 'lwocode-guide-materials',
        button: [
          {
            text: '下一页',
            action: 'next'
          }
        ],
        beforeShow: () => {
          closeHelpBox()
          activePlugin(META_APP.Materials)
          pluginState.pluginEvent = 'none'
        }
      },
      {
        title: '顶部工具栏',
        text: `<div>
          <div>清除：清空当前画布里的所有内容；</div>
          <div>保存：保存当前画布或者区块数据列；</div>
          <div>锁定：团队协助时，锁定页面后其他人将不能进行编辑；</div>
          <div>预览：打开新页签 预览当前页面或当前区块；</div>
        </div>
        `,
        domElement: '.toolbar-right',
        classes: 'lwocode-guide-toolbar-right',
        button: [
          {
            text: '上一页',
            secondary: true,
            action: 'back'
          },
          {
            text: '下一页',
            action: 'next'
          }
        ]
      },
      {
        title: '组件设置',
        text: '拖拽至画布中的组件或区块，在这里进行属性、样式、事件绑定等众多高级配置；',
        domElement: '#tiny-right-panel',
        classes: 'lwocode-guide-toolbar-right',
        popPosition: 'left',
        button: [
          {
            text: '上一页',
            secondary: true,
            action: 'back'
          },
          {
            text: '下一页',
            action: 'next'
          }
        ]
      },
      {
        title: '插件栏',
        text: `<div>
          <div><strong>页面管理</strong>在这里新增页面/文件夹，还可以对已有的页面进行生命周期管理；</div>
          <div><strong>状态管理</strong>state 是响应式的数据，状态管理面板对 state 的响应式变量进行系统管理，包含添加、变删除、搜索、编辑 state；</div>
          <div><strong>区块管理</strong>区块类似于前端开发中的Component，我们可以将很多页面中都一样的结构（比如 Header），构建到区块中，发布之后直接在页面中拖入使用，提高开发效率；</div>
          <div><strong>资源管理</strong>指引入第三方npm包或引入自定义 function，对于频繁使用的函数或功能，以资源方式引入，避免在应用的每个页面重复定义这些高频函数，提高效率；</div>
          <div><strong>页面JS</strong>您可以通过页面JS编写自己的代码，从而实现较为复杂的业务场景；</div>
        </div>
        `,
        domElement: '#tiny-engine-nav-panel',
        classes: 'lwocode-guide-nav-panel',
        popPosition: 'right',
        button: [
          {
            text: '上一页',
            secondary: true,
            action: 'back'
          },
          {
            text: '完 成',
            action: 'complete'
          }
        ],
        beforeShow: () => {
          state.guideWidth = 550
        },
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
  width: 360px;
  border-radius: 8px;

  // 指引第四步的样式
  &.lwocode-guide-nav-panel {
    width: 550px;

    .shepherd-text > div > div {
      &:not(:last-child) {
        margin-bottom: 6px;
      }

      strong {
        display: inline-block;
        margin-right: 6px;
      }
    }
  }

  .shepherd-content {
    .shepherd-header {
      padding-top: 32px;
      padding-bottom: 12px;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;

      .shepherd-title {
        font-size: 16px;
        line-height: 24px;
        color: var(--ti-lowcode-help-guide-title-text-color);
      }

      .shepherd-cancel-icon {
        position: relative;
        top: -20px;
        right: -6px;
      }
    }

    .shepherd-text {
      font-size: 12px;
      line-height: 20px;
      padding-top: 0;
      padding-bottom: 20px;
      color: var(--ti-lowcode-help-guide-content-text-color);
    }

    .shepherd-footer {
      .progress-style {
        color: var(--ti-lowcode-help-guide-progress-style-text-color);
      }

      .shepherd-button {
        border-radius: 20px;
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
    color: var(--ti-lowcode-help-box-title-text-color);
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
    color: var(--te-common-text-primary);
    fill: var(--te-common-icon-primary);
    span {
      display: flex;
      align-items: center;
      .svg-icon {
        margin-right: 4px;
      }
    }
  }
  &-item:hover {
    background: var(--ti-lowcode-help-box-item-hover-bg-color);
  }

  &-ques {
    &-title {
      padding-top: 8px;
      border-top: 1px solid var(--ti-lowcode-help-box-question-border-top);
    }
  }

  .icon-fillet-external-link {
    width: 16px;
    height: 16px;
  }
}
</style>
