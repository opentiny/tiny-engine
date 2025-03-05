<template>
  <div v-if="isOpen" class="video-wrap">
    <plugin-setting :title="state.video.title" style="--base-collection-panel-width: 600px" @cancel="closePanel">
      <template #header>
        <close-icon name="close" @click="close"></close-icon>
      </template>
      <template #content>
        <div>
          <video ref="video" controls controlslist="nodownload">
            <source :src="`${state.video.video}#t=1.5`" type="video/mp4" />
          </video>
        </div>
        <div class="md" v-html="state.md"></div>
      </template>
    </plugin-setting>
  </div>
</template>

<script>
import { reactive, ref, watchEffect, onMounted } from 'vue'
import { PluginSetting, CloseIcon } from '@opentiny/tiny-engine-common'
import { marked } from 'marked'

const rendererMD = new marked.Renderer()

let isOpen = ref(false)

export const open = () => {
  isOpen.value = true
}

export const close = () => {
  isOpen.value = false
}

export default {
  components: {
    PluginSetting,
    CloseIcon
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    modelValue: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const state = reactive({
      video: {},
      docs: ''
    })

    const video = ref(null)

    watchEffect(() => {
      state.video = props.modelValue
      state.md = marked(props.modelValue?.docs || '', { sanitize: false })
      video.value?.load()
    })

    onMounted(() => {
      marked.setOptions({
        renderer: rendererMD,
        gfm: true,
        breaks: false,
        pedantic: false,
        smartLists: true,
        sanitize: true,
        smartypants: false
      })
    })

    return {
      state,
      close,
      isOpen,
      video
    }
  }
}
</script>

<style lang="less" scoped>
.video-wrap {
  svg {
    font-size: 16px;
  }
  video {
    width: 100%;
    height: 100%;
  }

  .content {
    color: var(--te-tutorial-text-color);
    line-height: 25px;
    text-indent: 24px;
    padding-top: 20px;
  }
  :deep(.md) {
    color: var(--te-tutorial-text-color);
    ul {
      padding-left: 20px;
    }
    ul > li {
      list-style: disc;
    }
    img {
      max-width: 100%;
      object-fit: contain;
      padding-top: 14px;
    }
  }
}
</style>
