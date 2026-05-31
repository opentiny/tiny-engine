import { beforeEach, describe, expect, it, vi } from 'vitest'
import { canvasState, resetCanvasState } from '../../mocks/meta-register'

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

vi.mock('../../../src/composables/core/useConfig', () => ({
  default: () => ({
    getSelectedModelInfo: () => ({
      config: {
        chatMode: 'agent'
      }
    })
  })
}))

const getBaseSchema = () => ({
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
    resetCanvasState()
    canvasState.pageSchema = getBaseSchema()
    const { resetPageSchemaUpdateState } = await import('../../../src/composables/core/pageUpdater')
    resetPageSchemaUpdateState()
  })

  it('applies streaming updates without importing the whole schema', async () => {
    const { updatePageSchema } = await import('../../../src/composables/core/pageUpdater')
    const initialSchema = getBaseSchema()

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
    const initialSchema = getBaseSchema()

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
    const initialSchema = getBaseSchema()

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
    const initialSchema = getBaseSchema()

    await updatePageSchema(addButtonPatch(), initialSchema, false)
    expect(getLastSuccessfulPageSchema()).toBeTruthy()

    resetPageSchemaUpdateState()

    expect(getLastSuccessfulPageSchema()).toBeNull()
  })

  it('keeps the final schema after an earlier streaming update has completed', async () => {
    const { updatePageSchema } = await import('../../../src/composables/core/pageUpdater')
    const initialSchema = getBaseSchema()

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
    const initialSchema = getBaseSchema()

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
    const initialSchema = getBaseSchema()

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
