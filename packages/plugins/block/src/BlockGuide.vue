<template>
  <video-guide :title="title" :src="videoSrc" :cover="img">
    <template #video>
      <slot name="video"></slot>
    </template>
  </video-guide>
</template>

<script>
import { VideoGuide } from '@opentiny/tiny-engine-common'

export default {
  components: {
    VideoGuide
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    video: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    return {
      videoSrc: props.video,
      img: ''
    }
  }
}
</script>

<style lang="less" scoped>
.block-guide {
  display: inline-block;
  padding: 12px;
  :deep(.content) {
    display: inline-block;
    div:nth-child(1) {
      display: inline;
    }
    div:nth-child(2) {
      float: right;
    }
    .guide-video {
      display: block;
    }
  }
}
</style>
