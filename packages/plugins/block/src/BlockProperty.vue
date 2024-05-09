<template>
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

export default {
  components: {
    BlockGuide,
    BlockPropertyList,
    BlockPropertyForm
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
