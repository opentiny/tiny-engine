<template>
  <div class="block-add-filters">
    <div v-for="filter in filters" :key="filter.id" class="block-add-filters-item">
      <div class="block-filters-item-label">{{ filter.name }}</div>
      <div class="block-filters-item-value">
        <tiny-checkbox-group
          v-if="!filter.usingSelect"
          v-model="state.checkGroup[filter.id]"
          type="checkbox"
          @change="getFilters($event, filter.id, filter.children)"
        >
          <tiny-checkbox v-for="item in filter.children" :key="item.value" :label="item.name"></tiny-checkbox>
        </tiny-checkbox-group>
        <tiny-select
          v-else
          v-model="state.checkGroup[filter.id]"
          size="mini"
          multiple
          hover-expand
          @change="getFilters($event, filter.id)"
        >
          <tiny-option
            v-for="item in selectOptions[filter.id]"
            :key="item.name"
            :label="item.name"
            :value="item"
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
    const filters = {}
    const state = reactive({
      checkGroup: props.filters.reduce(
        (result, filter) => ({
          ...result,
          [filter.id]: []
        }),
        {}
      )
    })

    // 这里重新计算selectOptions的原因：tiny-option的value属性如果是一个对象，那么此对象内部需要有value属性
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

    const getFilters = (checked, id, child) => {
      filters[id] = []

      // tiny-checkbox-group的选中值是一个字符串数组
      if (typeof checked.at(0) === 'string') {
        child.forEach((item) => {
          if (checked.includes(item.name)) {
            filters[id].push(item.id)
          }
        })
      } else {
        filters[id] = checked.map((item) => item.value)
      }
      emit('search', null, filters)
    }

    return {
      state,
      selectOptions,
      getFilters
    }
  }
}
</script>

<style lang="less" scoped>
.block-add-filters {
  color: var(--ti-lowcode-materials-block-filter-text-color);
  & > div {
    height: 24px;
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
      color: var(--te-common-text-secondary);
      border-radius: 2px;
    }

    .block-filters-item-value {
      flex: 1;
      color: var(--te-common-text-primary);
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
      &:has(.tiny-select) {
        align-self: flex-start;
      }
      :deep(.tiny-select.tiny-select .tiny-select__tags .tiny-tag) {
        height: 20px;
        line-height: 20px;
        background-color: var(--te-common-bg-container);
      }
    }
  }
}
</style>
