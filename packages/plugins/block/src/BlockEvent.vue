<template>
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
import { Row as TinyRow, Col as TinyCol } from '@opentiny/vue'
import BlockGuide from './BlockGuide.vue'
import BlockEventList from './BlockEventList.vue'
import BlockEventForm from './BlockEventForm.vue'
import { getEditEvent } from './js/blockSetting'

export default {
  components: {
    TinyRow,
    TinyCol,
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
.form {
  margin-top: 45px;
}
</style>
