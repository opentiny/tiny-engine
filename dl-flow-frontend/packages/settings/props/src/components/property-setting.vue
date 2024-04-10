<script setup>
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
import list from './list.vue'

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
          <t-input
            v-model="data[property.id].data"
            v-if="property.type === 'any'"
            :default-value="data[property.id].default" />
          <t-input
            v-model="data[property.id].data"
            v-if="property.type === 'string'"
            :default-value="data[property.id].default"
          />
          <t-numeric
            v-model="data[property.id].data"
            mouse-wheel
            :controls="false"
            :min="0"
            v-if="property.type === 'number'"
            :default-value="data[property.id].default"
          />
          <enums v-model="data[property.id].data" mouse-wheel :controls="false" :min="0" v-if="property.type === 'enums'" :data="property.enums" />
          <t-check-box v-model="data[property.id].data" :default-value="data[property.id].default" v-if="property.type === 'boolean'" />
          <param-attr v-model="data[property.id].data" v-if="property.type === 'ParamAttr'" />
          <list v-model="data[property.id].data" :default-value="data[property.id].default" :property="property" v-if="property.type === 'list'" />
        </t-form-item>
      </template>
    </t-form>
  </div>
</template>

<style scoped lang="less">
.property__wrapper {
  width: 100%;
}
:deep(.tiny-form-item__content) {
  margin: 0 !important;
}
</style>
