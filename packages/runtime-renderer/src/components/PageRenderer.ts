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
      const key = `data-te-page-${props.pageId}`
      return () => {
        return h(WrappedComponent, {
          pageId: props.pageId,
          cssScopeId: key
        })
      }
    }
  })
}

// 默认导出
const PageRendererHOC = withPageRenderer(RenderMain)
export default PageRendererHOC
