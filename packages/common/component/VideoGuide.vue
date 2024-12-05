<template>
  <meta-description class="block-guide">
    <template #content>
      <div>{{ title }}</div>
      <div>
        <slot name="video">请观看指引视频</slot>
      </div>
      <template v-if="isVscodeEnvironment">
        <a :href="src" target="_blank">
          <img class="guide-video" :src="cover" :alt="cover" />
        </a>
      </template>
      <template v-else>
        <video class="guide-video" controls>
          <source :src="src" type="video/mp4" />
        </video>
      </template>
    </template>
  </meta-description>
</template>

<script>
import MetaDescription from './MetaDescription.vue'

export default {
  components: {
    MetaDescription
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    src: {
      type: String,
      default: ''
    },
    cover: {
      type: String,
      default: ''
    }
  },
  setup() {
    return {
      isVscodeEnvironment: window.vscodeBridge
    }
  }
}
</script>

<style lang="less" scoped>
.block-guide {
  color: var(--te-common-text-secondary);
  line-height: 2;
  border: none;
  border-color: var(--ti-lowcode-block-video-tip-color);
  margin-bottom: 20px;
  .guide-video {
    width: 250px;
    height: 150px;
    margin-top: 8px;
  }
}
</style>
