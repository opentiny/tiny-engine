<script setup>
import { Form as TForm, FormItem as TFormItem, Input as TInput, Checkbox as TCheckBox } from '@opentiny/vue'
import { defineProps, computed } from 'vue'
import i18n from '@opentiny/tiny-engine-i18n-host'
import Enums from './enums.vue'
import ParamAttr from './ParamAttr.vue'
/**
 * @type {{modelValue: import('../../../../controller/src/useX6').MaterialInfo}}
 */
const props = defineProps({
  modelValue: Object
})
// const emits = defineEmits(['update:modelValue'])
const properties = computed(() => props.modelValue.properties)
const locale = i18n.global.locale
const components = {
  string: () => TInput,
  number: () => TInput,
  enums: () => Enums,
  boolean: () => TCheckBox,
  ParamAttr: () => ParamAttr
}
</script>
<template>
  <div class="property__wrapper">
    <t-form>
      <template v-for="property of properties" :key="property.id">
        <t-form-item :label="property.label[locale]">
          <component :is="components[property.type]()" v-model="property.data" :data="property.enums" />
        </t-form-item>
      </template>
    </t-form>
    <!-- {{properties}} -->
  </div>
</template>

<style scoped lang="less">
.property__wrapper {
  width: 100%;
}
</style>
