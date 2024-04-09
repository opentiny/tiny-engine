<script setup lang="ts">
import { ConfigProvider, Loading } from '@opentiny/vue'
import DesignToolbars from './DesignToolbars.vue'
import DesignPlugins from './DesignPlugins.vue'
import DesignCanvas from './DesignCanvas.vue'
import DesignSettings from './DesignSettings.vue'
import designSmbConfig from '@opentiny/vue-design-smb'
import { useLayout, useState, useSchema, useProjects, useSearchParam, useNotify, useX6 } from '@opentiny/tiny-engine-controller'
import {onMounted, watch} from 'vue';
const { layoutState } = useLayout()
const { plugins } = layoutState
const toggleNav = ({ item }) => {
  if (!item.id) return
  plugins.render = plugins.render === item.id ? null : item.id
}
const state = useState();
const {updateSchemaFull} = useSchema();
const {getProjectInfo} = useProjects();
let loading = null;
watch(state.loading, ()=>{
  if (state.loading){
    loading = Loading.service({
      lock: true,
      text: '保存中...',
      background: 'rgba(0, 0, 0, .3)',
      customClass: 'loading'
    })
  } else {
    loading && loading.close();
  }
})
onMounted(()=>{
  const id = useSearchParam(window.location.search).get('projectId');
  if (id === undefined){
    useNotify({
      type: 'error',
      message: 'Id 不应该为空'
    })
    window.location.href = '/dashboard.html';
    return;
  }
  const {data, loading} = getProjectInfo(Number(id));
  const {g} = useX6()
  watch(loading, ()=>{
    if (!loading.value){
      updateSchemaFull(data.value.data);
      g.fromJSON(data.value.graphData)
      state.name.value = data.value.name
    }
    state.loading.value = loading.value;
  });
})
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

<style>
.loading .tiny-loading__spinner .tiny-loading__text {
  fill: #fff;
  color: #fff;
}
</style>

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
