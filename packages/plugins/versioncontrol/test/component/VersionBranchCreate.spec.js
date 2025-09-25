import { mount } from '@vue/test-utils'
import { nextTick, ref, watch } from 'vue'
import VersionBranchCreate from '../../src/components/VersionBranchCreate.vue'
import { vi } from 'vitest'

vi.mock('../../src/js/index', () => {
  const mockBranches = [
    { id: 'b1', name: 'main' },
    { id: 'b2', name: 'dev' }
  ]

  const mockFindAll = vi.fn().mockResolvedValue(mockBranches)
  const mockCreateBranch = vi.fn().mockResolvedValue({ success: true })

  return {
    versionManager: {
      branchRepository: { findAll: mockFindAll },
      branchAppService: { createBranch: mockCreateBranch }
    }
  }
})

vi.mock('../../src/composable/useUtils', () => ({
  useUtils: () => ({
    useVModel: (props, emit, propName) => {
      const state = ref(props[propName])
      watch(state, (newVal) => emit(`update:${propName}`, newVal))
      watch(
        () => props[propName],
        (newVal) => (state.value = newVal)
      )
      return state
    }
  })
}))

async function flushPromises() {
  return new Promise(nextTick)
}

describe('VersionBranchCreate.vue', () => {
  let wrapper

  const createWrapper = (props = {}) =>
    mount(VersionBranchCreate, {
      props: { branchDialogVisible: true, ...props }
    })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('输入分支名称应该触发 v-model', async () => {
    wrapper = createWrapper()
    const input = wrapper.find('input.form-input')
    await input.setValue('feature/new-branch')

    expect(wrapper.emitted('update:newBranchName')).toBeTruthy()
    expect(wrapper.emitted('update:newBranchName')[0]).toEqual(['feature/new-branch'])
  })

  it('选择上游分支更新 upstreamBranchId', async () => {
    wrapper = createWrapper()
    await flushPromises()
    await nextTick()

    const select = wrapper.find('select#upstreamBranch')
    await select.setValue('b2')
    await nextTick()

    expect(wrapper.vm.upstreamBranchId).toBe('b2')
  })

  it('提交按钮状态随表单完整性变化', async () => {
    wrapper = createWrapper()
    const submit = wrapper.find('button.action-btn.primary')

    // 初始禁用
    expect(submit.attributes('disabled')).toBeDefined()

    // 输入名称
    await wrapper.find('input.form-input').setValue('feature/test')
    await nextTick()
    expect(submit.attributes('disabled')).toBeDefined() // 还没选上游

    // 选择上游
    await wrapper.find('select#upstreamBranch').setValue('b1')
    await nextTick()
    expect(submit.attributes('disabled')).toBeUndefined()
  })

  it('点击取消按钮触发 close-branch-dialog 事件', async () => {
    wrapper = createWrapper()
    await wrapper.find('button.action-btn.secondary').trigger('click')
    expect(wrapper.emitted('close-branch-dialog')).toBeTruthy()
  })

  it('点击提交按钮调用 versionManager.createBranch 并清空表单', async () => {
    const { versionManager } = await import('../../src/js/index')
    const createBranchMock = versionManager.branchAppService.createBranch

    wrapper = createWrapper()
    await flushPromises()
    await nextTick()

    // 填写表单
    await wrapper.find('input.form-input').setValue('feature/final-test')
    await wrapper.find('select#upstreamBranch').setValue('b1')
    await nextTick()

    const submit = wrapper.find('button.action-btn.primary')
    await submit.trigger('click')
    await flushPromises()
    await nextTick()

    // 检查 createBranch 是否被正确调用
    expect(createBranchMock).toHaveBeenCalledTimes(1)
    expect(createBranchMock).toHaveBeenCalledWith(
      'feature/final-test', // 分支名称
      'b1', // 上游分支 ID
      {
        id: 'user-123',
        username: 'dev_user',
        email: 'dev@example.com',
        avatar: 'https://avatars.githubusercontent.com/u/3?v=4'
      },
      undefined, // 第四个参数实际为 undefined
      undefined // 第五个参数实际为 undefined
    )

    // 提交后表单应清空
    expect(wrapper.find('input.form-input').element.value).toBe('')
    expect(wrapper.find('select#upstreamBranch').element.value).toBe('')
  })
})
