<template>
  <canvas-placeholder placeholder="路由子页面显示位置占位符" :data-te-page-id="pageId"></canvas-placeholder>
</template>
<script>
import { inject } from 'vue'
import CanvasPlaceholder from './CanvasPlaceholder.vue'
export default {
  components: {
    CanvasPlaceholder
  },
  props: {
    name: {
      type: String
    },
    params: {
      type: Object
    }
  },
  setup() {
    const pageId = inject('pageContext')?.pageId

    return { pageId }
  }
}
</script>
