import { afterEach, describe, expect, it } from 'vitest'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { VueToDslConverter } from '../../src/converter'

let appRoot

async function createAppFixture() {
  appRoot = await mkdtemp(path.join(os.tmpdir(), 'tiny-engine-vue-to-dsl-'))

  const files = {
    'src/views/Home.vue': `
      <template>
        <main class="hero"><LocalCard :title="title" /></main>
      </template>
      <script setup>
        import { ref } from 'vue'
        import LocalCard from '../components/LocalCard.vue'
        import { formatName } from '../utils'
        const title = ref('Home')
        function save() { return formatName(title.value) }
      </script>
      <style>.hero { background-image: url('../assets/logo.png'); }</style>
    `,
    'src/components/LocalCard.vue': `
      <template><div class="card">{{ title }}</div></template>
      <script setup>defineProps({ title: String })</script>
    `,
    'src/utils.js': `export function formatName(value) { return value.trim() }`,
    'src/router/index.js': `
      export default [{
        name: 'Home',
        path: '/home',
        component: () => import('../views/Home.vue')
      }]
    `,
    'src/i18n/en_US.json': JSON.stringify({ home: { title: 'Home' }, items: ['one', 'two'] }),
    'src/i18n/zh_CN.json': JSON.stringify({ home: { title: '首页' } }),
    'src/lowcodeConfig/dataSource.json': JSON.stringify({ list: [{ name: 'users', type: 'array' }] }),
    'src/stores/user.js': `
      import { defineStore } from 'pinia'
      export const useUserStore = defineStore('user', {
        state: () => ({ token: 'abc', count: 0 })
      })
    `
  }

  await Promise.all(
    Object.entries(files).map(async ([relativePath, content]) => {
      const target = path.join(appRoot, ...relativePath.split('/'))
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, content, 'utf8')
    })
  )

  const assetPath = path.join(appRoot, 'src', 'assets', 'logo.png')
  await mkdir(path.dirname(assetPath), { recursive: true })
  await writeFile(assetPath, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))

  return appRoot
}

afterEach(async () => {
  if (appRoot) {
    await rm(appRoot, { recursive: true, force: true })
    appRoot = undefined
  }
})

describe('VueToDslConverter app integration', () => {
  it('should merge routes, i18n, data sources, stores, local blocks, utils and assets', async () => {
    const converter = new VueToDslConverter({ computed_flag: true })
    const schema = await converter.convertAppDirectory(await createAppFixture())

    expect(schema.pageSchema).toHaveLength(1)
    expect(schema.pageSchema[0].meta).toMatchObject({ router: 'home', isPage: true, isHome: false })
    expect(schema.pageSchema[0].children[0].children[0]).toMatchObject({
      componentName: 'LocalCard',
      componentType: 'Block'
    })

    expect(schema.blockSchemas).toHaveLength(1)
    expect(schema.blockSchemas[0]).toMatchObject({ componentName: 'Block', fileName: 'LocalCard' })
    expect(schema.i18n).toEqual({
      en_US: { 'home.title': 'Home', 'items.0': 'one', 'items.1': 'two' },
      zh_CN: { 'home.title': '首页' }
    })
    expect(schema.dataSource).toEqual({ list: [{ name: 'users', type: 'array' }] })
    expect(schema.globalState).toEqual([{ id: 'user', state: { token: 'abc', count: 0 }, getters: {}, actions: {} }])
    expect(schema.utils.some((item) => item.name === 'formatName')).toBe(true)
    expect(schema.assets).toHaveLength(1)
    expect(schema.assets[0]).toMatchObject({
      filePath: 'src/assets/logo.png',
      name: 'logo.png',
      resourceData: 'data:image/png;base64,iVBORw0KGgo='
    })
    expect(schema.pageSchema[0].css).toContain('__TE_IMPORTED_ASSET_1__')
  })
})
