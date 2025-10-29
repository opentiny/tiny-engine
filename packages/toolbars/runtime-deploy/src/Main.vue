<template>
  <div class="toolbar-deploy">
    <toolbar-base
      content="在线部署运行"
      :icon="options.icon?.default || options?.icon"
      :options="options"
      @click-api="deploy"
    >
    </toolbar-base>
  </div>
</template>

<script lang="ts">
/* metaService: engine.toolbars.runtime-deploy.Main */
import { runtimeDeploy } from '@opentiny/tiny-engine-common/js/runtime-deploy'
import { useLayout, useNotify } from '@opentiny/tiny-engine-meta-register'
import { ToolbarBase } from '@opentiny/tiny-engine-common'

export default {
  components: {
    ToolbarBase
  },
  props: {
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup() {
    const deploy = async () => {
      // 检查页面状态，确保有内容
      if (useLayout().isEmptyPage()) {
        useNotify({
          type: 'warning',
          message: '请先创建页面'
        })

        return
      }

      runtimeDeploy()
    }

    return {
      deploy
    }
  }
}
</script>
