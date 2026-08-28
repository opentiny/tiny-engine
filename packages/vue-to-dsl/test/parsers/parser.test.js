import { describe, expect, it, vi } from 'vitest'
import { getSFCMeta, parseSFC, parseVueFile, validateSFC } from '../../src/parser/index'
import {
  parseCSSRules,
  extractCSSVariables,
  extractMediaQueries,
  hasMediaQueries,
  parseStyle
} from '../../src/parsers/styleParser'
import { parseScript } from '../../src/parsers/scriptParser'
import { parseTemplate } from '../../src/parsers/templateParser'

describe('SFC parser helpers', () => {
  it('should collect template, script, style and custom block metadata from an SFC', () => {
    const result = parseSFC(`
      <template><main>Hello</main></template>
      <script setup lang="ts">const message: string = 'hello'</script>
      <style scoped lang="scss">main { color: red; }</style>
      <route lang="json">{"name":"home"}</route>
    `)

    expect(validateSFC(result)).toBe(true)
    expect(result.template).toContain('<main>Hello</main>')
    expect(result.templateLang).toBe('html')
    expect(result.scriptSetupLang).toBe('ts')
    expect(result.styleBlocks).toEqual([{ content: 'main { color: red; }', lang: 'scss', scoped: true, module: false }])
    expect(result.customBlocks).toEqual([{ type: 'route', content: '{"name":"home"}', attrs: { lang: 'json' } }])

    expect(getSFCMeta(result)).toMatchObject({
      hasTemplate: true,
      hasScriptSetup: true,
      hasScript: false,
      hasStyle: true,
      templateLang: 'html',
      scriptLang: 'ts'
    })
  })

  it('should reject an SFC that only contains style or custom blocks', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      expect(validateSFC(parseSFC('<style>.page { color: red; }</style>'))).toBe(false)
      expect(validateSFC({})).toBe(false)
    } finally {
      warn.mockRestore()
    }
  })
})

describe('CSS parser helpers', () => {
  it('should parse declarations, variables and media rules', () => {
    const css = `
      :root { --brand-color: #123456; --spacing: 8px; }
      .button { color: var(--brand-color); padding: var(--spacing); }
      @media (min-width: 600px) { .button { padding: 12px; } }
    `

    expect(parseStyle('  .button { color: red; }  ', { scoped: true, lang: 'scss' })).toEqual({
      css: '.button { color: red; }',
      scoped: true,
      lang: 'scss'
    })
    expect(parseStyle('   ')).toEqual({ css: '', scoped: false, lang: 'css' })
    expect(parseCSSRules('.button { color: red; padding: 0; }')).toEqual([
      { selector: '.button', declarations: { color: 'red', padding: '0' } }
    ])
    expect(extractCSSVariables(css)).toEqual({ '--brand-color': '#123456', '--spacing': '8px' })
    expect(hasMediaQueries(css)).toBe(true)
    expect(hasMediaQueries('.button { color: red; }')).toBe(false)
    expect(extractMediaQueries(css)).toEqual([
      {
        condition: '(min-width: 600px)',
        content: '.button { padding: 12px; }',
        rules: [{ selector: '.button', declarations: { padding: '12px' } }]
      }
    ])
  })

  it('should return empty values for missing CSS input', () => {
    expect(parseCSSRules('')).toEqual([])
    expect(extractCSSVariables('')).toEqual({})
    expect(extractMediaQueries('')).toEqual([])
  })

  it('should read a Vue file from disk before parsing its SFC metadata', async () => {
    const filePath = `${__dirname}/../testcases/001_simple/input/component.vue`
    const result = await parseVueFile(filePath)

    expect(result.template).toContain('<div')
    expect(result.style).toBeDefined()
  })
})

