<template>
  <tiny-checkbox class="block-select-all" :indeterminate="isIndeterminate" v-model="selectedAll">
    {{ hiddenLabel ? '' : '全选' }}
  </tiny-checkbox>
</template>

<script setup>
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

const selectedAll = computed({
  get() {
    return props.allItems.length > 0 && props.allItems.length === props.selected.length
  },
  set(value) {
    if (value) {
      emit('selectAll', props.allItems)
    } else {
      emit('selectAll', null)
    }
  }
})

const isIndeterminate = computed(() => props.selected.length > 0 && props.selected.length !== props.allItems.length)
</script>
