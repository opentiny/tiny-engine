import { useCanvas, useMessage } from '@opentiny/tiny-engine-meta-register'
import * as Y from 'yjs'
import { NodeSchemaModel } from '../models/NodeSchemaModel'
import { DocManager } from './docManager'
import type { RootNode, UpdateAttributesRole } from '../type'
import { fromYjs, sanitizeSchema, toYjs } from '../utils'
import { toRaw } from 'vue'
import type { YjsProvider } from './providerManager'
import { IGNORE_OBSERVER_ORIGIN, INTERNAL_YJS_KEYS, ROOT_SCHEMA_MAP } from '../config'

type DiffPatch =
  | { type: 'add' | 'update' | 'delete'; path: (string | number)[]; value?: any }
  | {
      type: 'array-insert'
      parentId: string
      newNodeData: any
      position: string
      referTargetNodeId: string
    }
  | { type: 'array-delete'; deletedId: string; previousNodeData: any }
  | { type: 'text-insert'; path: (string | number)[]; index: number; text: string }
  | { type: 'text-delete'; path: (string | number)[]; index: number; length: number }
  | { type: 'style-update'; path: (string | number)[]; css: string }
  | { type: 'class-add'; path: (string | number)[]; nodeId: string; className: string }
  | { type: 'props-update'; path: (string | number)[]; props: Record<any, any>; meta: Record<any, any> }
  | { type: 'methods-add-root'; path: (string | number)[]; methods: Record<string, any> }
  | { type: 'methods-delete'; path: (string | number)[]; nodeId: string; methodsName: string }
  | {
      type: 'array-swap'
      parentId: string | undefined
      schemaId: string
      swapId: string
    }
  | {
      type: 'methods-add-node'
      path: (string | number)[]
      methods: Record<string, any>
      methodsName: string
      nodeId: string
    }
  | {
      type: 'attributes-update'
      role: UpdateAttributesRole
      path: (string | number)[]
      value: boolean | Record<string, any> | undefined
      nodeId: string
    }

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
  private eventListeners = new Map() // 用于存储事件监听器

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
    // 优先从缓存获取实例，确保幂等性
    if (this.nodeSchemaModelMap.has(docName)) {
      return this.nodeSchemaModelMap.get(docName)!
    }

    const docManager = DocManager.getInstance()
    const ydoc = docManager.getOrCreateDoc(docName)

    if (!ydoc) {
      throw new Error(`获取或创建指定 ${docName} 的 ydoc 实例失败`)
    }

    const pageSchema = toRaw(useCanvas().getPageSchema())
    let yMap = this.schemaMap.get(docName)

    if (!yMap) {
      yMap = ydoc.getMap<any>(ROOT_SCHEMA_MAP)
      this.schemaMap.set(docName, yMap)

      // 标记初始同步未完成
      this.initialSyncDone.set(docName, false)

      if (provider) {
        const handleInitialSync = (isSynced: boolean) => {
          if (!isSynced) return

          // 确保这个处理器只执行一次
          provider.off('sync', handleInitialSync)

          if (this.initialSyncDone.get(docName)) return

          if (yMap!.size === 0) {
            // 远端无数据 → 用本地 schema 初始化
            // eslint-disable-next-line no-console
            console.log(`[${docName}] Remote empty. Using local schema to initialize yMap.`)
            ydoc.transact(() => {
              toYjs(yMap!, pageSchema)
            }, IGNORE_OBSERVER_ORIGIN)
          } else {
            // 远端有数据 → 用远端覆盖 UI
            // eslint-disable-next-line no-console
            console.log(`[${docName}] Remote has data. Importing remote schema to UI.`)
            const rawRemoteSchema = fromYjs(yMap!)
            const cleanSchema = sanitizeSchema(rawRemoteSchema, INTERNAL_YJS_KEYS)
            useCanvas().importSchema(cleanSchema)
          }

          // 标记初始同步完成
          this.initialSyncDone.set(docName, true)
        }

        provider.on('sync', handleInitialSync)
      }
    }

    // 确保监听器幂等（假设内部做了防重复处理）
    this.initObserver(docName, yMap)
    this.setupEventListeners(docName)

    // 创建并缓存 NodeSchemaModel 实例
    const nodeSchemaModel = new NodeSchemaModel(yMap, pageSchema as RootNode, docName)
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

  // 设置一个专门的监听器来处理来自“事件总线”的自定义操作
  // 处理无法被 initObserver 监听器很好处理的事件
  public setupEventListeners(docName: string): void {
    // 解绑旧的监听器，防止重复
    if (this.eventListeners.has(docName)) {
      const { map, cb } = this.eventListeners.get(docName)
      map.unobserve(cb)
    }

    const docManager = DocManager.getInstance()
    const ydoc = docManager.getOrCreateDoc(docName)
    const eventsMap = ydoc.getMap('__app_events__')

    const eventCallback = (event: Y.YMapEvent<any>, transaction: Y.Transaction) => {
      if (transaction.local) return

      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add') {
          const payload: any = eventsMap.get(key)

          if (payload && payload.op === 'move') {
            const patch: DiffPatch = {
              type: 'array-swap',
              parentId: payload.parentId,
              schemaId: payload.schemaId,
              swapId: payload.swapId
            }
            this.applyPatches(docName, [patch])
          } else if (payload && payload.op === 'insert') {
            const patch: DiffPatch = {
              type: 'array-insert',
              parentId: payload.parentId,
              newNodeData: payload.newNodeData,
              position: payload.position,
              referTargetNodeId: payload.referTargetNodeId
            }

            this.applyPatches(docName, [patch])
          } else if (payload && payload.op === 'delete') {
            const patch: DiffPatch = {
              type: 'array-delete',
              deletedId: payload.deletedNodeId,
              previousNodeData: payload.previousNodeData
            }

            this.applyPatches(docName, [patch])
          }
        }

        eventsMap.delete(key)
      })
    }

    // 绑定监听器
    eventsMap.observe(eventCallback)
    this.eventListeners.set(docName, { map: eventsMap, cb: eventCallback })
  }

  // 初始化监听器
  private initObserver(docName: string, yMap: Y.Map<any>) {
    // 获取已存在，先解绑，避免重复监听/泄露
    const prev = this.observerCallbacks.get(docName) as
      | { yRoot: Y.Map<any>; cb: (events: Y.YEvent<any>[], tr: Y.Transaction) => void }
      | undefined

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

      const docManager = DocManager.getInstance()
      const ydoc = docManager.getOrCreateDoc(docName)
      const eventsMap: Y.Map<any> = ydoc.getMap('__app_events__')
      if (transaction.changed.has(eventsMap as any)) {
        // 这个事务包含了对 eventsMap 的修改，意味着它是一个我们自定义的复合操作。
        // 我们的 eventCallback 已经或即将处理它。
        // 因此，我们在这里跳过，以避免对底层的 delete/insert 进行重复处理。
        // eslint-disable-next-line no-console
        console.log('[observeDeep] Skipping transaction, as it is handled by the Event Bus.')
        return
      }

      const patches: DiffPatch[] = []

      for (const event of events) {
        // Map 变更
        if (event.target instanceof Y.Map) {
          const yMapNode = event.target
          const regex = /^on[A-Z][A-Za-z]*$/
          const attributesKey = ['condition', 'loop', 'loopArgs', 'clean']

          event.changes.keys.forEach((change, key) => {
            if (key === 'className') {
              // 新增样式，为配合 css 更新
              if (change.action === 'add' || change.action === 'update') {
                const newClassAndId = yMapNode.get('className')
                const [className, nodeId] = (newClassAndId as string).split('_')
                patches.push({
                  type: 'class-add',
                  path: event.path,
                  nodeId,
                  className
                })
              }
            } else if (key === 'css') {
              // css 更新同步逻辑
              if (change.action === 'update' || change.action === 'add') {
                const newCss = yMapNode.get('css')
                patches.push({
                  type: 'style-update',
                  path: event.path,
                  css: newCss
                })
              }
            } else if (key === 'props') {
              // Props 属性更新同步逻辑
              if (change.action === 'add' || change.action === 'update') {
                const newProps = yMapNode.get('props').toJSON()
                const { meta, ...cleanProps } = newProps
                patches.push({
                  type: 'props-update',
                  path: event.path,
                  props: cleanProps,
                  meta
                })
              }
            } else if (key === 'methods') {
              // 根节点添加 事件函数
              if (change.action === 'add' || change.action === 'update') {
                const newMethods = yMapNode.get('methods')
                patches.push({
                  type: 'methods-add-root',
                  path: event.path,
                  methods: newMethods
                })
              }
            } else if (attributesKey.includes(key)) {
              if (key === 'condition' || key === 'loop' || key === 'loopArgs') {
                if (change.action === 'add' || change.action === 'update') {
                  const targetNodeId = yMapNode.get('id')
                  const value = yMapNode.get(key)
                  patches.push({
                    type: 'attributes-update',
                    role: key,
                    path: event.path,
                    value,
                    nodeId: targetNodeId
                  })
                } else if (change.action === 'delete' && (key === 'loop' || key === 'loopArgs')) {
                  const targetNodeId = yMapNode.get('id')
                  patches.push({
                    type: 'attributes-update',
                    role: 'clean',
                    path: event.path,
                    value: undefined,
                    nodeId: targetNodeId
                  })
                }
              }
            } else if (regex.test(key)) {
              // 先判断非根节点 添加时间函数
              if (change.action === 'add' || change.action === 'update') {
                const newObj = yMapNode.get(key)
                if (newObj['_methods_deleted']) {
                  patches.push({
                    type: 'methods-delete',
                    path: event.path,
                    nodeId: newObj.meta.nodeId,
                    methodsName: key
                  })
                } else {
                  const { meta, ...methods } = newObj
                  patches.push({
                    type: 'methods-add-node',
                    path: event.path,
                    methods,
                    methodsName: key,
                    nodeId: meta.nodeId
                  })
                }
              }
            }
          })
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
        case 'array-insert': {
          useCanvas().operateNode({
            type: 'insert',
            parentId: patch.parentId,
            newNodeData: patch.newNodeData,
            position: patch.position,
            referTargetNodeId: patch.referTargetNodeId
          })
          break
        }
        case 'array-delete': {
          useCanvas().operateNode({
            type: 'delete',
            id: patch.deletedId
          })
          break
        }
        case 'array-swap': {
          const parentNode = patch.parentId ? useCanvas().getNode(patch.parentId, false) : useCanvas().getPageSchema()
          const childrenArray: any[] = parentNode.children

          // 通过 Id 找到需要交换位置两个节点的索引
          const targetIndex = childrenArray.findIndex((node) => node.id === patch.schemaId)
          const swapIndex = childrenArray.findIndex((node) => node.id === patch.swapId)

          // 交换位置
          if (targetIndex > -1 && swapIndex < childrenArray.length) {
            ;[childrenArray[targetIndex], childrenArray[swapIndex]] = [
              childrenArray[swapIndex],
              childrenArray[targetIndex]
            ]
          }

          useMessage().publish({ topic: 'schemaChange', data: {} })
          break
        }
        case 'class-add': {
          const { nodeId, className } = patch
          const node = useCanvas().getNode(nodeId)
          node.props.className = className

          useMessage().publish({ topic: 'schemaChange', data: {} })
          break
        }
        case 'style-update': {
          const strStyle = patch.css

          useCanvas().updateSchema({ css: strStyle })
          break
        }
        case 'props-update': {
          const { props: newProps, meta } = patch
          const { nodeId, overwrite } = meta

          useCanvas().operateNode({
            type: 'changeProps',
            id: nodeId || '',
            value: { props: newProps },
            option: { overwrite }
          })
          break
        }
        case 'methods-add-root': {
          const { methods } = patch
          useCanvas().updateSchema({ methods: methods })
          break
        }
        case 'methods-add-node': {
          const { methods, methodsName, nodeId } = patch
          const targetNode = useCanvas().getNode(nodeId, false)

          targetNode.props[methodsName] = methods
          useMessage().publish({ topic: 'schemaChange', data: {} })
          break
        }
        case 'methods-delete': {
          const { nodeId, methodsName } = patch
          const targetNode = useCanvas().getNode(nodeId, false)

          const keys = Object.keys(targetNode.props)

          if (keys.indexOf(methodsName) > -1) {
            delete targetNode.props[methodsName]
          }
          useMessage().publish({ topic: 'schemaChange', data: { props: targetNode.props } })
          break
        }
        case 'attributes-update': {
          const { role, value, nodeId } = patch
          const targetNode = useCanvas().getNode(nodeId, false)

          if (role === 'condition') {
            if (!(value as boolean)) {
              useCanvas().operateNode({ type: 'updateAttributes', id: nodeId, value: { condition: value } })
            } else {
              const { condition: _schemaCondition, children, ...rest } = targetNode
              useCanvas().operateNode({ type: 'updateAttributes', id: nodeId, value: { ...rest }, overwrite: true })
            }
          } else if (role === 'loop') {
            useCanvas().operateNode({ type: 'updateAttributes', id: nodeId, value: { loop: value } })
          } else if (role === 'loopArgs') {
            useCanvas().operateNode({ type: 'updateAttributes', id: nodeId, value: { loopArgs: value } })
          } else if (role === 'clean') {
            const { loop: _loop, loopArgs: _loopArgs, children: _children, ...rest } = targetNode
            useCanvas().operateNode({ type: 'updateAttributes', id: nodeId, value: rest, overwrite: true })
          }
          break
        }
        default:
          break
      }
    }
  }
}
