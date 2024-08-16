<template>
  <tiny-popover
    trigger="hover"
    :open-delay="1000"
    popper-class="toolbar-right-popover"
    append-to-body
    content="画布中英文切换"
    :disabled="true"
  >
    <template #reference>
      <div class="icon" @click="changeLang">
        <span class="icon-hides">
          <svg-icon :name="icon[langVal]"></svg-icon>
        </span>
        <slot name="text"></slot>
      </div>
    </template>
  </tiny-popover>
</template>

<script>
import { ref, watch } from 'vue'
import { useBroadcastChannel } from '@vueuse/core'
import { Popover } from '@opentiny/vue'

import { constants } from '@opentiny/tiny-engine-utils'

const { BROADCAST_CHANNEL } = constants

export default {
  components: {
    TinyPopover: Popover
  },
  props: {
    icon: {
      type: Object
    },
    langChannel: {
      type: String,
      default: BROADCAST_CHANNEL.CanvasLang
    },
    options: {
      type: Object
    }
  },
  setup(props) {
    const langVal = ref('zh_CN')
    const { post, data } = useBroadcastChannel({ name: props.langChannel })

    watch(data, () => {
      langVal.value = data.value
    })

    const langOptions = [
      {
        value: 'zh_CN',
        label: '中文'
      },
      {
        value: 'en_US',
        label: 'English'
      }
    ]
    const changeLang = () => {
      langVal.value = langVal.value === langOptions[0].value ? langOptions[1].value : langOptions[0].value
      post(langVal.value)
    }
    return {
      langOptions,
      langVal,
      changeLang
    }
  }
}
</script>

<style scoped lang="less">
.change-lang-box {
  svg {
    color: var(--ti-lowcode-toolbar-title-color);
    width: 18px;
    height: 18px;
    &:hover {
      opacity: 0.75;
    }
  }
}
.icon {
  color: var(--ti-lowcode-toolbar-title-color);
}
</style>
