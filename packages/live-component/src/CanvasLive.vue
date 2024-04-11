<template>
  <div :style="style">
    <VueLivePreview :code="code" />
  </div>
</template>

<script>
import { VueLivePreview } from 'vue-live-preview-only-fork'

export default {
  components: { VueLivePreview },
  props: {
    code: {
      type: String,
      default: ''
    },
    style: {
      type: String,
      default: ''
    }
  },
  data() {
    return {}
  }
}
</script>
