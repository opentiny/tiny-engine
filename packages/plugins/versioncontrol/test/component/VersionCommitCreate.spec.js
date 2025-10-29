// test/component/VersionCommitCreate.spec.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import VersionCommitCreate from '../../src/components/VersionCommitCreate.vue'

// Mock versionManager
vi.mock('../../src/js', () => ({
  versionManager: {
    branchRepository: {
      findAll: vi.fn().mockResolvedValue([
        { id: 'b1', name: 'branch-1' },
        { id: 'b2', name: 'branch-2' }
      ])
    },
    commitAppService: {
      createCommit: vi.fn().mockResolvedValue(true)
    },
    commitRepository: {
      findAll: vi.fn().mockResolvedValue([])
    }
  }
}))

// Mock useCanvas
vi.mock('@opentiny/tiny-engine-meta-register', () => ({
  useCanvas: () => ({
    exportSchema: vi.fn().mockReturnValue({ key: 'value' }),
    pageState: { pageSchema: { key: 'value' } }
  })
}))

// Mock utils
vi.mock('@opentiny/tiny-engine-utils', () => ({
  utils: {
    reactiveObj2String: (obj) => JSON.stringify(obj),
    string2Obj: (str) => (typeof str === 'string' ? JSON.parse(str) : str)
  }
}))

describe('CommitDialog.vue', () => {
  let wrapper

  const createWrapper = () =>
    mount(VersionCommitCreate, {
      props: {
        commitDialogVisible: true,
        availableBranches: [],
        commits: []
      }
    })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('点击取消按钮关闭弹窗', async () => {
    wrapper = createWrapper()
    await flushPromises()

    await wrapper.find('button.cancel-button').trigger('click')

    // commitDialogVisible 应该被置为 false
    expect(wrapper.emitted('close-commit-dialog')).toBeTruthy()
  })
})
