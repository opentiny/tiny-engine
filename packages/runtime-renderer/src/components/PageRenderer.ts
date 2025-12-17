import { defineComponent, h } from 'vue'
import RenderMain from '../renderer/RenderMain'

export function withPageRenderer(props: any) {
  return defineComponent({
    name: 'PageRendererHOC',
    render() {
      return h(RenderMain, { pageId: props.pageId, key: props.pageId })
    }
  })
}
