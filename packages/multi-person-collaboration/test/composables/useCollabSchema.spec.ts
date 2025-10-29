// test/composables/useCollabSchema.spec.ts
import { onUnmounted } from 'vue'
import { describe, it, vi, beforeEach, expect } from 'vitest'
import { useCollabSchema } from '../../src/composables/useCollabSchema'
import { SchemaManager } from '../../src/services/schemaManager'
import { useYjs } from '../../src/composables/useYjs'
import { useAwareness } from '../../src/composables/useAwareness'
import { useCanvas } from '@opentiny/tiny-engine-meta-register'

// 全局 mock
vi.mock('../../src/composables/useYjs')
vi.mock('../../src/composables/useAwareness')
vi.mock('@opentiny/tiny-engine-meta-register')

// **mock 整个 SchemaManager 模块**
vi.mock('../../src/services/schemaManager', () => {
  const schemaModelMock = {
    insertNode: vi.fn(),
    deleteNode: vi.fn(),
    moveNode: vi.fn(),
    updatedNodeCss: vi.fn(),
    updatedNodeProps: vi.fn(),
    updatedNodeMethods: vi.fn(),
    updatedNodeAttributes: vi.fn(),
    operationHandler: { rebuildYNodeMap: vi.fn() }
  }

  const schemaManagerMock = {
    getInstance: vi.fn().mockReturnThis(),
    createSchema: vi.fn().mockReturnValue(schemaModelMock),
    destroyObserver: vi.fn()
  }

  return { SchemaManager: schemaManagerMock }
})

describe('useCollabSchema', () => {
  const mockCurrentUser = { id: 'user1', name: 'Bob', color: '#123456' }
  const roomId = 'room1'

  let providerMock: any
  let awarenessMock: any
  let updateLocalStateFieldMock: vi.Mock

  beforeEach(() => {
    vi.clearAllMocks()

    // 模拟 provider
    providerMock = { value: { on: vi.fn(), off: vi.fn() } }

    // 模拟 useYjs
    awarenessMock = { value: {} }
    updateLocalStateFieldMock = vi.fn()
    ;(useYjs as vi.Mock).mockReturnValue({
      provider: providerMock,
      awareness: awarenessMock
    })

    // 模拟 useAwareness
    ;(useAwareness as vi.Mock).mockReturnValue({
      remoteStates: {},
      updateLocalStateField: updateLocalStateFieldMock
    })

    // 模拟 useCanvas
    ;(useCanvas as vi.Mock).mockReturnValue({
      getPageSchema: vi.fn().mockReturnValue({ id: 'root', children: [] })
    })
  })

  it('应初始化并返回必要方法', () => {
    const composable = useCollabSchema({ roomId, currentUser: mockCurrentUser })
    expect(composable.insertSharedNode).toBeTypeOf('function')
    expect(composable.deleteSharedNode).toBeTypeOf('function')
    expect(composable.moveUpSharedNode).toBeTypeOf('function')
    expect(composable.moveDownSharedNode).toBeTypeOf('function')
    expect(composable.updateStyleNode).toBeTypeOf('function')
    expect(composable.updateUserSelection).toBeTypeOf('function')
    expect(composable.updateDragState).toBeTypeOf('function')

    const schemaManager = SchemaManager.getInstance()
    expect(schemaManager.createSchema).toHaveBeenCalledWith(roomId, providerMock.value)
  })

  it('应调用 schemaModel 对节点进行操作', () => {
    const { insertSharedNode, deleteSharedNode, moveUpSharedNode, moveDownSharedNode, updateStyleNode } =
      useCollabSchema({
        roomId,
        currentUser: mockCurrentUser
      })

    const schemaManager = SchemaManager.getInstance()
    const schemaModelMock = schemaManager.createSchema(roomId, providerMock.value)

    const node = { node: { id: 'n1' }, parent: { id: 'root' }, data: { id: 'n1' } }
    insertSharedNode(node)
    expect(schemaModelMock.insertNode).toHaveBeenCalledWith(node, 'in')

    deleteSharedNode('n1')
    expect(schemaModelMock.deleteNode).toHaveBeenCalledWith('n1')

    moveUpSharedNode('root', 'n1', 'up')
    expect(schemaModelMock.moveNode).toHaveBeenCalledWith('root', 'n1', 'up')

    moveDownSharedNode('root', 'n1', 'down')
    expect(schemaModelMock.moveNode).toHaveBeenCalledWith('root', 'n1', 'down')

    updateStyleNode('color:red', 'n1', 'classA')
    expect(schemaModelMock.updatedNodeCss).toHaveBeenCalledWith('color:red', 'n1', 'classA')
  })

  it('应调用 updateLocalStateField 更新用户状态', () => {
    const { updateUserSelection, updateDragState } = useCollabSchema({ roomId, currentUser: mockCurrentUser })

    const selection = { id: 'n1' }
    updateUserSelection(selection)
    expect(updateLocalStateFieldMock).toHaveBeenCalledWith('selection', selection)

    const dragState = { status: 'start', nodeId: 'n1' }
    updateDragState(dragState)
    expect(updateLocalStateFieldMock).toHaveBeenCalledWith('drag', dragState)
  })

  it('provider 同步事件应触发 rebuildYNodeMap', () => {
    useCollabSchema({ roomId, currentUser: mockCurrentUser })

    const schemaManager = SchemaManager.getInstance()
    const schemaModelMock = schemaManager.createSchema(roomId, providerMock.value)

    const syncCallback = providerMock.value.on.mock.calls[0][1]
    syncCallback(true)

    expect(schemaModelMock.operationHandler.rebuildYNodeMap).toHaveBeenCalledWith({ id: 'root', children: [] })
  })
})
