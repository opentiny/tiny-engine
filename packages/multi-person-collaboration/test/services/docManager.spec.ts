// test/core/docManager.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import * as Y from 'yjs'
import { DocManager } from '../../src/services/docManager'

describe('DocManager 单元测试', () => {
  let manager: DocManager

  beforeEach(() => {
    // 重置单例，保证每个测试用例独立
    // @ts-ignore
    DocManager.instance = undefined
    manager = DocManager.getInstance()
  })

  it('应该返回同一个单例实例', () => {
    const instance2 = DocManager.getInstance()
    expect(instance2).toBe(manager)
  })

  it('应该创建或获取 Y.Doc 实例', () => {
    const doc1 = manager.getOrCreateDoc('doc1')
    expect(doc1).toBeInstanceOf(Y.Doc)

    // 再次获取同名 doc 应该返回同一个实例
    const doc1Again = manager.getOrCreateDoc('doc1')
    expect(doc1Again).toBe(doc1)
  })

  it('应该能够获取已存在的 doc', () => {
    const doc = manager.getOrCreateDoc('doc2')
    const fetched = manager.getDoc('doc2')
    expect(fetched).toBe(doc)

    // 不存在的 doc 返回 undefined
    expect(manager.getDoc('不存在的doc')).toBeUndefined()
  })

  it('应该销毁指定的 doc', () => {
    const doc = manager.getOrCreateDoc('doc3')
    expect(manager.getDoc('doc3')).toBe(doc)

    manager.destroyDoc('doc3')
    expect(manager.getDoc('doc3')).toBeUndefined()
  })

  it('应该销毁所有 doc', () => {
    const docA = manager.getOrCreateDoc('A')
    const docB = manager.getOrCreateDoc('B')

    manager.destroyAllDocs()
    expect(manager.getDoc('A')).toBeUndefined()
    expect(manager.getDoc('B')).toBeUndefined()
  })
})
