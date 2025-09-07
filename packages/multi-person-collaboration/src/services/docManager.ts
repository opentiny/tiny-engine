import * as Y from 'yjs'

/**
 * DocManager 类
 * 负责 Y.Doc 示例的创建、管理和销毁
 * 它不直接管理当前活跃文档，而是提供创建和获取文档的纯粹 API。
 */
export class DocManager {
  private static instance: DocManager
  private docs: Map<string, Y.Doc>

  private constructor() {
    this.docs = new Map()
  }

  // 获取DocManager 的单例实例
  public static getInstance(): DocManager {
    if (!DocManager.instance) {
      DocManager.instance = new DocManager()
    }
    return DocManager.instance
  }

  // 创建一个 Y.Doc 的实例，如果文档已存在，则返回现有实例；否则创建新实例
  public getOrCreateDoc(docName: string): Y.Doc {
    if (!this.docs.has(docName)) {
      const ydoc = new Y.Doc()
      this.docs.set(docName, ydoc)
    }
    return this.docs.get(docName)!
  }

  // 获取指定名称的 Y.Doc 实例
  public getDoc(docName: string): Y.Doc | undefined {
    return this.docs.get(docName)
  }

  // 销毁一个 Y.Doc 实例并从管理器中移除
  public destroyDoc(docName: string): void {
    const ydoc = this.docs.get(docName)
    if (ydoc) {
      ydoc.destroy()
      this.docs.delete(docName)
    }
  }

  // 销毁所有 Y.Doc 的实例
  public destroyAllDocs(): void {
    this.docs.forEach((ydoc) => ydoc.destroy())
    this.docs.clear()
  }
}
