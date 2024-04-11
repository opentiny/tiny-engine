/* eslint-disable @typescript-eslint/no-explicit-any */
type SharedApi = {
  di?: {
    useCanvas: () => any
    useHistory: () => any
  }
  saveSchema: (schema: any) => void
  getCurrentSchema: () => any
  getPageSchema: () => any
}

export const sharedApi: SharedApi = {
  saveSchema(schema) {
    if (!sharedApi.di) {
      console.log(schema)
      return
    }

    const { pageState, initData } = sharedApi.di.useCanvas()
    const value = {
      ...schema,
      componentName: pageState.pageSchema.componentName
    }
    initData(value, pageState.currentPage)
    sharedApi.di.useHistory().addHistory()
  },
  getCurrentSchema: () => sharedApi.di?.useCanvas().getCurrentSchema(),
  getPageSchema: () => sharedApi.di?.useCanvas().getPageSchema()
}
