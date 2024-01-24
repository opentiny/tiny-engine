<script setup lang="jsx">
import {
  Form as TForm,
  FormItem as TFormItem,
  Input as TInput,
  Checkbox as TCheckBox,
  Numeric as TNumeric
} from '@opentiny/vue'
import { defineProps, defineEmits, computed, watch, ref } from 'vue'
import i18n from '@opentiny/tiny-engine-i18n-host'
import Enums from './enums.vue'
import ParamAttr from './ParamAttr.vue'

/**
 * @type {{modelValue: import('../../../../controller/src/useX6').MaterialInfo}}
 */
const props = defineProps({
  modelValue: Object,
  cellId: String
})
const emits = defineEmits(['update'])
const properties = computed(() => props.modelValue.properties)
const locale = i18n.global.locale
const components = {
  string: () => TInput,
  number: () => <TNumeric mouse-wheel controls={false} min={0} />,
  enums: () => Enums,
  boolean: () => TCheckBox,
  ParamAttr: () => ParamAttr
}
const data = ref(
  properties.value
    .map((p) => ({ [p.id]: p }))
    .reduce(
      (pre, cur) => ({
        ...pre,
        ...cur
      }),
      {}
    )
)
watch(
  data,
  () => {
    emits('update', { properties: properties.value, id: props.cellId })
  },
  { deep: true }
)
</script>
<template>
  <div class="property__wrapper">
    <t-form label-position="top">
      <template v-for="property of properties" :key="property.id">
        <t-form-item :label="property.label[locale]">
          <component
            :is="components[property.type]()"
            v-model="data[property.id].data"
            :data="property.enums"
            :property="property"
          />
        </t-form-item>
      </template>
    </t-form>
  </div>
</template>

<style scoped lang="less">
.property__wrapper {
  width: 100%;
}
</style>
