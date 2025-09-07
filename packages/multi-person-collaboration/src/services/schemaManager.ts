import { useCanvas } from '@opentiny/tiny-engine-meta-register'
import * as Y from 'yjs'
import { NodeSchemaModel } from '../models/NodeSchemaModel'
import { DocManager } from './docManager'
import type { RootNode } from '../type'
import { fromYjs, toYjs } from '../utils'
import { toRaw } from 'vue'
import type { YjsProvider } from './providerManager'
import { IGNORE_OBSERVER_ORIGIN, ROOT_SCHEMA_MAP } from '../config'

type DiffPatch =
  | { type: 'add' | 'update' | 'delete'; path: (string | number)[]; value?: any }
  | { type: 'array-insert'; path: (string | number)[]; items: any[] }
  | { type: 'array-delete'; path: (string | number)[]; count: number; deletedIds: string[] }
  | { type: 'text-insert'; path: (string | number)[]; index: number; text: string }
  | { type: 'text-delete'; path: (string | number)[]; index: number; length: number }

/**
 * SchemaManager 类，负责管理 Yjs 中的 NodeSchema 文档
 */
export class SchemaManager {
  private static instance: SchemaManager
  private schemaMap: Map<string, Y.Map<any>> = new Map()
  private nodeSchemaModelMap: Map<string, NodeSchemaModel> = new Map()
  private observerCallbacks: Map<
    string,
    { yRoot: Y.Map<any>; cb: (events: Y.YEvent<any>[], transaction: Y.Transaction) => void }
  > = new Map()
  private initialSyncDone: Map<string, boolean> = new Map() // 用于区分初始同步和增量同步

  private constructor() {
    // 私有构造器，保证单例模式
    // 初始化内部 Map
    this.schemaMap = new Map<string, Y.Map<any>>()
    this.nodeSchemaModelMap = new Map<string, NodeSchemaModel>()
    this.observerCallbacks = new Map<
      string,
      { yRoot: Y.Map<any>; cb: (events: Y.YEvent<any>[], transaction: Y.Transaction) => void }
    >()
    this.initialSyncDone = new Map<string, boolean>()
  }

  public static getInstance(): SchemaManager {
    if (!SchemaManager.instance) {
      SchemaManager.instance = new SchemaManager()
    }
    return SchemaManager.instance
  }

  // 获取或创建指定 docName 的 NodeSchemaModel 实例
  public createSchema(docName: string, provider: YjsProvider): NodeSchemaModel {
    const docManager = DocManager.getInstance()
    const ydoc = docManager.getOrCreateDoc(docName)

    if (!ydoc) {
      throw Error(`获取或创建指定 ${docName} 的 NodeSchemaModel 实例失败，未找到对应 ydoc`)
    }

    const pageSchema = toRaw(useCanvas().getPageSchema())
    let yMap = this.schemaMap.get(docName)

    if (!yMap) {
      yMap = ydoc.getMap<any>(ROOT_SCHEMA_MAP)
      this.schemaMap.set(docName, yMap)

      // 在注册监听器之前，设置初始同步未完成
      this.initialSyncDone.set(docName, false)

      // 初始化监听器
      this.initObserver(docName, yMap)

      if (provider) {
        provider.on('sync', (isSynced: boolean) => {
          if (isSynced) {
            // 当 provider 第一次同步完成时
            // eslint-disable-next-line no-console
            console.log(`[${docName}] Initial sync complete. Applying full schema to UI.`)

            // 安全时间点，用 Yjs 的权威数据完全覆盖 UI
            const remoteSchema = fromYjs(yMap)
            useCanvas().importSchema(remoteSchema)

            // 标记初始同步已完成
            this.initialSyncDone.set(docName, true)
          }
        })
      }

      // 冷启动：第一次启动，远端无数据 -> 用本地初始化
      if (yMap.size === 0) {
        ydoc.transact(() => {
          toYjs(yMap!, pageSchema)
        }, IGNORE_OBSERVER_ORIGIN)
      }
    } else {
      this.initObserver(docName, yMap)
    }

    const nodeSchemaModel = new NodeSchemaModel(yMap, pageSchema as RootNode)
    this.nodeSchemaModelMap.set(docName, nodeSchemaModel)

    return nodeSchemaModel
  }

  // 获取 NodeSchemaModel
  public getNodeSchemaModel(docName: string): NodeSchemaModel | undefined {
    return this.nodeSchemaModelMap.get(docName)
  }

  // 获取 Y.Map
  public getSchema(docName: string): Y.Map<any> | undefined {
    return this.schemaMap.get(docName)
  }

  // 销毁 schema
  public destroySchema(docName: string): void {
    this.destroyObserver(docName)
    this.schemaMap.delete(docName)
    this.nodeSchemaModelMap.delete(docName)
  }

  // 卸载监听器
  public destroyObserver(docName: string): void {
    const callback = this.observerCallbacks.get(docName)
    if (callback?.cb) {
      this.getSchema(docName)?.unobserveDeep(callback.cb)
      this.observerCallbacks.delete(docName)
    }
  }

