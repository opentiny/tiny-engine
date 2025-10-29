import { onMounted, onUnmounted, reactive } from 'vue'

export function useViewport() {
  const viewport = reactive({
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY
  })

  const updateViewport = () => {
    viewport.width = window.innerWidth
    viewport.height = window.innerHeight
    viewport.scrollX = window.scrollX
    viewport.scrollY = window.scrollY
  }

  onMounted(() => {
    window.addEventListener('resize', updateViewport)
    window.addEventListener('scroll', updateViewport)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateViewport)
    window.removeEventListener('scroll', updateViewport)
  })

  return { viewport }
}