describe('template parser', () => {
  const options = {
    state: { visible: {}, items: {}, form: {} },
    methods: { select: {} },
    componentMap: { 'custom-card': 'CustomCard' }
  }

  it('should map directives, loops and interpolations to DSL nodes', () => {
    const nodes = parseTemplate(
      `
      <div class="page" :class="{ active: visible }">
        <p v-if="visible">{{ message }}</p>
        <p v-else>Empty</p>
        <ul><li v-for="(item, index) in items" @click="select(item)">{{ index }}: {{ item.name }}</li></ul>
        <input v-model="form.name" />
      </div>
    `,
      options
    )

    const root = nodes[0]
    expect(root.componentName).toBe('div')
    expect(root.props.className).toMatchObject({ type: 'JSExpression' })
    expect(root.props.className.value).toContain('this.state.visible')
    expect(root.children[0]).toMatchObject({
      componentName: 'p',
      condition: { type: 'JSExpression', value: 'this.state.visible' }
    })
    expect(root.children[1]).toMatchObject({
      componentName: 'p',
      condition: { type: 'JSExpression', value: '!(this.state.visible)' }
    })

    const listItem = root.children.find((item) => item.componentName === 'ul').children[0]
    expect(listItem.loopArgs).toEqual(['item', 'index'])
    expect(listItem.loop).toEqual({ type: 'JSExpression', value: 'this.state.items' })
    expect(listItem.props.onClick.value).toBe('this.select(item)')
    expect(listItem.children[0].props.text.value).toContain('index')

    const input = root.children.find((item) => item.componentName === 'input')
    expect(input.props.modelValue).toEqual({
      type: 'JSExpression',
      value: 'this.state.form.name',
      model: true
    })
  })

  it('should normalize custom component names and literal bindings', () => {
    const [node] = parseTemplate('<custom-card :count="2" disabled />', options)

    expect(node.componentName).toBe('CustomCard')
    expect(node.props).toMatchObject({ count: 2, disabled: true })
  })

  it('should mark imported components as blocks and preserve slot metadata', () => {
    const [node] = parseTemplate(
      '<custom-card class="base" :class="[\'active\', { selected: visible }]" v-show="visible" v-slot:item="{ row }">{{ row.name }}</custom-card>',
      {
        ...options,
        imports: [{ specifiers: [{ local: 'CustomCard' }] }]
      }
    )

    expect(node).toMatchObject({ componentName: 'CustomCard', componentType: 'Block' })
    expect(node.props.className).toEqual({
      type: 'JSExpression',
      value: "['base', ['active', { selected: this.state.visible }]]"
    })
    expect(node.props['v-show']).toEqual({ type: 'JSExpression', value: 'this.state.visible' })
    expect(node.props.slot).toEqual({ name: 'item', params: ['row'] })
    expect(node.children[0].props.text.value).toBe('row.name')
  })

  it('should normalize TinyGrid columns into named JSSlots', () => {
    const [grid] = parseTemplate(
      `
        <TinyGrid>
          <TinyGridColumn field="name">
            <template #default="{ row }"><span>{{ row.name }}</span></template>
          </TinyGridColumn>
        </TinyGrid>
      `,
      options
    )

    expect(grid.componentName).toBe('TinyGrid')
    expect(grid.children).toHaveLength(0)
    expect(grid.props.columns).toEqual([
      {
        field: 'name',
        slots: {
          default: {
            type: 'JSSlot',
            params: ['row'],
            value: [
              {
                componentName: 'span',
                props: {},
                children: [{ componentName: 'Text', props: { text: { type: 'JSExpression', value: 'row.name' } } }]
              }
            ]
          }
        }
      }
    ])
  })

  it('should combine conditions for if, else-if and else branches', () => {
    const nodes = parseTemplate(
      '<div v-if="visible">Visible</div><div v-else-if="loading">Loading</div><div v-else>Empty</div>',
      options
    )

    expect(nodes).toHaveLength(3)
    expect(nodes[0].condition).toEqual({ type: 'JSExpression', value: 'this.state.visible' })
    expect(nodes[1].condition.value).toContain('this.state.loading')
    expect(nodes[1].condition.value).toContain('this.state.visible')
    expect(nodes[2].condition.value).toContain('this.state.visible')
    expect(nodes[2].condition.value).toContain('this.state.loading')
  })

  it('should merge normalized grid columns with an existing literal columns prop', () => {
    const [grid] = parseTemplate(
      `<TinyGrid :columns="[{ field: 'id' }]"><TinyGridColumn field="name">Name</TinyGridColumn></TinyGrid>`,
      options
    )

    expect(grid.props.columns).toEqual([
      { field: 'id' },
      {
        field: 'name',
        slots: {
          default: {
            type: 'JSSlot',
            params: [],
            value: [{ componentName: 'Text', props: { text: 'Name' } }]
          }
        }
      }
    ])
    expect(grid.children).toEqual([])
  })

  it('should return no nodes for comments and empty templates', () => {
    expect(parseTemplate('<!-- ignored -->', options)).toEqual([])
    expect(parseTemplate('   ', options)).toEqual([])
  })
})

