import { expect, describe, it } from 'vitest'
import { mergeRegistry } from '../src/common'
import { defineEntry } from '../src/entryHash'
import { getMergeMeta } from '../src/common'

// TODO: 测试用例需要更新
// run this test suite in parallel
describe.concurrent('mergeRegistry', () => {
  const defaultRegistry = {
    layout: {
      id: 'engine.layout',
      options: {
        pluginPanelWidth: '200px',
        pluginIconSize: '24px'
      }
    },
    plugins: [
      {
        id: 'engine.plugins.materials',
        title: '物料',
        type: 'plugins',
        icon: 'plugin-icon-materials',
        component: 'Material',
        layout: {
          id: 'engine.plugin.materials.layout',
          component: 'MaterialsLayout',
          apis: {},
          options: {}
        },
        metas: [
          {
            id: 'engine.plugins.materials.component',
            title: '组件',
            type: 'metaApp',
            component: 'ComponentList',
            apis: {},
            options: {}
          },
          {
            id: 'engine.plugins.materials.block',
            title: '区块',
            type: 'metaApp',
            component: 'MaterialList'
          }
        ]
      },
      {
        id: 'engine.plugins.outlinetree',
        title: '大纲树',
        type: 'plugins',
        icon: 'plugin-icon-tree',
        align: 'top',
        component: 'OutlineTree'
      },
      {
        id: 'engine.plugins.i18n',
        title: '国际化',
        type: 'plugins',
        align: 'top',
        component: 'I18n'
      }
    ]
  }
  it('should merge registry correctly', () => {
    const registry = {
      'engine.layout': {
        options: {
          pluginPanelWidth: '100px'
        }
      },
      'engine.plugins.outlinetree': {
        component: 'MyCustomOutline'
      }
    }

    const expected = {
      layout: {
        id: 'engine.layout',
        options: {
          pluginPanelWidth: '100px', // should replaced to 100px
          pluginIconSize: '24px' // should merge from defaultRegistry
        }
      },
      plugins: [
        // should only include one plugin
        {
          id: 'engine.plugins.outlinetree',
          title: '大纲树', // should merged from defaultRegistry
          type: 'plugins', // should merged from defaultRegistry
          icon: 'plugin-icon-tree', // should merged from defaultRegistry
          align: 'top', // should merged from defaultRegistry
          component: 'MyCustomOutline' // should replace component
        }
      ]
    }

    defineEntry(defaultRegistry)
    mergeRegistry(registry)

    const layout = getMergeMeta('engine.layout')
    const outlineTree = getMergeMeta('engine.plugins.outlinetree')

    expect(layout?.options?.pluginPanelWidth).toEqual('100px')
    expect(outlineTree?.component).toEqual('MyCustomOutline')
  })

  it('should not change origin defaultRegistry', () => {
    const registry = {
      'engine.layout': {
        options: {
          pluginPanelWidth: '100px'
        }
      },
      'engine.plugins.outlinetree': {
        component: 'MyCustomOutline'
      }
    }

    defineEntry(defaultRegistry)
    mergeRegistry(registry)

    const layout = getMergeMeta('engine.layout')
    const outlineTree = getMergeMeta('engine.plugins.outlinetree')
    const material = getMergeMeta('engine.plugins.materials')

    expect(layout?.options?.pluginIconSize).toEqual('24px')
    expect(outlineTree?.title).toEqual('大纲树')
    expect(material).toBeDefined()
  })
})
