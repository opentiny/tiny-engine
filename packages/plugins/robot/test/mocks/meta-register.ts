export const canvasState = {
  pageSchema: null as any,
  saved: true,
  imported: [] as any[],
  history: [] as any[],
  published: [] as any[]
}

export const resetCanvasState = () => {
  canvasState.pageSchema = null
  canvasState.saved = true
  canvasState.imported = []
  canvasState.history = []
  canvasState.published = []
}

export const useCanvas = () => ({
  pageState: {
    get pageSchema() {
      return canvasState.pageSchema
    },
    set pageSchema(value) {
      canvasState.pageSchema = value
    }
  },
  importSchema: (schema: any) => {
    canvasState.imported.push(JSON.parse(JSON.stringify(schema)))
    canvasState.pageSchema = schema
  },
  setSaved: (saved: boolean) => {
    canvasState.saved = saved
  }
})

export const useHistory = () => ({
  addHistory: () => {
    canvasState.history.push(JSON.parse(JSON.stringify(canvasState.pageSchema)))
  }
})

export const useMessage = () => ({
  publish: (event: any) => {
    canvasState.published.push(event)
  }
})
