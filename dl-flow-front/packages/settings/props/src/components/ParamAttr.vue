<template>
  <tiny-form label-position="top">
    <template v-for="attr of resState.types.ParamAttr" :key="attr.id">
      <tiny-form-item :label="attr.label.zh_CN">
        <component v-model="data[attr.id]" :is="components[attr.type]()" :data="attr.enums" />
      </tiny-form-item>
    </template>
  </tiny-form>
</template>

<script setup lang="jsx">
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
const components = {
  string: () => <TInput onInput={() => emits('update:modelValue', data)} />,
  number: () => <TNumeric mouse-wheel controls={false} min={0} />,
  enums: () => Enums,
  boolean: () => TCheckBox,
  Initializer: () => <TNumeric mouse-wheel controls={false} min={0} />
}
</script>
