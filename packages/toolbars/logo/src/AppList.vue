<template>
  <tiny-select v-model="app.id" placeholder="应用名称" @change="appChange">
    <tiny-option
      v-for="item in appInfoState.list"
      :key="`app-${item.name}-${item.id}`"
      :label="item.name"
      :value="item.id"
    ></tiny-option>
  </tiny-select>
</template>

<script>
import { useMessage, getServiceState } from '@opentiny/tiny-engine-meta-register'
import { Select, Option } from '@opentiny/vue'

export default {
  components: {
    TinySelect: Select,
    TinyOption: Option
  },
  setup() {
    const app = getServiceState('engine.service.globalService').appInfo.app

    const appChange = (appId) => {
      useMessage().publish({ topic: 'app_id_changed', data: appId })
    }

    return {
      app,
      appChange
    }
  }
}
</script>
