<template>
  <span
    v-bind="$attrs"
    :class="{
      [activeClass]: active,
      [exactActiveClass]: exactActive
    }"
  >
    <slot :href="to" :isActive="active" :isExactActive="exactActive"></slot>
  </span>
</template>
<script lang="ts">
import { computed, inject } from 'vue'
export default {
  props: {
    activeClass: {
      type: String,
      default: ''
    },
    exactActiveClass: {
      type: String,
      default: ''
    },
    to: {
      type: String
      // TODO: 待改成页面选择器
      // type: Object as PropType<{
      //   pageId: string
      // }>
    }
  },
  setup(props) {
    const pageAncestor = (inject('page-ancestors') as Ref<string[] | null>).value
    const active = computed(() => pageAncestor?.length && pageAncestor.indexOf(props.to) > -1)
    const exactActive = computed(() => pageAncestor?.length && props.to === pageAncestor[pageAncestor.length - 1])
    return {
      active,
      exactActive
    }
  }
}
</script>
