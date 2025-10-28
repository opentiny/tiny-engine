import { defineComponent, h } from 'vue'
import RenderMain from '../renderer/RenderMain'

export function withPageRenderer(WrappedComponent: any) {
  return defineComponent({
    name: 'PageRendererHOC',
    props: {
      pageId: {
        type: String,
        required: true
      }
    },
    setup(props) {
      return () => {
        return h(WrappedComponent, {
          pageId: props.pageId
        })
      }
    }
  })
}

// 默认导出
const PageRendererHOC = withPageRenderer(RenderMain)
export default PageRendererHOC
