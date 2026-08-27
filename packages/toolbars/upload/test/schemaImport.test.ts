import { describe, expect, it } from 'vitest'
import { hydrateImportedAppSchemaState, normalizeImportedAppSchema, normalizeImportedSchema } from '../src/schemaImport'

describe('schema import normalization', () => {
  it('should remove block metadata from router components and normalize runtime helpers', () => {
    const schema = {
      children: [{ componentName: 'RouterLink', componentType: 'Block', props: {} }],
      methods: {
        navigate: {
          type: 'JSFunction',
          value: 'function navigate() { this.$router.push(this.$route.path); await nextTick() }'
        }
      }
    }

    normalizeImportedSchema(schema)

    expect(schema.children[0].componentType).toBeUndefined()
    expect(schema.methods.navigate.value).toContain('this.router.push(this.route.path)')
    expect(schema.methods.navigate.value).toContain('await Promise.resolve()')
  })

  it('should infer computed defaults and rebuild computed getters', () => {
    const schema = {
      state: { label: { accessor: { getter: { type: 'JSFunction', value: 'function getter() {}' } } } },
      computed: { label: { type: 'JSFunction', value: 'function label() { return "ready" }' } }
    }

    normalizeImportedSchema(schema)

    expect(schema.state.label.defaultValue).toBe('ready')
    expect(schema.state.label.accessor.getter.value).toBe('function getter() { this.state.label = "ready" }')
  })

  it('should replace template refs and remove their temporary state entries', () => {
    const schema = {
      state: { button: { defaultValue: null } },
      methods: { focus: { type: 'JSFunction', value: 'function focus() { this.state.button.focus() }' } },
      children: [{ componentName: 'Button', props: { ref: 'button' }, children: [] }]
    }

    normalizeImportedSchema(schema)

    expect(schema.methods.focus.value).toContain("this.$('button').focus()")
    expect(schema.state.button).toBeUndefined()
  })

  it('should convert icon state references and remove unreferenced icon state', () => {
    const schema = {
      state: { TinyIconPanelMini: { type: 'JSExpression', value: 'iconPanelMini()' } },
      children: [
        {
          componentName: 'div',
          props: { icon: { type: 'JSExpression', value: 'this.state.TinyIconPanelMini' } },
          children: []
        }
      ]
    }

    normalizeImportedSchema(schema)

    expect(schema.children[0].props.icon).toEqual({ componentName: 'Icon', props: { name: 'IconPanelMini' } })
    expect(schema.state.TinyIconPanelMini).toBeUndefined()
  })

  it('should wrap multiple roots in a slot with a container node', () => {
    const schema = {
      children: [
        {
          type: 'JSSlot',
          value: [
            { componentName: 'span', props: {} },
            { componentName: 'span', props: {} }
          ]
        }
      ]
    }

    normalizeImportedSchema(schema)

    expect(schema.children[0].value).toHaveLength(1)
    expect(schema.children[0].value[0]).toMatchObject({ componentName: 'div', children: expect.any(Array) })
    expect(schema.children[0].value[0].children).toHaveLength(2)
  })

  it('should normalize pages and blocks in an app schema in place', () => {
    const page = { state: {}, children: [{ componentName: 'RouterView', componentType: 'Block' }] }
    const block = { state: {}, children: [{ componentName: 'RouterLink', componentType: 'Block' }] }
    const appSchema = { pageSchema: [page], blockSchemas: [block] }

    expect(normalizeImportedAppSchema(appSchema)).toBe(appSchema)
    expect(page.children[0].componentType).toBeUndefined()
    expect(block.children[0].componentType).toBeUndefined()
  })
})

describe('imported schema state hydration', () => {
  it('should execute a page mounted hook and write the resulting state back', async () => {
    const appSchema = {
      pageSchema: [
        {
          state: { count: 0 },
          lifeCycles: { onMounted: { type: 'JSFunction', value: 'function onMounted() { this.state.count = 3 }' } }
        }
      ]
    }

    await hydrateImportedAppSchemaState(appSchema)

    expect(appSchema.pageSchema[0].state.count).toBe(3)
  })

  it('should ignore missing app schemas and pages', async () => {
    expect(await hydrateImportedAppSchemaState(undefined)).toBeUndefined()
    expect(await hydrateImportedAppSchemaState({ pageSchema: [] })).toEqual({ pageSchema: [] })
  })
})
