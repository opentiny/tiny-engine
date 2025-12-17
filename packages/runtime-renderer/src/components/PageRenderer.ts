import { defineComponent, h } from 'vue'
import RenderMain from '../renderer/RenderMain'
import { CanvasRouterView } from '../renderer/builtin'

export function withPageRenderer(props: any) {
  const Component = props.isPage ? RenderMain : CanvasRouterView
  return defineComponent({
    name: 'PageRendererHOC',
    render() {
      return h(Component, { pageId: props.pageId, key: props.pageId })
    }
  })
}
