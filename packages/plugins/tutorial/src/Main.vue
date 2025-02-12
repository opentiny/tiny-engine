<template>
  <plugin-panel title="TinyEngine 教程" class="tutorial">
    <template #header>
      <svg-button
        class="item icon-sidebar"
        name="fixed"
        :class="[fixedPanels?.includes(PLUGIN_NAME.Tutorial) && 'active']"
        :tips="!fixedPanels?.includes(PLUGIN_NAME.Tutorial) ? '固定面板' : '解除固定面板'"
        @click="$emit('fixPanel', PLUGIN_NAME.Tutorial)"
      ></svg-button>
    </template>
    <template #content>
      <div class="video-container">
        <tiny-collapse v-model="state.expandingNames">
          <tiny-collapse-item
            v-for="item in state.list"
            :key="item.id"
            class="video-item"
            :name="item.id"
            :title="item.name"
          >
            <div class="video-item-content">
              <div
                v-for="tutorial in item.videos"
                :key="tutorial"
                :class="['video-item-content-tutorial', state.active === tutorial.id ? 'active' : '']"
                @mousedown.stop="playVideo(tutorial)"
              >
                <svg-icon name="video"></svg-icon>
                <span class="tutorial-name">{{ tutorial.title }}</span>
                <IconChevronRight v-if="state.active === tutorial.id" class="icon-chevron"></IconChevronRight>
              </div>
            </div>
          </tiny-collapse-item>
        </tiny-collapse>
      </div>
    </template>
  </plugin-panel>
  <tutorial-video-panel v-model="state.video"></tutorial-video-panel>
</template>

<script>
import { onMounted, reactive, ref } from 'vue'
import { PluginPanel, SvgButton } from '@opentiny/tiny-engine-common'
import { IconChevronRight } from '@opentiny/vue-icon'
import { getMetaApi, META_APP } from '@opentiny/tiny-engine-meta-register'
import { Collapse, CollapseItem } from '@opentiny/vue'
import TutorialVideoPanel, { open as openPanel } from './TutorialVideoPanel.vue'
import { fetchTutorialList } from './js/http'

const boxVisibility = ref(false)
const videoData = ref(null)

const open = (data) => {
  videoData.value = data
  boxVisibility.value = true
}

export const api = { open }

export default {
  props: {
    shortcut: [Boolean, String],
    fixedPanels: {
      type: Array
    }
  },
  components: {
    PluginPanel,
    SvgButton,
    TutorialVideoPanel,
    TinyCollapse: Collapse,
    TinyCollapseItem: CollapseItem,
    IconChevronRight: IconChevronRight()
  },
  setup() {
    const state = reactive({
      active: '',
      expandingNames: [],
      show: false,
      video: {},
      list: []
    })

    const playVideo = (data) => {
      state.video = data
      state.active = data.id
      openPanel()
    }

    onMounted(() => {
      fetchTutorialList({ category: 'appDev' })
        .then((data) => {
          if (data) {
            state.list = data
            state.expandingNames = state.list.map(({ id }) => id) // 默认扩展所有
          }
        })
        .catch(() => {})
    })

    const close = () => {
      boxVisibility.value = false
    }

    const openVideoPanel = () => {
      const { open } = getMetaApi(META_APP.Tutorial)
      open()
    }

    return {
      state,
      PLUGIN_NAME: META_APP,
      playVideo,
      boxVisibility,
      close,
      videoData,
      openVideoPanel
    }
  }
}
</script>
<style lang="less" scoped>
.video-container {
  height: calc(100% - 76px);
  overflow-y: scroll;
}
.video-item {
  .video-item-content {
    color: var(--te-tutorial-text-color);
    .video-item-content-tutorial {
      padding: 0 8px;
      display: grid;
      grid-template-columns: 20px 1fr 20px;
      column-gap: 4px;
      background: var(--te-tutorial-bg-color);
      height: 32px;
      line-height: 32px;
      align-items: center;

      svg {
        font-size: 16px;
      }

      &.active,
      &:hover {
        background: var(--te-tutorial-bg-color-hover);
        cursor: pointer;

        svg.icon-chevron {
          font-size: 16px;
        }
      }
    }
  }
  .tutorial-name {
    font-size: 12px;
    display: inline-block;
    width: 108%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}
</style>

<style lang="less">
.tiny-dialog-box__wrapper.tutorial-box {
  .tiny-dialog-box__header {
    padding: 20px;
  }
  .tiny-dialog-box__body {
    padding: 0 20px;
    max-height: unset;
    height: calc(100vh - 54px);
  }

  video {
    width: 100%;
  }
}
</style>
