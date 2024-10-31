<template>
  <Toolbar v-if="showToolbar" />
  <PreviewReact v-if="showReact" />
  <PreviewVue v-if="showVue" />
</template>

<script>
import { useDebugSwitch } from './preview/debugSwitch'
import Config from '../../../config/lowcode.config'
import PreviewReact from './previewReact/Preview.vue'
import PreviewVue from './preview/Preview.vue'
import Toolbar from './Toolbar.vue'
import '@opentiny/tiny-engine-theme'

export default {
  components: {
    PreviewReact,
    PreviewVue,
    Toolbar
  },
  props: {
    showToolbar: {
      type: Boolean,
      default: true
    }
  },
  setup() {
    useDebugSwitch()
    const showReact = (Config.dslMode === 'React')
    const showVue = (Config.dslMode === 'Vue')

    return {
      showReact,
      showVue
    }
  }
}
</script>

<style lang="less" scoped>
/* 一般类型的预览，顶部有工具条 */
#app>.vue-repl {
  --base-top-panel-border-bottom-width: 1px;
  height: calc(100vh - var(--base-top-panel-height) - var(--base-top-panel-border-bottom-width));
}

/* console 类型的预览，内容区域样式 */
#J_container>.vue-repl {
  height: 100%;
  width: 100%;
  position: static;
}
</style>
