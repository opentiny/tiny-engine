<template>
  <div class="block-add-filters">
    <div v-for="filter in filters" :key="filter.id" class="block-add-filters-item">
      <div class="block-filters-item-label">{{ filter.name }}</div>
      <div class="block-filters-item-value">
        <tiny-checkbox-group
          v-if="!filter.usingSelect"
          v-model="state.filterValues[filter.id]"
          type="checkbox"
          @change="handleValueChange"
        >
          <tiny-checkbox
            v-for="item in selectOptions[filter.id]"
            :key="item.value"
            :text="item.name"
            :label="item.value"
          ></tiny-checkbox>
        </tiny-checkbox-group>
        <tiny-select
          v-else
          v-model="state.filterValues[filter.id]"
          size="mini"
          multiple
          is-drop-inherit-width
          @change="handleValueChange"
        >
          <tiny-option
            v-for="item in selectOptions[filter.id]"
            :key="item.value"
            :label="item.name"
            :value="item.value"
          ></tiny-option>
        </tiny-select>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, reactive } from 'vue'
import { CheckboxGroup, Checkbox, Select, Option } from '@opentiny/vue'

export default {
  components: {
    TinyCheckboxGroup: CheckboxGroup,
    TinyCheckbox: Checkbox,
    TinySelect: Select,
    TinyOption: Option
  },
  props: {
    filters: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { emit }) {
    const initFilterValues = () => {
      return props.filters.reduce(
        (result, filter) => ({
          ...result,
          [filter.id]: []
        }),
        {}
      )
    }

    const state = reactive({
      // filterValues 是一个对象。key 为 filter id，value 为选中的值，是一个数组
      filterValues: initFilterValues()
    })

    // 不同的filter，值所在的字段可能是id或者name。这里把实际的值都映射到value字段
    const selectOptions = computed(() => {
      return props.filters.reduce(
        (result, filter) => ({
          ...result,
          [filter.id]: filter.children.map((item) => ({
            ...item,
            value: item.id || item.name
          }))
        }),
        {}
      )
    })

    const handleValueChange = () => {
      emit('search', state.filterValues)
    }

    return {
      state,
      selectOptions,
      handleValueChange
    }
  }
}
</script>

<style lang="less" scoped>
.block-add-filters {
  color: var(--te-materials-block-filter-text-color);
  & > div {
    min-height: 24px;
  }
  & > div + div {
    margin-top: 12px;
  }

  .block-add-filters-item {
    display: flex;
    justify-content: start;
    align-items: center;
    margin-bottom: 2px;

    .block-filters-item-label {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 76px;
      color: var(--te-materials-block-filter-text-color);
      border-radius: 2px;
    }

    .block-filters-item-value {
      flex: 1;
      color: var(--te-materials-block-filter-value-text-color);
      .block-filters-value-item {
        cursor: pointer;
        display: inline-block;
        padding: 2px 5px;
        border-radius: 6px;
        border: 1px solid transparent;
        margin-right: 5px;
        margin-bottom: 5px;
        &.is-empty {
          display: none;
        }
      }
      :deep(.tiny-select.tiny-select .tiny-select__tags) {
        max-width: calc(100% - 24px) !important;
        .tiny-tag {
          background-color: var(--te-materials-block-filter-tag-bg-color);
        }
      }
    }
  }
}
</style>
