<template>
  <tiny-checkbox class="block-select-all" :indeterminate="isIndeterminate" v-model="selectedAll">
    {{ hiddenLabel ? '' : '全选' }}
  </tiny-checkbox>
</template>

<script setup lang="ts">
import { Checkbox as TinyCheckbox } from '@opentiny/vue'
import { computed, defineEmits, defineProps } from 'vue'

const props = defineProps({
  allItems: {
    type: Array,
    default: () => []
  },
  selected: {
    type: Array,
    default: () => []
  },
  hiddenLabel: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['selectAll'])

const filterList = computed(() => props.allItems.filter((item) => props.selected.some((i) => item.id === i.id)))

const selectNotSearchList = computed(() =>
  props.selected.filter((item) => !props.allItems.some((i) => item.id === i.id))
)

const selectedAll = computed({
  get() {
    return props.allItems.length > 0 && props.allItems.length === filterList.value.length
  },
  set(value) {
    if (value) {
      emit('selectAll', props.allItems.concat(selectNotSearchList.value))
    } else {
      if (selectNotSearchList.value.length) {
        emit('selectAll', selectNotSearchList.value)
        return
      }
      emit('selectAll', null)
    }
  }
})

const isIndeterminate = computed(() => filterList.value.length > 0 && filterList.value.length !== props.allItems.length)
</script>
