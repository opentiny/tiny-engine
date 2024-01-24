<template>
  <t-select v-model="selectValue">
    <template v-for="option of props.data" :key="option.id">
      <t-option :value="option.value" :label="option.label" />
    </template>
  </t-select>
</template>

<script setup>
import { defineEmits, defineProps, ref, watch } from 'vue'
import { Select as TSelect, Option as TOption } from '@opentiny/vue'
const props = defineProps({
  data: Array,
  modelValue: String
})
const emits = defineEmits(['update:modelValue'])
const selectValue = ref(props.data.filter((v) => v.default)[0].value)
watch(selectValue, () => {
  emits('update:modelValue', selectValue.value)
})
</script>
