import { mount } from '@vue/test-utils'
import Timeline from '../../src/components/TimelineContainer.vue'

describe('Timeline.vue', () => {
  let wrapper
  const mockCommits = [
    { hash: 'abc123', date: '2025-09-24T08:00:00', message: 'Initial commit', type: 'feature', tags: [] },
    { hash: 'def456', date: '2025-09-24T09:00:00', message: 'Add new feature', type: 'merge', tags: ['v1.0'] },
    { hash: 'ghi789', date: '2025-09-24T10:00:00', message: 'Fix bug', type: 'bugfix', tags: [] }
  ]

  beforeEach(() => {
    wrapper = mount(Timeline, {
      props: {
        timelineView: 'compact',
        filteredCommits: mockCommits,
        selectedCommit: null
      }
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('渲染所有提交条目', () => {
    const items = wrapper.findAll('.timeline-item')
    expect(items.length).toBe(mockCommits.length)
    expect(items[0].text()).toContain('abc123'.slice(0, 7))
    expect(items[1].text()).toContain('def456'.slice(0, 7))
  })

  it('切换时间线视图', async () => {
    const compactBtn = wrapper.find('button.view-toggle:first-child')
    const detailedBtn = wrapper.find('button.view-toggle:last-child')

    await compactBtn.trigger('click')
    expect(wrapper.emitted('update:timelineView')[0]).toEqual(['compact'])

    await detailedBtn.trigger('click')
    expect(wrapper.emitted('update:timelineView')[1]).toEqual(['detailed'])
  })

  it('点击提交条目时触发选择事件', async () => {
    const firstItem = wrapper.findAll('.timeline-item')[0]
    await firstItem.trigger('click')

    expect(wrapper.emitted('selectCommit')[0]).toEqual([mockCommits[0]])
  })

  it('正确渲染提交类型样式', () => {
    const dots = wrapper.findAll('.timeline-dot')
    expect(dots[0].classes()).toContain('feature-commit')
    expect(dots[1].classes()).toContain('merge-commit')
    expect(dots[2].classes()).toContain('bugfix-commit')
  })

  it('正确显示提交标签', () => {
    const tags = wrapper.findAll('.tag-mini')
    expect(tags.length).toBe(1)
    expect(tags[0].text()).toBe('v1.0')
  })
})
