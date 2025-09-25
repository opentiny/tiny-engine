// tests/components/TagDialog.spec.js
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import TagDialog from '../../src/components/VersionTagCreate.vue'
import { vi } from 'vitest'

// Mock useUtils 和 versionManager
vi.mock('../composable/useUtils', () => ({
  useUtils: () => ({
    useVModel: (props, emit, propName) => ref(props[propName] || '')
  })
}))

vi.mock('../../src/js', () => ({
  versionManager: {
    commitAppService: {
      addTagToCommit: vi.fn().mockResolvedValue()
    },
    commitRepository: {
      findAll: vi.fn().mockResolvedValue([
        { id: 'c1', hash: 'abcdef1', message: 'Initial commit', timestamp: Date.now() },
        { id: 'c2', hash: 'abcdef2', message: 'Second commit', timestamp: Date.now() }
      ])
    }
  }
}))

describe('TagDialog.vue', () => {
  const commitsMock = [
    { id: 'c1', hash: 'abcdef1', message: 'Initial commit' },
    { id: 'c2', hash: 'abcdef2', message: 'Second commit' }
  ]

  let wrapper

  beforeEach(() => {
    wrapper = mount(TagDialog, {
      props: {
        tagDialogVisible: true,
        tagTargetCommit: '',
        commits: commitsMock
      }
    })
  })

  it('渲染对话框及表单元素', () => {
    expect(wrapper.text()).toContain('创建标签')
    expect(wrapper.find('input.form-input').exists()).toBe(true)
    expect(wrapper.find('textarea.form-textarea').exists()).toBe(true)
    expect(wrapper.find('select.form-select').exists()).toBe(true)
    expect(wrapper.findAll('option').length).toBe(commitsMock.length + 1) // 默认 option + commits
  })

  it('关闭对话框触发事件', async () => {
    await wrapper.find('button.close-btn').trigger('click')
    expect(wrapper.emitted('close-tag-dialog')).toBeTruthy()
  })

  it('输入标签名称更新 v-model', async () => {
    const input = wrapper.find('input.form-input')
    await input.setValue('v1.0.0')
    expect(input.element.value).toBe('v1.0.0')
  })

  it('选择目标提交更新 v-model', async () => {
    const select = wrapper.find('select.form-select')
    await select.setValue('c2')
    expect(select.element.value).toBe('c2')
  })

  it('点击创建标签触发 handleSubmit', async () => {
    const input = wrapper.find('input.form-input')
    await input.setValue('v1.0.0')

    const button = wrapper.find('button.action-btn.primary')
    await button.trigger('click')

    // 确认 versionManager.commitAppService.addTagToCommit 被调用
    const { versionManager } = await import('../../src/js')
    expect(versionManager.commitAppService.addTagToCommit).toHaveBeenCalledWith('', 'v1.0.0')

    // 对话框关闭事件触发
    expect(wrapper.emitted('close-tag-dialog')).toBeTruthy()
  })
})
