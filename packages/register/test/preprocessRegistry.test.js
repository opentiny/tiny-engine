import { describe, expect, it } from 'vitest'
import { preprocessRegistry } from '../src/common'

describe('preprocessRegistry', () => {
  it('should handle normal configuration without array format', () => {
    const registry = {
      layout: { id: 'layout1' },
      plugins: [{ id: 'plugin1' }, { id: 'plugin2' }]
    }

    preprocessRegistry(registry)

    expect(registry).toEqual({
      layout: { id: 'layout1' },
      plugins: [{ id: 'plugin1' }, { id: 'plugin2' }]
    })
  })

  it('should transform array format configuration for multiple entries', () => {
    const registry = {
      plugins: [[{ id: 'plugin1' }, { options: { extraOption1: true } }], { id: 'plugin2' }]
    }

    preprocessRegistry(registry)

    expect(registry).toEqual({
      plugins: [
        {
          id: 'plugin1',
          options: { extraOption1: true }
        },
        { id: 'plugin2' }
      ]
    })
  })

  it('should not transform invalid array formats', () => {
    const registry = {
      layout: [{ id: 'layout1' }, { id: 'layout2' }]
    }

    preprocessRegistry(registry)

    expect(registry).toEqual({
      layout: [{ id: 'layout1' }, { id: 'layout2' }]
    })
  })

  it('should handle empty arrays', () => {
    const registry = {
      layout: []
    }

    preprocessRegistry(registry)

    expect(registry).toEqual({
      layout: []
    })
  })
})
