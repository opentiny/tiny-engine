import { defineComponent, h, ref, onMounted } from 'vue'
import { getController } from '../canvas-function'
import RenderMain from '../RenderMain'
import { handleScopedCss } from './handle-scoped-css'

const pageSchema: Record<string, any> = {}

async function fetchPageSchema(pageId: string) {
  return getController()
    .getPageById(pageId)
    .then((res: any) => {
      return res.page_content
    })
}
const styleSheetMap = new Map()
export function initStyle(key: string, content: string) {
  if (!content) {
    return
  }
  let styleSheet = styleSheetMap.get(key)
  if (!styleSheet) {
    styleSheet = new CSSStyleSheet()
    styleSheetMap.set(key, styleSheet)
    document.adoptedStyleSheets.push(styleSheet)
  }
  handleScopedCss(key, content).then((scopedCss) => {
    styleSheet.replaceSync(scopedCss)
  })
}
export const wrapPageComponent = (pageId: string) => {
  const key = `data-te-page-${pageId}`
  const asyncData = ref(null)
  const updateSchema = () => {
    fetchPageSchema(pageId).then((data) => {
      asyncData.value = data
    })
  }
  updateSchema() // 保证加载一份非编辑态schema，减少页面跳转渲染时间
  pageSchema[pageId] = defineComponent({
    name: `page-${pageId}`,
    setup() {
      const active = ref(pageId === getController().getBaseInfo().pageId)

      onMounted(() => {
        // 切换页面会重新渲染进来，重新渲染说明可能是切换页面了
        // 切换页面后，可能原页面的 schema 更新了，但是我们这里是根据 pageId 获取的 schema，
        // 且是在闭包获取的 schema，不会得到更新的 schema
        // 所以需要重新获取下 schema，不然可能会造成页面数据未更新
        updateSchema()
      })

      return () => {
        if (active.value || asyncData.value) {
          return h(RenderMain, {
            cssScopeId: key,
            renderSchema: asyncData.value as any,
            active: active.value,
            pageId: pageId,
            entry: false
          })
        }
        return null
      }
    }
  })
  return pageSchema[pageId]
}
export const getPage = (pageId: string) => {
  return pageSchema[pageId] || wrapPageComponent(pageId)
}

export async function getPageAncestors(pageId?: string) {
  if (!pageId) {
    return []
  }
  if (!getController().getPageAncestors) {
    // 如果不支持查询祖先 则返回自己
    return [pageId]
  }
  const pageChain = await getController().getPageAncestors(pageId)
  return [...pageChain.map((id: number | string) => String(id)), pageId]
}
