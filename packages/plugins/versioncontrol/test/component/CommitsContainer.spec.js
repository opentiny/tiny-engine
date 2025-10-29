import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CommitsList from '../../src/components/CommitsContainer.vue'

describe('CommitsList.vue', () => {
  let wrapper

  // 简略模拟 commits
  const commitsMock = [
    {
      hash: 'abc1234',
      author: 'Alice',
      date: '2025-09-24T10:00:00Z',
      message: '新增功能 A',
      type: 'feat',
      avatar: 'avatar1.png',
      tags: ['v1.0.0'],
      branches: ['main'],
      filesChanged: ['file1.js', 'file2.js'],
      additions: 10,
      deletions: 2
    },
    {
      hash: 'def5678',
      author: 'Bob',
      date: '2025-09-23T10:00:00Z',
      message: '修复Bug B',
      type: 'fix',
      avatar: 'avatar2.png',
      tags: [],
      branches: [],
      filesChanged: ['file3.js'],
      additions: 2,
      deletions: 1
    }
  ]

  const defaultProps = {
    viewMode: 'list',
    sortBy: 'date-desc',
    paginatedCommits: commitsMock,
    selectedCommit: null,
    filteredCommitsLength: commitsMock.length,
    isLoading: false,
    hasMore: true,
    currentPage: 1,
    pageSize: 10
  }

  beforeEach(() => {
    wrapper = mount(CommitsList, {
      props: defaultProps
    })
  })

  it('渲染提交列表项', () => {
    const items = wrapper.findAll('.commit-item')
    expect(items.length).toBe(2)
    expect(items[0].text()).toContain('Alice')
    expect(items[1].text()).toContain('Bob')
  })

  it('切换视图模式', async () => {
    await wrapper.setProps({ viewMode: 'detailed' })
    expect(wrapper.find('.commits-list').classes()).toContain('detailed')
  })

  it('点击提交项触发 selectCommit', async () => {
    await wrapper.findAll('.commit-item')[0].trigger('click')
    const events = wrapper.emitted('selectCommit')
    expect(events).toHaveLength(1)
    expect(events[0][0].author).toBe('Alice')
  })

  it('查看提交详情触发 showCommitDetails', async () => {
    await wrapper.find('.commit-item .action-btn[title="查看详情"]').trigger('click')
    const events = wrapper.emitted('showCommitDetails')
    expect(events).toHaveLength(1)
    expect(events[0][0].author).toBe('Alice')
  })

  it('比较差异触发 compareCommit', async () => {
    await wrapper.find('.commit-item .action-btn[title="比较差异"]').trigger('click')
    const events = wrapper.emitted('compareCommit')
    expect(events).toHaveLength(1)
    expect(events[0][0].author).toBe('Alice')
  })

  it('回滚操作触发 revertToCommit', async () => {
    await wrapper.find('.commit-item .action-btn[title="回滚"]').trigger('click')
    const events = wrapper.emitted('revertToCommit')
    expect(events).toHaveLength(1)
    expect(events[0][0].author).toBe('Alice')
  })

  it('排序选择触发 applySorting', async () => {
    await wrapper.find('.sort-select').setValue('author')
    const events = wrapper.emitted('update:sortBy')
    expect(events[0][0]).toBe('author')
  })

  it('分页加载触发 loadMore', async () => {
    await wrapper.find('.load-more-btn').trigger('click')
    const events = wrapper.emitted('loadMore')
    expect(events).toHaveLength(1)
  })

  it('空状态渲染', async () => {
    await wrapper.setProps({ filteredCommitsLength: 0 })
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    await wrapper.find('.clear-btn').trigger('click')
    const events = wrapper.emitted('clearFilters')
    expect(events).toHaveLength(1)
  })
})
