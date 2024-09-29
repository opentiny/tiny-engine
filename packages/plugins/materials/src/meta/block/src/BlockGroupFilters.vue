<template>
  <div class="block-add-filters">
    <div v-for="filter in filters" :key="filter.id" class="block-add-filters-item">
      <div class="block-filters-item-label">{{ filter.name }}</div>
      <div class="block-filters-item-value">
        <tiny-checkbox-group
          v-model="state.checkGroup"
          type="checkbox"
          @change="getFilters(filter.id, filter.children)"
        >
          <tiny-checkbox v-for="item in filter.children" :key="item.name" :label="item.name"></tiny-checkbox>
        </tiny-checkbox-group>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive } from 'vue'
import { CheckboxGroup, Checkbox } from '@opentiny/vue'

export default {
  components: {
    TinyCheckboxGroup: CheckboxGroup,
    TinyCheckbox: Checkbox
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
      checkGroup: []
    })

    const getFilters = (id, child) => {
      filters[id] = []
      if (id === 'tag') {
        filters[id] = state.checkGroup
      } else {
        child.forEach((item) => {
          if (state.checkGroup.includes(item.name)) {
            filters[id].push(item.id)
          }
        })
      }
      emit('search', null, filters)
    }

    return {
      state,
      getFilters
    }
  }
}
</script>

<style lang="less" scoped>
.block-add-filters {
  color: var(--ti-lowcode-materials-block-filter-text-color);

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
      height: 28px;
      color: var(--te-common-text-secondary);
      border-radius: 2px;
    }

    .block-filters-item-value {
      align-items: center;
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
    }
  }
}
</style>
