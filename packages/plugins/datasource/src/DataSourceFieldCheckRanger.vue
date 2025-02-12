<!--录入数据的字符范围-->
<template>
  <div class="collection-field-num">
    <div class="collection-field-item">
      <tiny-form-item
        prop="format.min"
        :label="type === 'string' ? '最少输入字符数（包含空格）' : '最小值'"
        label-width="300px"
      >
        <tiny-numeric v-model="formData.format.min" controls-position="right"></tiny-numeric>
      </tiny-form-item>
    </div>
    <div class="collection-field-item">
      <tiny-form-item
        prop="format.max"
        :label="type === 'string' ? '最多输入字符数（包含空格）' : '最大值'"
        label-width="300px"
      >
        <tiny-numeric v-model="formData.format.max" controls-position="right"></tiny-numeric>
      </tiny-form-item>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue'
import { Numeric, FormItem } from '@opentiny/vue'
import { formDataInjectionSymbols } from './DataSourceFieldForm.vue'
export default {
  components: {
    TinyNumeric: Numeric,
    TinyFormItem: FormItem
  },
  props: {
    type: {
      type: String,
      default: 'string'
    }
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
  width: 50%;
  .field-item-tip {
    padding-left: 5px;
    color: var(--te-datasource-description-text-color-error);
    padding-right: 5px;
    padding-top: 5px;
    font-size: 12px;
  }
}
.collection-field-item:first-child {
  margin-right: 12px;
}
.collection-field-item-label {
  color: var(--te-datasource-dialog-font-text-color);
}
.collection-field-num {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
