<template>
  <tiny-alert
    v-show="showVideo"
    type="simple"
    description="了解有关属性设置的更多信息"
    class="block-alert"
  ></tiny-alert>
  <div class="property-container">
    <block-property-list v-if="!isEdit"></block-property-list>
    <block-property-form v-else></block-property-form>
  </div>
  <block-guide v-show="showVideo" title="区块属性设置指引">
    <template #video>
      <slot name="video"></slot>
    </template>
  </block-guide>
</template>

<script>
import { computed } from 'vue'
import BlockGuide from './BlockGuide.vue'
import BlockPropertyList from './BlockPropertyList.vue'
import BlockPropertyForm from './BlockPropertyForm.vue'
import { getEditProperty } from './js/blockSetting'
import { Alert } from '@opentiny/vue'

export default {
  components: {
    BlockGuide,
    BlockPropertyList,
    BlockPropertyForm,
    TinyAlert: Alert
  },
  props: {
    showVideo: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    return {
      isEdit: computed(() => Boolean(getEditProperty()))
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
