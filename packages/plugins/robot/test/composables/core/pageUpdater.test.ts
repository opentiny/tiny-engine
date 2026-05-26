import { beforeEach, describe, expect, it, vi } from 'vitest'

const canvasState = {
  pageSchema: null as any,
  saved: true,
  imported: [] as any[],
  history: [] as any[],
  published: [] as any[]
}

vi.mock('@opentiny/tiny-engine-utils', () => ({
  utils: {
    deepClone: (value: unknown) => JSON.parse(JSON.stringify(value))
  }
}))

vi.mock('@opentiny/vue-icon', () => ({
  default: {
    IconWarning: {}
  }
}))

vi.mock('@opentiny/tiny-engine-meta-register', () => ({
  useCanvas: () => ({
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
  }),
  useHistory: () => ({
    addHistory: () => {
      canvasState.history.push(JSON.parse(JSON.stringify(canvasState.pageSchema)))
    }
  }),
  useMessage: () => ({
    publish: (event: any) => {
      canvasState.published.push(event)
    }
  })
}))

vi.mock('../../../src/composables/core/useConfig', () => ({
  default: () => ({
    getSelectedModelInfo: () => ({
      config: {
        chatMode: 'agent'
      }
    })
  })
}))

const baseSchema = () => ({
  componentName: 'Page',
  props: {},
  state: {},
  methods: {},
  css: '',
  children: []
})

const addButtonPatch = () =>
  JSON.stringify([
    {
      op: 'add',
      path: '/children/0',
      value: {
        componentName: 'TinyButton',
        props: {
          text: 'Submit'
        },
        children: []
      }
    }
  ])

describe('pageUpdater', () => {
  beforeEach(async () => {
    vi.resetModules()
    canvasState.pageSchema = baseSchema()
    canvasState.saved = true
    canvasState.imported = []
    canvasState.history = []
    canvasState.published = []
  })

  it('applies streaming updates without importing the whole schema', async () => {
    const { updatePageSchema } = await import('../../../src/composables/core/pageUpdater')
    const initialSchema = baseSchema()

    const result = await updatePageSchema(addButtonPatch(), initialSchema, false)

    expect(result?.schema?.children).toHaveLength(1)
    expect(canvasState.pageSchema.children).toHaveLength(1)
    expect(canvasState.pageSchema.children[0].componentName).toBe('TinyButton')
    expect(canvasState.imported).toHaveLength(0)
    expect(canvasState.history).toHaveLength(0)
    expect(canvasState.saved).toBe(false)
    expect(canvasState.published).toEqual([{ topic: 'schemaChange', data: {} }])
  })

  it('imports and records history for final updates', async () => {
    const { updatePageSchema } = await import('../../../src/composables/core/pageUpdater')
    const initialSchema = baseSchema()

    const result = await updatePageSchema(addButtonPatch(), initialSchema, true)

    expect(result?.schema?.children).toHaveLength(1)
    expect(canvasState.imported).toHaveLength(1)
    expect(canvasState.imported[0].children[0].componentName).toBe('TinyButton')
    expect(canvasState.history).toHaveLength(1)
    expect(canvasState.published).toHaveLength(0)
    expect(canvasState.saved).toBe(false)
  })

  it('stores the last successful streaming schema as a final fallback', async () => {
    const { getLastSuccessfulPageSchema, updatePageSchema } = await import('../../../src/composables/core/pageUpdater')
    const initialSchema = baseSchema()

    await updatePageSchema(addButtonPatch(), initialSchema, false)
    const fallbackBeforeFinal = getLastSuccessfulPageSchema()
    const finalResult = await updatePageSchema('not json', initialSchema, true)

    expect(finalResult?.isError).toBe(true)
    expect(getLastSuccessfulPageSchema()).toBe(fallbackBeforeFinal)
    expect(getLastSuccessfulPageSchema()?.children[0].componentName).toBe('TinyButton')
  })

  it('clears the fallback only when a new agent turn starts', async () => {
    const { getLastSuccessfulPageSchema, resetPageSchemaUpdateState, updatePageSchema } = await import(
      '../../../src/composables/core/pageUpdater'
    )
    const initialSchema = baseSchema()

    await updatePageSchema(addButtonPatch(), initialSchema, false)
    expect(getLastSuccessfulPageSchema()).toBeTruthy()

    resetPageSchemaUpdateState()

    expect(getLastSuccessfulPageSchema()).toBeNull()
  })

  it('keeps the final schema after an earlier streaming update has completed', async () => {
    const { updatePageSchema } = await import('../../../src/composables/core/pageUpdater')
    const initialSchema = baseSchema()

    const streamingResult = await updatePageSchema(addButtonPatch(), initialSchema, false)
    const finalResult = await updatePageSchema(
      JSON.stringify([
        {
          op: 'add',
          path: '/children/0',
          value: {
            componentName: 'TinyForm',
            props: {},
            children: []
          }
        }
      ]),
      initialSchema,
      true
    )

    expect(streamingResult?.schema?.children[0].componentName).toBe('TinyButton')
    expect(finalResult?.schema?.children[0].componentName).toBe('TinyForm')
    expect(canvasState.pageSchema.children[0].componentName).toBe('TinyForm')
  })

  it('rejects schemas containing invalid children nodes before touching canvas', async () => {
    const { updatePageSchema } = await import('../../../src/composables/core/pageUpdater')
    const initialSchema = baseSchema()

    const result = await updatePageSchema(
      JSON.stringify([
        {
          op: 'add',
          path: '/children/0',
          value: 'broken child'
        }
      ]),
      initialSchema,
      true
    )

    expect(result?.isError).toBe(true)
    expect(canvasState.imported).toHaveLength(0)
    expect(canvasState.pageSchema.children).toHaveLength(0)
  })

  it('normalizes invalid methods before updating canvas', async () => {
    const { updatePageSchema } = await import('../../../src/composables/core/pageUpdater')
    const initialSchema = baseSchema()

    const result = await updatePageSchema(
      JSON.stringify([
        {
          op: 'add',
          path: '/methods/submit',
          value: {
            type: 'JSExpression',
            value: 'this.submit()'
          }
        }
      ]),
      initialSchema,
      true
    )

    expect(result?.schema?.methods.submit.type).toBe('JSFunction')
    expect(result?.schema?.methods.submit.value).toContain('function submit()')
    expect(canvasState.pageSchema.methods.submit.type).toBe('JSFunction')
  })
})
