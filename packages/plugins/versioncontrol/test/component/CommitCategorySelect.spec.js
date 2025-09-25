import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, watch } from 'vue'
import CommitCategorySelect from '../../src/components/CommitCategorySelect.vue'

vi.mock('@/js/infrastructure/repositories', () => ({
  BranchRepository: vi.fn(),
  default: {}
}))

vi.mock('../composable/useUtils', () => {
  return {
    useUtils: () => ({
      useVModel: (props, emit) => {
        // 使用 ref + watch 避免多次触发
        const selectedOptions = ref(props.modelValue)
        watch(
          selectedOptions,
          (newVal) => {
            emit('update:modelValue', newVal)
          },
          { deep: true }
        )
        return selectedOptions
      }
    })
  }
})

describe('CommitCategorySelect.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CommitCategorySelect, {
      props: {
        modelValue: [],
        placeholder: '请选择...'
      }
    })
  })

  it('应该正确渲染初始状态，显示占位符', () => {
    expect(wrapper.find('.placeholder').text()).toBe('请选择...')
    expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
  })

  it('点击头部时应该能切换下拉菜单的显示状态', async () => {
    expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
    await wrapper.find('.select-header').trigger('click')
    expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
    expect(wrapper.find('.arrow').classes()).toContain('arrow-up')
    await wrapper.find('.select-header').trigger('click')
    expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
    expect(wrapper.find('.arrow').classes()).not.toContain('arrow-up')
  })

  it('在搜索框输入文本时，应该能正确过滤选项', async () => {
    await wrapper.find('.select-header').trigger('click')
    const searchInput = wrapper.find('.search-input')
    await searchInput.setValue('fix')
    const options = wrapper.findAll('.option-item')
    expect(options.length).toBe(1)
    expect(options[0].text()).toBe('修复Bug')
    await searchInput.setValue('')
    expect(wrapper.findAll('.option-item').length).toBe(wrapper.props('options').length)
  })

  it('当搜索没有结果时，应该显示 "无匹配项"', async () => {
    await wrapper.find('.select-header').trigger('click')
    await wrapper.find('.search-input').setValue('一个不存在的选项')
    expect(wrapper.find('.no-results').exists()).toBe(true)
    expect(wrapper.find('.no-results').text()).toBe('无匹配项')
    expect(wrapper.findAll('.option-item').length).toBe(0)
  })

  it('点击选项时，应该能选中该选项并发出 update:modelValue 事件', async () => {
    await wrapper.find('.select-header').trigger('click')
    await wrapper.findAll('.option-item')[0].trigger('click')

    const emitted = wrapper.emitted('update:modelValue')
    // 只关心最后一次事件值
    const lastValue = emitted[emitted.length - 1][0]
    expect(lastValue).toEqual([{ label: '新增功能', value: 'feature' }])

    await wrapper.setProps({ modelValue: lastValue })
    expect(wrapper.find('.placeholder').exists()).toBe(false)
    expect(wrapper.find('.selected-tag').text()).toContain('新增功能')

    // 取消选择
    await wrapper.findAll('.option-item')[0].trigger('click')
    const lastValueAfterRemove = wrapper.emitted('update:modelValue')
    const finalValue = lastValueAfterRemove[lastValueAfterRemove.length - 1][0]
    expect(finalValue).toEqual([])
  })

  it('点击已选标签上的 "×" 时，应该能移除该选项', async () => {
    await wrapper.setProps({
      modelValue: [
        { label: '新增功能', value: 'feature' },
        { label: '修复Bug', value: 'bugfix' }
      ]
    })
    expect(wrapper.findAll('.selected-tag').length).toBe(2)
    await wrapper.find('.remove-tag').trigger('click')

    const emitted = wrapper.emitted('update:modelValue')
    const lastValue = emitted[emitted.length - 1][0]
    expect(lastValue).toEqual([{ label: '修复Bug', value: 'bugfix' }])

    await wrapper.setProps({ modelValue: lastValue })
    expect(wrapper.findAll('.selected-tag').length).toBe(1)
    expect(wrapper.find('.selected-tag').text()).toContain('修复Bug')
  })

  it('当 modelValue prop 从外部改变时，组件内部状态应该同步更新', async () => {
    expect(wrapper.findAll('.selected-tag').length).toBe(0)
    const newSelection = [
      { label: '文档更新', value: 'docs' },
      { label: '样式调整', value: 'style' }
    ]
    await wrapper.setProps({ modelValue: newSelection })
    const tags = wrapper.findAll('.selected-tag')
    expect(tags.length).toBe(2)
    expect(tags[0].text()).toContain('文档更新')
    expect(tags[1].text()).toContain('样式调整')
  })
})
