import { reactive } from 'vue'
import { IPageContext } from '../page-block-function'

export interface ICurrentPage {
  pageId: string | number
  schema: any
  pageContext: IPageContext
}
export const currentPage = reactive<ICurrentPage>({
  pageId: null,
  schema: null,
  pageContext: null
})

export function setCurrentPage({ pageId, schema, pageContext }: ICurrentPage) {
  currentPage.pageId = pageId
  currentPage.pageContext = pageContext
  currentPage.schema = schema
}
