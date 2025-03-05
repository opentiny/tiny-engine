<template>
  <div class="footer-sort">
    <span class="sort-text">{{ state.selectedSort.text }}</span>
    <tiny-popover
      v-model="state.visible"
      trigger="manual"
      placement="top-start"
      width="200"
      popper-class="block-add-transfer-popover"
    >
      <template #reference>
        <span class="sort-caret" @click="state.visible = !state.visible">
          <icon-delta-down></icon-delta-down>
        </span>
      </template>
      <ul class="sort-list">
        <li
          v-for="(item, index) in sortList"
          :key="item.id"
          :class="['sort-item', { selected: state.selectedIndex === index }]"
          @click="sortClick(item, index)"
        >
          {{ item.text }}
        </li>
      </ul>
    </tiny-popover>
  </div>
</template>

<script>
import { reactive } from 'vue'
import { Popover } from '@opentiny/vue'
import { iconDeltaDown } from '@opentiny/vue-icon'

export default {
  components: {
    TinyPopover: Popover,
    IconDeltaDown: iconDeltaDown()
  },
  props: {
    modelValue: {
      type: Object,
      default: () => {}
    },
    sortList: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { emit }) {
    const state = reactive({
      selectedSort: props.modelValue,
      selectedIndex: 0,
      visible: false
    })

    const sortClick = (item, index) => {
      if (state.selectedIndex === index) {
        state.visible = !state.visible

        return
      }

      state.selectedIndex = typeof index !== 'undefined' ? index : -1
      state.selectedSort = item
      state.visible = !state.visible

      emit('update:modelValue', state.selectedSort)
    }

    return {
      state,
      sortClick
    }
  }
}
</script>

<style lang="less" scoped>
.sort-text {
  color: var(--te-materials-block-sort-text-color);
  margin-right: 6px;
}
.sort-caret {
  color: var(--te-materials-block-sort-text-color);
  cursor: pointer;
}

.footer-sort {
  min-width: 136px;
}
</style>
