<template>
  <tiny-select :model-value="globalState.appInfo.id" placeholder="应用名称" @change="appChange">
    <tiny-option
      v-for="item in globalState.appList"
      :key="`app-${item.name}-${item.id}`"
      :label="item.name"
      :value="item.id"
    ></tiny-option>
  </tiny-select>
</template>

<script>
import { useMessage, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { Select, Option } from '@opentiny/vue'

export default {
  components: {
    TinySelect: Select,
    TinyOption: Option
  },
  setup() {
    const globalState = getMetaApi(META_SERVICE.GlobalService).getState()

    const appChange = (appId) => {
      useMessage().publish({ topic: 'app_id_changed', data: appId })
    }

    return {
      globalState,
      appChange
    }
  }
}
</script>
