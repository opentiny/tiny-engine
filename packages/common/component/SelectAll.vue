<template>
  <tiny-checkbox class="block-select-all" :indeterminate="isIndeterminate" v-model="selectedAll">
    {{ hiddenLabel ? '' : '全选' }}
  </tiny-checkbox>
</template>

<script setup lang="ts">
import { Checkbox as TinyCheckbox } from '@opentiny/vue'
import { computed, defineEmits, defineProps } from 'vue'

const props = defineProps({
  items: {
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

const emit = defineEmits(['selectAll', 'deselectAll'])

const selectedAll = computed({
  get() {
    return props.items.length > 0 && props.items.length === props.selected.length
  },
  set(value) {
    if (value) {
      emit('selectAll', props.items)
    } else {
      emit('deselectAll')
    }
  }
})

const isIndeterminate = computed(() => props.selected.length > 0 && props.selected.length !== props.items.length)
</script>
