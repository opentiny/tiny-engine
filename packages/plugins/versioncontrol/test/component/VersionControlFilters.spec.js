import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import FiltersPanel from '../../src/components/VersionControlFilters.vue'
import { vi } from 'vitest'

vi.mock('../composable/useUtils', () => ({
  useUtils: () => ({
    useVModel: (props, emit, propName) => {
      const state = ref(props[propName])
      return state
    }
  })
}))

describe('FiltersPanel.vue', () => {
  const uniqueAuthorsMock = ['Alice', 'Bob', 'Charlie']

  let wrapper

  beforeEach(() => {
    wrapper = mount(FiltersPanel, {
      props: {
        authorFilter: '',
        timeFilter: '',
        uniqueAuthors: uniqueAuthorsMock,
        filteredCommitsLength: 10,
        uniqueAuthorsLength: 3
      }
    })
  })

  it('渲染作者和时间筛选', () => {
    const authorOptions = wrapper.findAll('select')[0].findAll('option')
    expect(authorOptions.length).toBe(uniqueAuthorsMock.length + 1) // +1 全部
    expect(authorOptions[1].text()).toBe('Alice')

    const timeOptions = wrapper.findAll('select')[1].findAll('option')
    expect(timeOptions.map((o) => o.text())).toEqual(['全部', '今天', '本周', '本月'])
  })

  it('选择作者触发 applyFilters', async () => {
    await wrapper.findAll('select')[0].setValue('Alice')
    expect(wrapper.emitted('update:authorFilter')[0][0]).toBe('Alice')
    expect(wrapper.emitted('applyFilters')).toBeTruthy()
  })

  it('选择时间触发 applyFilters', async () => {
    await wrapper.findAll('select')[1].setValue('today')
    expect(wrapper.emitted('update:timeFilter')[0][0]).toBe('today')
    expect(wrapper.emitted('applyFilters')).toBeTruthy()
  })

  it('点击清除筛选触发 clearFilters', async () => {
    await wrapper.find('.clear-filters-btn').trigger('click')
    expect(wrapper.emitted('clearFilters')).toBeTruthy()
  })

  it('点击提交Commit触发 createCommit', async () => {
    await wrapper.find('.commit-btn').trigger('click')
    expect(wrapper.emitted('createCommit')).toBeTruthy()
  })

  it('显示统计信息', () => {
    expect(wrapper.text()).toContain('共 10 个提交')
    expect(wrapper.text()).toContain('3 位贡献者')
  })
})
