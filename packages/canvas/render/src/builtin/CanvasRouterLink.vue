<template>
  <a
    href="javascript:void(0)"
    :data-router-target-page-id="to?.name"
    :class="{
      [activeClass]: active,
      [exactActiveClass]: exactActive
    }"
  >
    <slot :href="to" :isActive="active" :isExactActive="exactActive"></slot>
  </a>
</template>
<script lang="ts">
import { computed, inject, PropType, Ref } from 'vue'
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
      // TODO: 支持绝对路径，类型为String
      type: Object as PropType<{
        name: string
      }>
    }
  },
  setup(props) {
    const pageAncestor = (inject('page-ancestors') as Ref<string[] | null>).value
    const active = computed(() => {
      if (!Array.isArray(pageAncestor) || !props.to?.name) {
        return false
      }

      return pageAncestor.includes(props.to.name)
    })

    const exactActive = computed(() => {
      if (!Array.isArray(pageAncestor) || !props.to?.name) {
        return false
      }

      return props.to.name === pageAncestor[pageAncestor.length - 1]
    })

    return {
      active,
      exactActive
    }
  }
}
</script>
