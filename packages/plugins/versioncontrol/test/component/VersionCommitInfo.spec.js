import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import CommitDetailDialog from '../../src/components/VersionCommitInfo.vue'
import { vi } from 'vitest'

vi.mock('../composable/useUtils', () => ({
  useUtils: () => ({
    useVModel: (props, emit, propName) => {
      const state = ref(props[propName])
      return state
    }
  })
}))

describe('CommitDetailDialog.vue', () => {
  const commitMock = {
    author: 'Alice',
    avatar: 'https://example.com/avatar.png',
    date: '2025-09-24T10:00:00Z',
    hash: 'abc123def',
    type: 'feature',
    message: '添加新功能',
    changedFiles: ['file1.js', 'file2.js'],
    tags: ['v1.0', 'beta'],
    branches: ['main', 'dev']
  }

  let wrapper

  beforeEach(() => {
    wrapper = mount(CommitDetailDialog, {
      props: {
        dialogVisible: true,
        selectedCommit: commitMock
      }
    })
  })

  it('渲染基本信息', async () => {
    await nextTick()
    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('添加新功能')
    expect(wrapper.text()).toContain('abc123def')
    expect(wrapper.findAll('.commit-type-badge')[0].text()).toContain('新功能')
  })

  it('渲染变更文件列表', () => {
    const files = wrapper.findAll('.files-list-detailed .file-item')
    expect(files.length).toBe(2)
    expect(files[0].text()).toContain('file1.js')
    expect(files[1].text()).toContain('file2.js')
  })

  it('渲染标签和分支', () => {
    const tags = wrapper.findAll('.label-item.tag')
    const branches = wrapper.findAll('.label-item.branch')
    expect(tags.map((t) => t.text())).toEqual(['v1.0', 'beta'])
    expect(branches.map((b) => b.text())).toEqual(['main', 'dev'])
  })

  it('点击按钮触发事件', async () => {
    await wrapper.find('button.action-btn.primary').trigger('click')
    expect(wrapper.emitted('compare-with-current')).toBeTruthy()

    await wrapper.findAll('button.action-btn')[1].trigger('click')
    expect(wrapper.emitted('create-branch-from-commit')).toBeTruthy()
    expect(wrapper.emitted('create-branch-from-commit')[0][0]).toEqual(commitMock)

    await wrapper.findAll('button.action-btn.danger')[0].trigger('click')
    expect(wrapper.emitted('revert-to-commit')).toBeTruthy()
    expect(wrapper.emitted('revert-to-commit')[0][0]).toEqual(commitMock)
  })

  it('点击关闭按钮触发 close-dialog', async () => {
    await wrapper.find('.close-btn').trigger('click')
    expect(wrapper.emitted('close-dialog')).toBeTruthy()
  })

  it('dialogVisible 控制显示', async () => {
    await wrapper.setProps({ dialogVisible: false })
    expect(wrapper.find('.dialog-overlay').exists()).toBe(false)
  })
})