  // 初始化监听器
  private initObserver(docName: string, yMap: Y.Map<any>) {
    // 获取已存在，先解绑，避免重复监听/泄露
    const prev = this.observerCallbacks.get(docName) as
      | { yRoot: Y.Map<any>; cb: (events: Y.YEvent<any>[], tr: Y.Transaction) => void }
      | undefined

    // 判断时也使用正确的大小写
    if (prev?.yRoot && prev?.cb) {
      try {
        prev.yRoot.unobserveDeep(prev.cb)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[unobserveDeep error]', e)
      }
    }

    const callback = (events: Y.YEvent<any>[], transaction: Y.Transaction) => {
      // 过滤本地事务
      if (transaction.origin === IGNORE_OBSERVER_ORIGIN || transaction.local) {
        return
      }

      // 如果初始同步还没完成，就忽略所有远程变更
      if (!this.initialSyncDone.get(docName)) {
        // 因为我们将通过 'sync' 事件一次性全量更新 UI
        // eslint-disable-next-line no-console
        console.log(`[${docName}] Ignoring patches during initial sync.`)
        return
      }

      // 在所有事件处理前，中心化地读取一次 meta 信息
      const deletedNodes = (transaction.meta.get('deletedNodes') || []) as any[]
      let deletedNodesConsumed = 0 // 用于追踪 meta 信息是否已被消费

      const patches: DiffPatch[] = []

      for (const event of events) {
        const basePath = event.path ?? []

        // Map 变更
        if (event.target instanceof Y.Map) {
          const yMapNode = event.target

          // 检查 _node_deleted 键的变化
          if (event.changes.keys.has('_node_deleted')) {
            const change = event.changes.keys.get('_node_deleted')

            // 当一个节点被添加了 _node_deleted 属性时
            if (change?.action === 'add' || change?.action === 'update') {
              if (yMapNode.get('_node_deleted') === true) {
                const nodeId = yMapNode.get('id')
                if (nodeId) {
                  // 创建一个自定义的、清晰的 patch 类型
                  patches.push({
                    type: 'array-delete',
                    path: event.path,
                    count: 1,
                    deletedIds: [nodeId]
                  })
                }
              }
            }
          }
        }

        // Array 变更
        if (event.target instanceof Y.Array) {
          let index = 0
          const deltas = (event as Y.YArrayEvent<any>).changes.delta
          const yArray = event.target // 获取被修改的Y.Array 实例

          for (const d of deltas) {
            if (d.retain) {
              index += d.retain
            }

            if (d.delete) {
              const patch: DiffPatch = {
                type: 'array-delete',
                path: [...basePath, index],
                count: d.delete,
                deletedIds: []
              }
              // 只有当 meta 中有未被消费的 deletedNodes 时，才进行附加
              if (deletedNodes.length > deletedNodesConsumed) {
                // 从已消费的位置开始，切片出本次 delete 操作对应的节点信息
                const relevantDeletedNodes = deletedNodes.slice(deletedNodesConsumed, deletedNodesConsumed + d.delete)

                patch.deletedIds = relevantDeletedNodes.map((n) => n.id)
                deletedNodesConsumed += d.delete
              }

              patches.push(patch)
            }

            if (d.insert) {
              const insertCount = d.insert.length

              // 从 event.target (即 yArray) 的当前状态中，切片出新插入的、内容完整的项目
              const insertedYjsItems = yArray.slice(index, index + insertCount)
              const items = insertedYjsItems.map((yjsItem) => fromYjs(yjsItem))

              patches.push({
                type: 'array-insert',
                path: [...basePath, index],
                items
              })

              if (insertedYjsItems.length > 0) {
                // eslint-disable-next-line no-console
                console.log('===insert yjsItem[0].toJSON() (from target)===', insertedYjsItems[0].toJSON())
              }

              index += insertCount
            }
          }
        }
      }

      if (patches.length) {
        try {
          this.applyPatches(docName, patches)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[applyPatches error]', error)
        }
      }
    }

    this.observerCallbacks.set(docName, { yRoot: yMap, cb: callback } as any)
    yMap.observeDeep(callback)
  }

  // 将增量 patch 应用到本地 schema（可按需实现）
  private applyPatches(docName: string, patches: DiffPatch[]) {
    for (const patch of patches) {
      switch (patch.type) {
        case 'array-insert':
          patch.items.forEach((item) => {
            useCanvas().operateNode({
              type: 'insert',
              parentId: item.meta.parentId,
              newNodeData: item.newNode,
              position: item.meta.position,
              referTargetNodeId: item.meta.referTargetNodeId
            })
          })
          break
        case 'array-delete':
          patch.deletedIds.forEach((item) => {
            useCanvas().operateNode({
              type: 'delete',
              id: item
            })
          })
          break
        default:
          break
      }
    }
  }
}
