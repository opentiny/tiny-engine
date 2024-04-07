<script lang="ts">
import { Loading } from '@opentiny/vue'
export default {
  directives: {
    loading: Loading.directive
  },
}
</script>
<script setup lang="ts">
import { ConfigProvider } from '@opentiny/vue'
import DesignToolbars from './DesignToolbars.vue'
import DesignPlugins from './DesignPlugins.vue'
import DesignCanvas from './DesignCanvas.vue'
import DesignSettings from './DesignSettings.vue'
import designSmbConfig from '@opentiny/vue-design-smb'
import { useLayout } from '@opentiny/tiny-engine-controller'
const { layoutState } = useLayout()
const { plugins } = layoutState
const toggleNav = ({ item }) => {
  if (!item.id) return
  plugins.render = plugins.render === item.id ? null : item.id
}

</script>
<template>
  <config-provider :design="designSmbConfig">
    <div id="tiny-engine">
      <design-toolbars></design-toolbars>
      <div class="tiny-engine-main">
        <div class="tiny-engine-left-wrap">
          <div class="tiny-engine-content-wrap">
            <design-plugins :render-panel="plugins.render" @click="toggleNav"></design-plugins>
            <design-canvas></design-canvas>
          </div>
        </div>
        <div class="tiny-engine-right-wrap">
          <design-settings v-show="layoutState.settings.showDesignSettings" ref="right"></design-settings>
        </div>
      </div>
    </div>
  </config-provider>
</template>


<style lang="less" scoped>
#tiny-engine {
  display: flex;
  flex-flow: column;
  height: 100vh;
  overflow: hidden;
  .tiny-engine-main {
    display: flex;
    flex: 1;
    overflow-y: hidden;
  }
  .tiny-engine-left-wrap {
    flex: 1 1 0;
    display: flex;
    flex-flow: column nowrap;
    z-index: 4;
    .tiny-engine-content-wrap {
      display: flex;
      max-width: 100vw;
      flex: 1;
    }
  }
  .tiny-engine-right-wrap {
    z-index: 4;
  }
  :deep(.monaco-editor .suggest-widget) {
    border-width: 0;
  }
}
</style>
