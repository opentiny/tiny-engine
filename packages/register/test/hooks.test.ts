import { describe, it, expect } from 'vitest'
import { initHook, useCanvas, useLayout, useCustom, HOOK_NAME, useModal } from '../src/hooks'

describe('hooks', () => {
  describe('initHook', () => {
    it('应该正确初始化hook', () => {
      // 初始化canvas hook
      const canvasApi = {
        getCanvas: () => ({ width: 800, height: 600 }),
        setCanvas: (dimensions) => dimensions
      }

      initHook(HOOK_NAME.useCanvas, canvasApi)

      // 验证hook是否被正确初始化
      const canvas = useCanvas()
      expect(canvas).toBeDefined()
      expect(typeof canvas.getCanvas).toBe('function')
      expect(typeof canvas.setCanvas).toBe('function')
      expect(canvas.getCanvas()).toEqual({ width: 800, height: 600 })
    })

    it('应该可以初始化带参数的hook', () => {
      // 初始化一个带参数的hook
      const layoutApi = {
        getLayout: (id) => ({ id, type: 'layout' }),
        setLayout: (id, layout) => ({ id, ...layout })
      }

      initHook(HOOK_NAME.useLayout, layoutApi)

      // 验证hook是否被正确初始化并且可以接收参数
      const layout = useLayout()
      expect(layout).toBeDefined()
      expect(typeof layout.getLayout).toBe('function')
      expect(typeof layout.setLayout).toBe('function')

      // 测试传递参数
      expect(layout.getLayout('main')).toEqual({ id: 'main', type: 'layout' })
    })

    it('应该支持useDefaultExport选项', () => {
      // 定义一个函数作为hook
      const customHookFn = (name, greeting) => `${greeting}, ${name}!`

      // 初始化hook并使用useDefaultExport选项
      // 当useDefaultExport为true时，整个hookContent会被直接赋值给hooksState[hookName]
      // 这样getHook会直接调用该函数
      initHook(HOOK_NAME.useCustom, customHookFn, { useDefaultExport: true })

      // 使用hook，此时应该直接调用customHookFn
      const result = useCustom('World', 'Hello')
      expect(result).toBe('Hello, World!')

      // 重置 useCustom
      initHook(HOOK_NAME.useCustom, {}, { useDefaultExport: true })
      const emptyUseCustom = useCustom()
      expect(emptyUseCustom).toMatchObject({})

      // 不使用useDefaultExport选项的比较
      const regularApi = { greet: (name) => `Hi, ${name}!` }
      initHook(HOOK_NAME.useCustom, regularApi) // 不使用useDefaultExport

      // 现在应该返回对象，而不是调用函数
      const obj = useCustom()
      expect(obj).toHaveProperty('greet')
      expect(obj.greet('Friend')).toBe('Hi, Friend!')
    })

    it('应该在提供无效hook名称时抛出错误', () => {
      // 提供一个无效的hook名称应该抛出错误
      expect(() => initHook('invalidHookName' as any, {})).toThrow('Invalid hook name provided: invalidHookName')
    })
  })

  describe('useHooks', () => {
    it('应该返回初始化的hook API', () => {
      // 初始化多个hook
      const customApi = {
        getMessage: () => 'Hello from custom hook'
      }

      const modalApi = {
        open: (content) => ({ isOpen: true, content }),
        close: () => ({ isOpen: false })
      }

      initHook(HOOK_NAME.useCustom, customApi)
      initHook(HOOK_NAME.useModal, modalApi)

      // 验证各个hook是否工作正常
      const custom = useCustom()
      const modal = useModal()

      expect(custom.getMessage()).toBe('Hello from custom hook')
      expect(modal.open('Test Content')).toEqual({ isOpen: true, content: 'Test Content' })
      expect(modal.close()).toEqual({ isOpen: false })
    })
  })
})
