<template>
  <tiny-alert
    v-show="showVideo"
    type="simple"
    description="了解有关事件设置的更多信息"
    class="block-alert"
  ></tiny-alert>
  <tiny-row>
    <tiny-col :span="6">
      <block-event-list></block-event-list>
    </tiny-col>
    <tiny-col class="form" :span="6">
      <block-event-form v-show="isEdit"></block-event-form>
    </tiny-col>
  </tiny-row>
  <block-guide v-show="showVideo" title="区块事件设置指引">
    <template #video>
      <slot name="video"></slot>
    </template>
  </block-guide>
</template>

<script>
import { computed, reactive } from 'vue'
import { Row as TinyRow, Col as TinyCol, Alert as TinyAlert } from '@opentiny/vue'
import BlockGuide from './BlockGuide.vue'
import BlockEventList from './BlockEventList.vue'
import BlockEventForm from './BlockEventForm.vue'
import { getEditEvent } from './js/blockSetting'

export default {
  components: {
    TinyRow,
    TinyCol,
    TinyAlert,
    BlockGuide,
    BlockEventList,
    BlockEventForm
  },
  props: {
    showVideo: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const state = reactive({
      isShowVideo: false
    })

    return {
      state,
      isEdit: computed(() => Boolean(getEditEvent()))
    }
  }
}
</script>

<style lang="less" scoped>
.block-alert {
  color: var(--te-block-alert-text-color);
  height: 28px;
  padding: 6px;
  border: 0;
  font-size: 11px;
  margin-bottom: 12px;
  :deep(.tiny-alert__close) {
    top: 7px;
  }
}
</style>
