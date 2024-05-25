<template>
  <div class="tiny-engine-layout">
    <div class="tiny-engine-layout-header">
      <div v-for="(item, index) in state.toolbars" :key="index" class="toolbar-item">
        <component :is="item.component"></component>
      </div>
    </div>
  </div>
  <div class="tiny-engine-layout-content">
    <div class="left-panel">
      <div class="left-panel-top">
        <div
          v-for="(item, index) in state.plugins"
          :key="index"
          class="panel-item"
          :class="{ active: state.active === index }"
          @click="clickPanelItem(item, index)"
        >
          <div class="icon-container">
            <component :is="item.icon"></component>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="tiny-engine-drawer" v-if="state.showDrawer">
    <component :is="state.showComponent"></component>
  </div>
  <div class="main-content">
    <div>canvas</div>
  </div>
  <div class="right-panel">
    <div>settings</div>
  </div>
</template>

<script lang="jsx">
/* metaService */
import './index.less'
import { shallowRef, ref, reactive } from 'vue'

export default {
  props: {
    plugins: {
      type: Array,
      default: () => []
    },
    toolbars: {
      type: Array,
      default: () => []
    },
    settings: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const showDrawer = ref(false)
    const showComponent = shallowRef(null)
    const active = ref(null)

    const state = reactive({
      plugins: props.plugins,
      toolbars: props.toolbars,
      settings: props.settings,
      showComponent,
      active,
      showDrawer,
      drawerWidth: null
    })

    const clickPanelItem = (item, index) => {
      if (active.value === index) {
        showDrawer.value = false
        active.value = null
      } else {
        showDrawer.value = true
        showComponent.value = item.component
        state.drawerWidth = item.span ? (item.span * 100) / 24 + '%' : null
        active.value = index
        if (item.click) {
          item.click()
        }
      }
    }

    return {
      state,
      clickPanelItem
    }
  }
}
</script>