describe('script parser', () => {
  it('should extract setup state, props, emits, methods, computed values and runtime aliases', () => {
    const result = parseScript(
      `
        import { ref, reactive, computed, onMounted } from 'vue'
        import { useRouter } from 'vue-router'
        const count = ref(1)
        const state = reactive({ name: 'Alice' })
        const doubled = computed(() => count.value * 2)
        const router = useRouter()
        const props = defineProps({ title: { type: String, required: true }, size: Number })
        const emit = defineEmits(['save'])
        function save(value: string) { emit('save', value) }
        onMounted(() => { console.log(count.value) })
      `,
      { isSetup: true }
    )

    expect(result.imports).toEqual([
      {
        source: 'vue',
        specifiers: [
          { local: 'ref', imported: 'ref', kind: 'named' },
          { local: 'reactive', imported: 'reactive', kind: 'named' },
          { local: 'computed', imported: 'computed', kind: 'named' },
          { local: 'onMounted', imported: 'onMounted', kind: 'named' }
        ]
      },
      { source: 'vue-router', specifiers: [{ local: 'useRouter', imported: 'useRouter', kind: 'named' }] }
    ])
    expect(result.state.count).toEqual({ type: 'ref', value: 1 })
    expect(result.state.name).toEqual({ type: 'reactive', value: 'Alice' })
    expect(result.computed.doubled.value).toContain('function doubled()')
    expect(result.methods.save.value).toContain('function save(value)')
    expect(result.methods.save.value).not.toContain(': string')
    expect(result.lifeCycles.onMounted.value).toContain('function onMounted()')
    expect(result.runtimeAliases.router).toEqual(['router'])
    expect(result.props).toEqual([
      { name: 'title', type: 'string', required: true },
      { name: 'size', type: 'number' }
    ])
    expect(result.emits).toEqual(['save'])
  })

  it('should report syntax errors without throwing', () => {
    const result = parseScript('const = invalid', { isSetup: true })

    expect(result.error).toBeTruthy()
    expect(result.state).toEqual({})
    expect(result.methods).toEqual({})
  })

  it('should parse TypeScript props, withDefaults and typed emits', () => {
    const result = parseScript(
      `
        type FormProps = {
          title?: string
          count: number
          enabled?: boolean
        }
        const props = withDefaults(defineProps<FormProps>(), {
          title: 'Untitled',
          enabled: true
        })
        const emit = defineEmits<{
          (event: 'save', id: number): void
          cancel: []
        }>()
      `,
      { isSetup: true }
    )

    expect(result.props).toEqual([
      { name: 'title', type: 'string', required: false, default: 'Untitled' },
      { name: 'count', type: 'number', required: true },
      { name: 'enabled', type: 'boolean', required: false, default: true }
    ])
    expect(result.emits).toEqual(['save', 'cancel'])
  })

  it('should rewrite router aliases, nextTick and imported utility references', () => {
    const result = parseScript(
      `
        import { ref, nextTick as tick } from 'vue'
        import { useRouter as useAppRouter } from 'vue-router'
        import { formatName } from './utils'
        const router = useAppRouter()
        const count = ref(0)
        async function save() {
          await tick()
          router.push(formatName(String(count.value)))
        }
      `,
      { isSetup: true }
    )

    expect(result.runtimeAliases.router).toEqual(['router'])
    expect(result.runtimeAliases.nextTick).toEqual([])
    expect(result.methods.save.value).toContain('await Promise.resolve()')
    expect(result.methods.save.value).toContain('this.router.push(this.utils.formatName(String(this.state.count)))')
    expect(result.usedUtilsImports).toEqual([
      { source: './utils', imported: 'formatName', local: 'formatName', kind: 'named' }
    ])
  })

  it('should parse Options API props, data, methods, computed values and lifecycle hooks', () => {
    const result = parseScript(`
      export default {
        props: {
          title: { type: String, default: 'Untitled' },
          count: Number
        },
        data() {
          return { count: 1, user: { name: 'Ada' } }
        },
        methods: {
          save: (value) => value.trim()
        },
        computed: {
          label() { return this.user.name }
        },
        mounted() { this.save(this.title) }
      }
    `)

    expect(result.props).toEqual([
      { name: 'title', type: 'string', default: 'Untitled' },
      { name: 'count', type: 'number' }
    ])
    expect(result.state).toEqual({
      count: { type: 'reactive', value: 1 },
      user: { type: 'reactive', value: { name: 'Ada' } }
    })
    expect(result.methods.save.value).toContain('function save(value)')
    expect(result.computed.label.value).toContain('function label()')
    expect(result.lifeCycles.mounted.value).toContain('function mounted()')
  })

  it('should convert h-rendered slot values and namespace utility calls', () => {
    const result = parseScript(
      `
        import { h } from 'vue'
        import * as utils from './utils'
        const slots = {
          default: ({ row }) => h('span', { class: 'cell' }, row.name)
        }
        const save = () => utils.format('ready')
      `,
      { isSetup: true }
    )

    expect(result.state.slots.value.default).toMatchObject({
      type: 'JSSlot',
      params: ['row'],
      value: [
        { componentName: 'span', props: { className: 'cell' }, children: { type: 'JSExpression', value: 'row.name' } }
      ]
    })
    expect(result.methods.save.value).toContain('this.utils.format')
    expect(result.usedUtilsImports).toEqual([{ source: './utils', imported: 'format', local: 'format', kind: 'named' }])
  })

  it('should parse standalone TypeScript defineProps and defineEmits calls', () => {
    const result = parseScript(
      `
        type Props = { title: string }
        defineProps<Props>()
        defineEmits<{ (event: 'submit', id: number): void }>()
      `,
      { isSetup: true }
    )

    expect(result.props).toEqual([{ name: 'title', type: 'string', required: true }])
    expect(result.emits).toEqual(['submit'])
  })
})
