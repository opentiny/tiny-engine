import { describe, expect, it } from 'vitest'
import { generateAppSchema, generateSchema } from '../../src/generator/index'

describe('schema generator', () => {
  it('should generate a page schema with transformed state, computed values and stable node ids', async () => {
    const schema = await generateSchema(
      [
        {
          componentName: 'div',
          props: { className: 'page' },
          children: [{ componentName: 'Text', props: { text: 'Hello' }, children: [] }]
        }
      ],
      {
        state: {
          count: { type: 'ref', value: 'ref(2)' },
          settings: { type: 'reactive', value: { enabled: true } }
        },
        computed: {
          doubled: { type: 'computed', value: 'function doubled() { return this.state.count * 2 }' }
        },
        methods: { save: { type: 'function', value: 'function save() {}' } },
        lifeCycles: { onMounted: { type: 'lifecycle', value: 'function onMounted() {}' } },
        props: [{ name: 'title', type: 'string', required: true }],
        emits: ['save']
      },
      { css: '.page { color: red; }' },
      { fileName: 'home', computed_flag: true }
    )

    expect(schema).toMatchObject({
      componentName: 'Page',
      fileName: 'home',
      meta: { name: 'Home' },
      state: {
        count: 2,
        settings: { enabled: true },
        doubled: { accessor: { getter: { type: 'JSFunction' } } }
      },
      methods: { save: { type: 'JSFunction', value: 'function save() {}' } },
      lifeCycles: { onMounted: { type: 'JSFunction', value: 'function onMounted() {}' } },
      props: [{ name: 'title', type: 'string', required: true }],
      emits: ['save'],
      css: '.page { color: red; }'
    })
    expect(schema.computed.doubled).toEqual({
      type: 'JSFunction',
      value: expect.stringContaining('function doubled()')
    })
    expect(schema.id).toMatch(/^[a-z0-9]{8}$/)
    expect(schema.children[0].id).toMatch(/^[a-z0-9]{8}$/)
    expect(schema.children[0].children[0].id).toMatch(/^[a-z0-9]{8}$/)
  })

  it('should omit the computed section while retaining computed state when the flag is disabled', async () => {
    const schema = await generateSchema(
      [],
      { computed: { label: { value: 'function label() { return "ready" }' } } },
      {},
      { fileName: 'status' }
    )

    expect(schema.state.label).toMatchObject({ defaultValue: 'ready' })
    expect(schema.computed).toBeUndefined()
  })

  it('should generate block schemas, preserve existing ids and fill fallback entries', async () => {
    const schema = await generateSchema(
      [
        {
          componentName: 'section',
          id: 'fixed-id',
          props: {},
          children: [{ componentName: 'span', id: 'child-id', props: {}, children: [] }]
        }
      ],
      {
        state: {
          title: { type: 'normal', value: 'Card' },
          enabled: { type: 'ref', value: 'ref(false)' }
        },
        methods: { submit: {} },
        lifeCycles: { mounted: {} },
        props: ['title']
      },
      null,
      { isBlock: true, fileName: 'card' }
    )

    expect(schema).toMatchObject({
      componentName: 'Block',
      fileName: 'card',
      state: { title: 'Card', enabled: false },
      methods: { submit: { type: 'JSFunction', value: 'function() { /* method implementation */ }' } },
      lifeCycles: { mounted: { type: 'JSFunction', value: 'function() { /* lifecycle hook */ }' } },
      props: [{ name: 'title', type: 'any', default: undefined }]
    })
    expect(schema.id).toMatch(/^[a-z0-9]{8}$/)
    expect(schema.children[0].id).toBe('fixed-id')
    expect(schema.children[0].children[0].id).toBe('child-id')
  })

  it('should provide fallback output for incomplete computed, lifecycle and prop entries', async () => {
    const schema = await generateSchema(
      [],
      {
        computed: { broken: {} },
        lifeCycles: { onMounted: 'function onMounted() {}' },
        props: [42]
      },
      {},
      { fileName: 'fallback', computed_flag: true }
    )

    expect(schema.state.broken).toMatchObject({ defaultValue: undefined, accessor: { getter: { type: 'JSFunction' } } })
    expect(schema.computed.broken).toMatchObject({ type: 'JSFunction' })
    expect(schema.lifeCycles.onMounted).toEqual({ type: 'JSFunction', value: 'function onMounted() {}' })
    expect(schema.props).toEqual([42])
  })
})

describe('app schema generator', () => {
  it('should apply default app fields and normalize leading router slashes', () => {
    const pages = [{ fileName: 'Home', meta: { router: '/home' } }]
    const schema = generateAppSchema(pages)

    expect(pages[0].meta.router).toBe('home')
    expect(schema).toMatchObject({
      meta: { name: 'Generated App', description: 'App generated from Vue SFC files' },
      i18n: { en_US: {}, zh_CN: {} },
      utils: [],
      assets: [],
      dataSource: { list: [] },
      globalState: [],
      pageSchema: pages,
      blockSchemas: []
    })
    expect(schema.componentsMap.length).toBeGreaterThan(0)
  })

  it('should preserve explicitly supplied app collections and metadata', () => {
    const pages = [{ fileName: 'Home', meta: { router: '/home' } }]
    const blocks = [{ componentName: 'Block', fileName: 'Card' }]
    const schema = generateAppSchema(pages, {
      name: 'Demo',
      description: 'Demo app',
      i18n: { en_US: { hello: 'Hello' }, zh_CN: {} },
      utils: [{ name: 'format' }],
      assets: [{ name: 'logo.png' }],
      dataSource: { list: [{ name: 'users' }] },
      globalState: [{ id: 'user' }],
      blockSchemas: blocks,
      componentsMap: [{ componentName: 'CustomCard' }]
    })

    expect(schema).toEqual({
      meta: { name: 'Demo', description: 'Demo app' },
      i18n: { en_US: { hello: 'Hello' }, zh_CN: {} },
      utils: [{ name: 'format' }],
      assets: [{ name: 'logo.png' }],
      dataSource: { list: [{ name: 'users' }] },
      globalState: [{ id: 'user' }],
      pageSchema: pages,
      blockSchemas: blocks,
      componentsMap: [{ componentName: 'CustomCard' }]
    })
  })
})
