import { describe, expect, it, vi } from 'vitest'

vi.mock('@opentiny/vue-icon', () => ({
  default: {
    IconWarning: {}
  }
}))

import {
  fixComponentName,
  fixMethods,
  getJsonObjectString,
  isPlainObject,
  isValidFastJsonPatch,
  isValidJsonPatchObjectString,
  isValidOperation,
  isValidSchemaChildren,
  jsonPatchAutoFix,
  schemaAutoFix
} from '../../src/utils/schema.utils'

const createComponent = (componentName = 'div', children: any[] = []) => ({
  componentName,
  props: {},
  children
})

describe('schema utils', () => {
  describe('isPlainObject', () => {
    it('accepts regular object literals', () => {
      expect(isPlainObject({})).toBe(true)
      expect(isPlainObject({ componentName: 'TinyButton' })).toBe(true)
    })

    it('rejects arrays, null, and primitive values', () => {
      expect(isPlainObject([])).toBe(false)
      expect(isPlainObject(null)).toBe(false)
      expect(isPlainObject('schema')).toBe(false)
      expect(isPlainObject(1)).toBe(false)
      expect(isPlainObject(false)).toBe(false)
    })
  })

  describe('getJsonObjectString', () => {
    it('extracts json from fenced markdown blocks', () => {
      const content = [
        'AI result:',
        '```json',
        '[{"op":"add","path":"/children/0","value":{"componentName":"div"}}]',
        '```',
        'done'
      ].join('\n')

      expect(getJsonObjectString(content).trim()).toBe(
        '[{"op":"add","path":"/children/0","value":{"componentName":"div"}}]'
      )
    })

    it('extracts json from schema fenced markdown blocks', () => {
      const content = ['```schema', '[{"op":"replace","path":"/css","value":".foo{color:red}"}]', '```'].join('\n')

      expect(getJsonObjectString(content).trim()).toBe('[{"op":"replace","path":"/css","value":".foo{color:red}"}]')
    })

    it('extracts the json patch array from surrounding prose', () => {
      const content =
        '好的，以下是更新内容：[{"op":"add","path":"/children/0","value":{"componentName":"TinyForm"}}]，页面已生成。'

      expect(getJsonObjectString(content)).toBe(
        '[{"op":"add","path":"/children/0","value":{"componentName":"TinyForm"}}]'
      )
    })

    it('returns the original content when no json array is present', () => {
      const content = 'no patch content'

      expect(getJsonObjectString(content)).toBe(content)
    })

    it('uses the outermost array when prose contains nested arrays in values', () => {
      const content =
        'patch: [{"op":"add","path":"/children/0","value":{"componentName":"TinySelect","props":{"options":[1,2,3]}}}] end'

      expect(getJsonObjectString(content)).toBe(
        '[{"op":"add","path":"/children/0","value":{"componentName":"TinySelect","props":{"options":[1,2,3]}}}]'
      )
    })
  })

  describe('isValidOperation', () => {
    it('validates add, replace, and test operations with value', () => {
      expect(isValidOperation({ op: 'add', path: '/children/0', value: createComponent() })).toBe(true)
      expect(isValidOperation({ op: 'replace', path: '/css', value: '.page{}' })).toBe(true)
      expect(isValidOperation({ op: 'test', path: '/componentName', value: 'Page' })).toBe(true)
    })

    it('validates move and copy operations with from', () => {
      expect(isValidOperation({ op: 'move', path: '/children/1', from: '/children/0' })).toBe(true)
      expect(isValidOperation({ op: 'copy', path: '/children/1', from: '/children/0' })).toBe(true)
    })

    it('allows internal _get operations used by the robot prompt flow', () => {
      expect(isValidOperation({ op: '_get', path: '/children' })).toBe(true)
    })

    it('rejects operations with unsupported op, missing path, or missing payload', () => {
      expect(isValidOperation(null)).toBe(false)
      expect(isValidOperation('patch')).toBe(false)
      expect(isValidOperation({ op: 'merge', path: '/children' })).toBe(false)
      expect(isValidOperation({ op: 'add', value: createComponent() })).toBe(false)
      expect(isValidOperation({ op: 'replace', path: '/css' })).toBe(false)
      expect(isValidOperation({ op: 'copy', path: '/children/1' })).toBe(false)
    })
  })

  describe('isValidFastJsonPatch', () => {
    it('accepts a single operation or an operation array', () => {
      const patch = { op: 'add', path: '/children/0', value: createComponent() }

      expect(isValidFastJsonPatch(patch)).toBe(true)
      expect(isValidFastJsonPatch([patch])).toBe(true)
    })

    it('rejects arrays containing invalid operations', () => {
      expect(
        isValidFastJsonPatch([
          { op: 'add', path: '/children/0', value: createComponent() },
          { op: 'replace', path: '/css' }
        ])
      ).toBe(false)
    })
  })

  describe('jsonPatchAutoFix', () => {
    it('keeps all valid patches for final updates', () => {
      const patches = [
        { op: 'add', path: '/children/0', value: createComponent('TinyForm') },
        { op: 'replace', path: '/state/title', value: 'Survey' },
        { op: 'replace', path: '/css', value: '.survey{}' }
      ]

      expect(jsonPatchAutoFix(patches, true)).toEqual(patches)
    })

    it('keeps complete leading patches while streaming', () => {
      const patches = [
        { op: 'replace', path: '/state/title', value: 'Survey' },
        { op: 'add', path: '/children/0', value: createComponent('TinyForm') }
      ]

      expect(jsonPatchAutoFix(patches, false)).toEqual(patches)
    })

    it('drops the last streaming patch when it is not a children patch', () => {
      const patches = [
        { op: 'add', path: '/children/0', value: createComponent('TinyForm') },
        { op: 'replace', path: '/css', value: '.partial{' }
      ]

      expect(jsonPatchAutoFix(patches, false)).toEqual([patches[0]])
    })

    it('filters invalid operations after applying the streaming last-patch rule', () => {
      const validPatch = { op: 'add', path: '/children/0', value: createComponent('TinyForm') }
      const invalidPatch = { op: 'replace', path: '/css' }

      expect(jsonPatchAutoFix([validPatch, invalidPatch], true)).toEqual([validPatch])
    })

    it('keeps a trailing streaming children patch because it can render progressively', () => {
      const patches = [
        { op: 'replace', path: '/state/title', value: 'Survey' },
        { op: 'add', path: '/children/1', value: createComponent('TinyButton') }
      ]

      expect(jsonPatchAutoFix(patches, false)).toEqual(patches)
    })
  })

  describe('isValidSchemaChildren', () => {
    it('accepts missing children and arrays of schema nodes', () => {
      expect(isValidSchemaChildren(undefined)).toBe(true)
      expect(isValidSchemaChildren([createComponent('TinyForm')])).toBe(true)
      expect(isValidSchemaChildren([createComponent('TinyForm', [createComponent('TinyInput')])])).toBe(true)
    })

    it('rejects string nodes that would break canvas node-map generation', () => {
      expect(isValidSchemaChildren(['broken node'])).toBe(false)
      expect(isValidSchemaChildren([createComponent('TinyForm', ['broken child'])])).toBe(false)
    })

    it('rejects null and primitive nested children while allowing empty arrays', () => {
      expect(isValidSchemaChildren([createComponent('TinyForm', [])])).toBe(true)
      expect(isValidSchemaChildren([createComponent('TinyForm', [null])])).toBe(false)
      expect(isValidSchemaChildren([createComponent('TinyForm', [1])])).toBe(false)
      expect(isValidSchemaChildren([createComponent('TinyForm', [false])])).toBe(false)
    })
  })

  describe('isValidJsonPatchObjectString', () => {
    it('accepts valid json patch content', () => {
      const result = isValidJsonPatchObjectString(
        '[{"op":"add","path":"/children/0","value":{"componentName":"TinyButton"}}]'
      )

      expect(result.isError).toBe(false)
    })

    it('repairs slightly incomplete json before validating', () => {
      const result = isValidJsonPatchObjectString(
        '[{"op":"add","path":"/children/0","value":{"componentName":"TinyButton"}}'
      )

      expect(result.isError).toBe(false)
    })

    it('rejects json that is not a valid patch operation', () => {
      const result = isValidJsonPatchObjectString('[{"path":"/children/0"}]')

      expect(result.isError).toBe(true)
    })
  })

  describe('schemaAutoFix', () => {
    it('adds a default component name to plain schema nodes', () => {
      const node = { props: {}, children: [{ props: {} }] }

      schemaAutoFix(node)

      expect(node.componentName).toBe('div')
      expect(node.children[0].componentName).toBe('div')
    })

    it('does not treat json patch operations as schema nodes', () => {
      const patch = { op: 'add', path: '/children/0', value: createComponent() }

      schemaAutoFix(patch)

      expect(patch).not.toHaveProperty('componentName')
    })

    it('recursively keeps existing component names when fixing children', () => {
      const node = createComponent('TinyForm', [createComponent('TinyFormItem'), { props: {} }])

      schemaAutoFix(node)

      expect(node.componentName).toBe('TinyForm')
      expect(node.children[0].componentName).toBe('TinyFormItem')
      expect(node.children[1].componentName).toBe('div')
    })
  })

  describe('fixMethods', () => {
    it('keeps valid JSFunction methods untouched', () => {
      const methods = {
        submit: {
          type: 'JSFunction',
          value: 'function submit() {\n  return true;\n}'
        }
      }

      fixMethods(methods)

      expect(methods.submit.value).toContain('return true')
    })

    it('replaces invalid method definitions with safe placeholders', () => {
      const methods = {
        submit: {
          type: 'JSExpression',
          value: 'this.submit()'
        }
      }

      fixMethods(methods)

      expect(methods.submit.type).toBe('JSFunction')
      expect(methods.submit.value).toContain('function submit()')
    })
  })
})
