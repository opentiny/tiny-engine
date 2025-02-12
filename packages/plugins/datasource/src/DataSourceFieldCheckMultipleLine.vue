<template>
  <tiny-form-item v-if="showTimeSelector" prop="format.text" label="是否包含时间选择器">
    <div class="collection-field-item">
      <tiny-radio v-model="formData.format.text" label="text">单行文本（针对简短文本）</tiny-radio>
    </div>
    <div class="collection-field-item">
      <tiny-radio v-model="formData.format.text" label="textarea">多行文本（针对长文本）</tiny-radio>
    </div>
  </tiny-form-item>
</template>

<script>
import { inject } from 'vue'
import { Radio, FormItem } from '@opentiny/vue'
import { formDataInjectionSymbols } from './DataSourceFieldForm.vue'

export default {
  components: {
    TinyRadio: Radio,
    TinyFormItem: FormItem
  },
  setup() {
    const formData = inject(formDataInjectionSymbols)

    return {
      formData
    }
  }
}
</script>

<style lang="less" scoped>
.collection-field-item {
  .tiny-radio {
    color: var(--te-datasource-dialog-font-text-color);
  }
}
</style>
