import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import CompareDialog from '../../src/components/VersionDiffDialog.vue'
import { vi } from 'vitest'

// Mock useUtils
vi.mock('../composable/useUtils', () => ({
  useUtils: () => ({
    useVModel: (props, emit, propName) => ref(props[propName])
  })
}))

describe('CompareDialog.vue', () => {
  const compareDataMock = {
    base: { hash: 'abcdef123456', message: 'Initial commit', branches: ['main'] },
    target: { hash: '123456abcdef', message: 'Added feature', branches: ['dev'] },
    filesChanged: 3,
    additions: 10,
    deletions: 2,
    changedFiles: [
      { name: 'file1.txt', additions: 5, deletions: 0 },
      { name: 'file2.txt', additions: 3, deletions: 1 },
      { name: 'file3.txt', additions: 2, deletions: 1 }
    ]
  }

  let wrapper

  beforeEach(() => {
    wrapper = mount(CompareDialog, {
      props: {
        compareDialogVisible: true,
        compareData: compareDataMock
      }
    })
  })

  it('渲染对话框及版本信息', () => {
    expect(wrapper.text()).toContain('版本比较')
    expect(wrapper.text()).toContain('abcdef1 - Initial commit')
    expect(wrapper.text()).toContain('123456a - Added feature')
    expect(wrapper.text()).toContain('分支 - main')
    expect(wrapper.text()).toContain('分支 - dev')
  })

  it('显示文件变更统计', () => {
    expect(wrapper.text()).toContain('3') // filesChanged
    expect(wrapper.text()).toContain('+10') // additions
    expect(wrapper.text()).toContain('-2') // deletions
  })

  it('渲染变更文件列表', () => {
    const fileItems = wrapper.findAll('.file-diff-item')
    expect(fileItems.length).toBe(3)
    expect(fileItems[0].text()).toContain('file1.txt')
    expect(fileItems[0].text()).toContain('+5')
  })

  it('点击关闭按钮触发 closeCompareDialog', async () => {
    await wrapper.find('.close-btn').trigger('click')
    expect(wrapper.emitted('close-compare-dialog')).toBeTruthy()
  })

  it('点击遮罩触发 closeCompareDialog', async () => {
    await wrapper.find('.dialog-overlay').trigger('click')
    expect(wrapper.emitted('close-compare-dialog')).toBeTruthy()
  })

  it('点击对话框内容不会触发关闭', async () => {
    await wrapper.find('.dialog-content').trigger('click')
    // 不能触发关闭
    expect(wrapper.emitted('close-compare-dialog')).toBeFalsy()
  })
})
