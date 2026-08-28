import { describe, expect, it, vi } from 'vitest'
import JSZip from 'jszip'
import path from 'node:path'
import { VueToDslConverter } from '../../src/converter'

describe('VueToDslConverter edge cases', () => {
  it('should return a conversion error when the source has no template or script', async () => {
    const converter = new VueToDslConverter()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await converter.convertFromString('<style>.page { color: red; }</style>')
    warn.mockRestore()

    expect(result.schema).toBeNull()
    expect(result.dependencies).toEqual([])
    expect(result.errors[0]).toContain('Invalid Vue SFC')
  })

  it('should deduplicate script dependencies and remove the Vue extension from the file name', async () => {
    const converter = new VueToDslConverter()
    const result = await converter.convertFromString(
      `
        <template><div>{{ message }}</div></template>
        <script setup>
          import { ref } from 'vue'
          import Button from '@opentiny/vue'
          const message = ref('hello')
        </script>
      `,
      'Greeting.vue'
    )

    expect(result.errors).toHaveLength(0)
    expect(result.dependencies).toEqual(['vue', '@opentiny/vue'])
    expect(result.schema).toMatchObject({ componentName: 'Page', fileName: 'Greeting', meta: { name: 'Greeting' } })
    expect(result.schema.state.message).toBe('hello')
  })

  it('should use custom parsers and preserve their output in the generated schema', async () => {
    const calls = []
    const converter = new VueToDslConverter({
      customParsers: {
        template: {
          parse: (source) => {
            calls.push(['template', source.trim()])
            return [{ componentName: 'Custom', props: {}, children: [] }]
          }
        },
        script: {
          parse: (source) => {
            calls.push(['script', source.trim()])
            return {
              imports: [],
              state: { value: { type: 'ref', value: 'ref(7)' } },
              methods: {},
              computed: {},
              lifeCycles: {}
            }
          }
        },
        style: {
          parse: (source) => {
            calls.push(['style', source.trim()])
            return { css: source.trim() }
          }
        }
      },
      computed_flag: true
    })
    const result = await converter.convertFromString(
      '<template><div /></template><script setup>const value = 7</script><style>.custom { color: red; }</style>',
      'Custom.vue'
    )

    expect(result.errors).toHaveLength(0)
    expect(calls.map(([name]) => name)).toEqual(['script', 'template', 'style'])
    expect(result.schema).toMatchObject({
      fileName: 'Custom',
      state: { value: 7 },
      css: '.custom { color: red; }',
      children: [{ componentName: 'Custom' }]
    })
  })

  it('should return parser errors in non-strict mode and a null schema in strict mode', async () => {
    const source = '<template><div /></template><script setup>const value = 1</script>'
    const parserOptions = {
      customParsers: {
        script: {
          parse: () => {
            throw new Error('script failed')
          }
        }
      }
    }

    const nonStrict = await new VueToDslConverter(parserOptions).convertFromString(source)
    expect(nonStrict.errors).toEqual([expect.stringContaining('Script parsing error: script failed')])
    expect(nonStrict.schema).toBeDefined()

    const strict = await new VueToDslConverter({ ...parserOptions, strictMode: true }).convertFromString(source)
    expect(strict.schema).toBeNull()
    expect(strict.errors[0]).toContain('Script parsing error: script failed')
  })

  it('should report file read failures and keep result ordering for multiple files', async () => {
    const converter = new VueToDslConverter()
    const missing = path.join(process.cwd(), 'test', 'missing-component.vue')
    const existing = path.join(process.cwd(), 'test', 'testcases', '001_simple', 'input', 'component.vue')
    const result = await converter.convertFromFile(missing)
    const multiple = await converter.convertMultipleFiles([missing, existing])

    expect(result.schema).toBeNull()
    expect(result.errors[0]).toContain('File reading error')
    expect(multiple).toHaveLength(2)
    expect(multiple[0].schema).toBeNull()
    expect(multiple[1].schema).toBeDefined()
  })

  it('should reject malformed ZIP buffers instead of returning a partial schema', async () => {
    const converter = new VueToDslConverter()

    await expect(converter.convertAppFromZip(new Uint8Array([0, 1, 2, 3]))).rejects.toThrow()
  })

  it('should convert a browser ZIP buffer without accessing the file system', async () => {
    const zip = new JSZip()
    zip.file('demo/src/views/Home.vue', '<template><main>Home</main></template>')
    zip.file(
      'demo/src/router/index.js',
      "export default [{ name: 'Home', path: '/home', component: () => import('../views/Home.vue') }]"
    )
    const buffer = await zip.generateAsync({ type: 'uint8array' })
    const originalWindow = globalThis.window
    globalThis.window = { document: {} }

    try {
      const schema = await new VueToDslConverter().convertAppFromZip(buffer)

      expect(schema.pageSchema).toHaveLength(1)
      expect(schema.pageSchema[0]).toMatchObject({ fileName: 'Home', meta: { router: 'home' } })
    } finally {
      globalThis.window = originalWindow
    }
  })

  it('should merge updated options while retaining normalized defaults', () => {
    const converter = new VueToDslConverter({ computed_flag: false })

    expect(converter.getOptions()).toMatchObject({ computed_flag: false, strictMode: false })
    expect(converter.getOptions().componentMap).toBeDefined()

    converter.setOptions({ computed_flag: true, fileName: 'demo' })

    expect(converter.getOptions()).toMatchObject({ computed_flag: true, fileName: 'demo', strictMode: false })
    expect(converter.getOptions().componentMap).toBeDefined()
  })

  it('should convert a browser-style file list and honor its gitignore entries', async () => {
    const originalFileReader = globalThis.FileReader
    class TestFileReader {
      readAsText(file) {
        this.result = file.content
        this.onload?.()
      }
    }

    globalThis.FileReader = TestFileReader
    const file = (relativePath, content) => ({
      webkitRelativePath: `demo/${relativePath}`,
      content
    })
    const files = [
      file('.gitignore', 'ignored.vue'),
      file('ignored.vue', '<template><div>Ignored</div></template>'),
      file('src/views/Home.vue', '<template><main>Home</main></template>'),
      file(
        'src/router/index.js',
        "export default [{ name: 'Home', path: '/home', component: () => import('../views/Home.vue') }]"
      )
    ]

    try {
      const schema = await new VueToDslConverter().convertAppFromDirectory(files)

      expect(schema.pageSchema).toHaveLength(1)
      expect(schema.pageSchema[0]).toMatchObject({ fileName: 'Home', meta: { router: 'home' } })
    } finally {
      globalThis.FileReader = originalFileReader
    }
  })
})
