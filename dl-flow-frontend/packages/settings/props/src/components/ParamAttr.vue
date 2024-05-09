<template>
  <tiny-form label-position="top">
    <template v-for="attr of resState.types.ParamAttr" :key="attr.id">
      <tiny-form-item :label="attr.label.zh_CN">
        <t-input v-model="data[attr.id]" @input="onStringChange" v-if="attr.type === 'string'" />
        <t-numeric v-model="data[attr.id]" mouse-wheel :controls="false" :min="0" v-if="attr.type === 'number'" />
        <enums v-model="data[attr.id]" v-if="attr.type === 'enums'" :data="attr.enums" />
        <t-check-box v-model="data[attr.id]" v-if="attr.type === 'boolean'" />
        <t-numeric v-model="data[attr.id]" mouse-wheel :controls="false" :min="0" v-if="attr.type === 'Initializer'"  />
      </tiny-form-item>
    </template>
  </tiny-form>
</template>

<script setup>
import {
  Input as TInput,
  Checkbox as TCheckBox,
  Numeric as TNumeric,
  Form as TinyForm,
  FormItem as TinyFormItem
} from '@opentiny/vue'
import Enums from './enums.vue'
import { defineProps, reactive, defineEmits } from 'vue'
import { useResource } from '@opentiny/tiny-engine-controller'
const { resState } = useResource()
const props = defineProps({
  modelValue: Object
})
const emits = defineEmits(['update:modelValue'])
const data = reactive(props.modelValue)
const onStringChange = () => {
  emits('update:modelValue', data);
}
</script>
