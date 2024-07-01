<template>
  <div class="block-add-filters">
    <div v-for="filter in filters" :key="filter.id" class="block-add-filters-item">
      <div class="block-filters-item-label">{{ filter.name }}</div>
      <div class="block-filters-item-value">
        <div
          v-for="item in filter.children"
          :key="item.name"
          :class="['block-filters-value-item', { selected: item.selected, 'is-empty': !item.name }]"
          @click="getFilters(filter.id, item, filter.children)"
        >
          {{ item.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    filters: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { emit }) {
    const filters = {}

    const getFilters = (id, item, filtersList) => {
      filters[id] = filters[id] || []
      const value = item.id || item.name
      if (id === 'publicType') {
        filters[id] = []
        filtersList.map((e) => {
          if (e.id === item.id) {
            e.selected = !e.selected
          } else {
            e.selected = false
          }
          return e
        })
      } else {
        item.selected = !item.selected
      }

      if (item.selected && !filters[id].includes(value)) {
        filters[id].push(value)
      }

      if (!item.selected && filters[id].includes(value)) {
        filters[id] = filters[id].filter((i) => i !== value)
      }
      emit('search', null, filters)
    }

    return {
      getFilters
    }
  }
}
</script>

<style lang="less" scoped>
.block-add-filters {
  padding: 0 12px 12px;
  color: var(--ti-lowcode-materials-block-filter-text-color);

  .block-add-filters-item {
    display: flex;
    justify-content: start;
    align-items: flex-start;
    margin-top: 8px;

    .block-filters-item-label {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      width: 76px;
      height: 28px;
      color: var(--ti-lowcode-common-primary-text-color);
      border-radius: 2px;
    }

    .block-filters-item-value {
      align-items: center;
      flex: 1;
      margin-left: 12px;
      padding-top: 5px;
      .block-filters-value-item {
        cursor: pointer;
        display: inline-block;
        padding: 2px 5px;
        border-radius: 6px;
        border: 1px solid transparent;
        margin-right: 5px;
        margin-bottom: 5px;
        &:hover {
          color: var(--ti-lowcode-materials-block-filter-hover-color);
          border-color: var(--ti-lowcode-materials-block-filter-selected-text-color);
        }
        &.selected {
          color: var(--ti-lowcode-materials-block-filter-selected-text-color);
          border-color: var(--ti-lowcode-materials-block-filter-selected-text-color);
        }
        &.is-empty {
          display: none;
        }
      }
    }
  }
}
</style>
