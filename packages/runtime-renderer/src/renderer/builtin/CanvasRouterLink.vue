<template>
  <a
    href="javascript:void(0)"
    @click="handleClick"
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
import { computed, PropType } from 'vue'
import { useRouter, useRoute } from 'vue-router'

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
      type: [String, Object] as PropType<
        | string
        | {
            name: string
            params?: Record<string, any>
            query?: Record<string, any>
          }
      >
    }
  },
  setup(props) {
    const router = useRouter()
    const route = useRoute()

    const handleClick = (event: Event) => {
      event.preventDefault()
      if (props?.to) {
        router.push(props.to)
      }
    }

    const active = computed(() => {
      if (!props.to) return false

      try {
        const resolved = typeof props.to === 'string' ? router.resolve({ path: props.to }) : router.resolve(props.to)

        // 检查是否为当前路由或其父路由
        return route.matched.some((matchedRoute) => matchedRoute.name === resolved.name)
      } catch {
        return false
      }
    })

    const exactActive = computed(() => {
      if (!props.to) return false

      try {
        const resolved = typeof props.to === 'string' ? router.resolve({ path: props.to }) : router.resolve(props.to)

        // 精确匹配当前路由
        return route.name === resolved.name
      } catch {
        return false
      }
    })

    return {
      active,
      exactActive,
      handleClick
    }
  }
}
</script>
