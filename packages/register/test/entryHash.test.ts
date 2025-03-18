import { expect, describe, it } from 'vitest'
import { cloneDeep } from 'lodash-es'
import { mergeRegistry } from '../src/entryHash'

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
      layout: {
        id: 'engine.layout',
        options: {
          pluginPanelWidth: '100px'
        }
      },
      plugins: [
        {
          id: 'engine.plugins.outlinetree',
          component: 'MyCustomOutline'
        }
      ]
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

    expect(mergeRegistry(registry, defaultRegistry)).toEqual(expected)
  })

  it('should merge child metas correctly', () => {
    const registry = {
      plugins: [
        {
          id: 'engine.plugins.materials',
          title: '我的物料',
          layout: {
            id: 'engine.plugin.materials.layout',
            component: 'MyMaterialsLayout'
          },
          metas: [
            {
              id: 'engine.plugins.materials.block',
              options: {
                listType: 'grid'
              }
            }
          ]
        }
      ]
    }

    const expected = {
      plugins: [
        // should only include one plugin
        {
          id: 'engine.plugins.materials',
          title: '我的物料', // should replace title
          type: 'plugins', // should merged from defaultRegistry
          icon: 'plugin-icon-materials', // should merged from defaultRegistry
          component: 'Material', // should merged from defaultRegistry
          layout: {
            id: 'engine.plugin.materials.layout',
            component: 'MyMaterialsLayout', // should replace component
            apis: {}, // should merged from defaultRegistry
            options: {} // should merged from defaultRegistry
          },
          metas: [
            // should only include one metaApp
            {
              id: 'engine.plugins.materials.block',
              title: '区块', // should merged from defaultRegistry
              type: 'metaApp', // should merged from defaultRegistry
              component: 'MaterialList', // should merged from defaultRegistry
              options: {
                listType: 'grid' // should merge from registry
              }
            }
          ]
        }
      ]
    }

    expect(mergeRegistry(registry, defaultRegistry)).toEqual(expected)
  })

  it('should not change origin defaultRegistry', () => {
    const registry = {
      layout: {
        id: 'engine.layout',
        options: {
          pluginPanelWidth: '100px'
        }
      },
      plugins: [
        {
          id: 'engine.plugins.outlinetree',
          component: 'MyCustomOutline'
        }
      ]
    }
    const originRegistry = cloneDeep(defaultRegistry)
    mergeRegistry(registry, defaultRegistry)

    expect(defaultRegistry).toEqual(originRegistry)
  })
})
