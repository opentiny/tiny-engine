<template>
  <div class="commit-feature-select">
    <div class="select-header" @click="toggleDropdown">
      <span v-if="selectedOptions.length === 0" class="placeholder">{{ placeholder }}</span>
      <div v-else class="selected-tags">
        <span v-for="option in selectedOptions" :key="option.value" class="selected-tag">
          {{ option.label }}
          <span class="remove-tag" @click.stop="removeOption(option)">&times;</span>
        </span>
      </div>
      <span class="arrow" :class="{ 'arrow-up': isDropdownOpen }"></span>
    </div>

    <div class="dropdown-menu" v-if="isDropdownOpen">
      <div class="search-box">
        <input type="text" v-model="searchText" placeholder="搜索功能..." class="search-input" />
      </div>
      <ul class="options-list">
        <li
          v-for="option in filteredOptions"
          :key="option.value"
          class="option-item"
          :class="{ 'is-selected': isSelected(option) }"
          @click="toggleOption(option)"
        >
          {{ option.label }}
        </li>
        <li v-if="filteredOptions.length === 0" class="no-results">无匹配项</li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useUtils } from '../composable/useUtils'

export default {
  name: 'CommitFeatureSelect',
  props: {
    modelValue: {
      type: Array,
      default: () => []
    },
    options: {
      type: Array,
      default: () => [
        { label: '新增功能', value: 'feature' },
        { label: '修复Bug', value: 'bugfix' },
        { label: '文档更新', value: 'docs' },
        { label: '样式调整', value: 'style' },
        { label: '代码重构', value: 'refactor' },
        { label: '性能优化', value: 'perf' },
        { label: '测试相关', value: 'test' },
        { label: '构建相关', value: 'build' },
        { label: '版本发布', value: 'release' },
        { label: '其他', value: 'chore' },
        { label: '合并', value: 'merge' }
      ]
    },
    placeholder: {
      type: String,
      default: '请选择 Commit Feature'
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { useVModel } = useUtils()
    const isDropdownOpen = ref(false)
    const searchText = ref('')
    const selectedOptions = useVModel(props, emit, 'modelValue')

    const toggleDropdown = () => {
      isDropdownOpen.value = !isDropdownOpen.value
    }

    const filteredOptions = computed(() => {
      if (!searchText.value) {
        return props.options
      }
      const lowerSearchText = searchText.value.toLowerCase()
      return props.options.filter(
        (option) =>
          option.label.toLowerCase().includes(lowerSearchText) || option.value.toLowerCase().includes(lowerSearchText)
      )
    })

    const isSelected = (option) => {
      return selectedOptions.value.some((item) => item.value === option.value)
    }

    const toggleOption = (option) => {
      if (isSelected(option)) {
        selectedOptions.value = selectedOptions.value.filter((item) => item.value !== option.value)
      } else {
        selectedOptions.value = [...selectedOptions.value, option]
      }
    }

    const removeOption = (optionToRemove) => {
      selectedOptions.value = selectedOptions.value.filter((item) => item.value !== optionToRemove.value)
    }

    // 同步外部 modelValue 的变化
    watch(
      () => props.modelValue,
      (newValue) => {
        selectedOptions.value = newValue
      },
      { deep: true }
    )

    return {
      isDropdownOpen,
      searchText,
      selectedOptions,
      filteredOptions,
      toggleDropdown,
      isSelected,
      toggleOption,
      removeOption
    }
  }
}
</script>

<style scoped>
.commit-feature-select {
  position: relative;
  width: 100%;
  font-family: 'Arial', sans-serif;
  font-size: 14px;
}

.select-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  background-color: #fff;
  min-height: 36px; /* Ensure consistent height */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.select-header:hover {
  border-color: #409eff;
}

.select-header .placeholder {
  color: #c0c4cc;
  flex-grow: 1;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  flex-grow: 1;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  background-color: #ecf5ff;
  color: #409eff;
  border: 1px solid #d9ecff;
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 12px;
}

.remove-tag {
  margin-left: 5px;
  cursor: pointer;
  font-weight: bold;
  color: #409eff;
}

.remove-tag:hover {
  color: #2b85e4;
}

.arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #909399;
  transition: transform 0.3s;
}

.arrow-up {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 999;
  margin-top: 5px;
  max-height: 250px;
  overflow-y: auto;
}

.search-box {
  padding: 8px;
  border-bottom: 1px solid #ebeef5;
}

.search-input {
  width: calc(100% - 16px);
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  outline: none;
  font-size: 14px;
}

.options-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.option-item {
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.option-item:hover {
  background-color: #f5f7fa;
}

.option-item.is-selected {
  background-color: #e6f7ff;
  color: #1890ff;
  font-weight: bold;
}

.no-results {
  padding: 10px 12px;
  color: #909399;
  text-align: center;
}
</style>
