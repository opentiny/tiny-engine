import { describe, expect, it } from 'vitest'
import {
  buildImportedBlockEvents,
  inferImportedBlockPropTypeFromValue,
  normalizeImportedBlockDefaultValue,
  normalizeImportedBlockPropName,
  normalizeImportedBlockPropType,
  resolveImportedBlockDefaultValue,
  resolveImportedBlockPropType,
  splitImportedBlockBindings,
  toImportedBlockEventKey
} from '../src/blockImport'

describe('block import helpers', () => {
  it('should normalize kebab-case block prop names and event keys', () => {
    expect(normalizeImportedBlockPropName(' model-value ')).toBe('modelValue')
    expect(normalizeImportedBlockPropName('')).toBe('')
    expect(toImportedBlockEventKey('save')).toBe('onSave')
    expect(toImportedBlockEventKey('update:modelValue')).toBe('onUpdate:modelValue')
    expect(toImportedBlockEventKey('onCancel')).toBe('onCancel')
  })

  it('should split block props and event bindings while ignoring structural keys', () => {
    const result = splitImportedBlockBindings({
      'model-value': 1,
      disabled: true,
      onSave: { type: 'JSExpression', value: 'save' },
      'onUpdate:modelValue': 'update',
      key: 'row-1',
      ref: 'button'
    })

    expect(result).toEqual({
      props: { modelValue: 1, disabled: true },
      events: { onSave: { type: 'JSExpression', value: 'save' }, 'onUpdate:modelValue': 'update' }
    })
  })

  it('should build deduplicated event metadata from emits and bindings', () => {
    const events = buildImportedBlockEvents(['save', 'update:modelValue', 'save'], { onCancel: true, ignored: true })

    expect(Object.keys(events).sort()).toEqual(['onCancel', 'onSave', 'onUpdate:modelValue'].sort())
    expect(events.onSave).toEqual({
      name: 'onSave',
      label: { zh_CN: 'onSave' },
      description: { zh_CN: 'onSave' }
    })
  })

  it('should normalize declared and inferred block property types', () => {
    expect(normalizeImportedBlockPropType('Array<string>')).toBe('array')
    expect(normalizeImportedBlockPropType('string | null | undefined')).toBe('string')
    expect(normalizeImportedBlockPropType('number | 1')).toBe('number')
    expect(normalizeImportedBlockPropType('() => void')).toBe('function')
    expect(normalizeImportedBlockPropType('Record<string, unknown>')).toBe('object')
    expect(normalizeImportedBlockPropType('unknown')).toBe('string')
    expect(inferImportedBlockPropTypeFromValue([1])).toBe('array')
    expect(inferImportedBlockPropTypeFromValue({})).toBe('object')
    expect(inferImportedBlockPropTypeFromValue({ type: 'JSFunction', value: 'function() {}' })).toBe('function')
    expect(resolveImportedBlockPropType('', false)).toBe('boolean')
    expect(resolveImportedBlockPropType('Array<string>', [])).toBe('array')
  })

  it('should resolve literal, dynamic and fallback default values by type', () => {
    const dynamicNumber = { type: 'JSExpression', value: 'this.state.count' }

    expect(normalizeImportedBlockDefaultValue(null)).toBe('')
    expect(normalizeImportedBlockDefaultValue(dynamicNumber)).toEqual(dynamicNumber)
    expect(resolveImportedBlockDefaultValue(undefined, 'ready', 'string')).toBe('ready')
    expect(resolveImportedBlockDefaultValue(undefined, dynamicNumber, 'number')).toBe(0)
    expect(resolveImportedBlockDefaultValue(3, dynamicNumber, 'number')).toBe(3)
    expect(resolveImportedBlockDefaultValue(undefined, undefined, 'boolean')).toBe(false)
    expect(resolveImportedBlockDefaultValue(undefined, undefined, 'array')).toEqual([])
  })
})
