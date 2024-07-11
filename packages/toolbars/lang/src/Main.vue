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
      <div @click="changeLang">
        <span class="icon-hides">
          <svg-icon :name="langSvgIconNameMap[langVal]"></svg-icon>
        </span>
        <span class="operate-title">中英文切换</span>
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
    langChannel: {
      type: String,
      default: BROADCAST_CHANNEL.CanvasLang
    }
  },
  setup(props) {
    const langVal = ref('zh_CN')
    const { post, data } = useBroadcastChannel({ name: props.langChannel })

    watch(data, () => {
      langVal.value = data.value
    })

    const langSvgIconNameMap = {
      zh_CN: 'cn',
      en_US: 'en'
    }

    const options = [
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
      langVal.value = langVal.value === options[0].value ? options[1].value : options[0].value
      post(langVal.value)
    }
    return {
      options,
      langVal,
      changeLang,
      langSvgIconNameMap
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
