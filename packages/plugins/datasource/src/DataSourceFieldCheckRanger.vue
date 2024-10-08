<!--录入数据的字符范围-->
<template>
  <div class="collection-field-num">
    <tiny-row gutter="0">
      <tiny-col :span="6">
        <div class="collection-field-item">
          <tiny-form-item
            prop="format.min"
            :label="type === 'string' ? '最少输入字符数（包含空格）' : '最小值'"
            label-width="300px"
          >
            <tiny-numeric v-model="formData.format.min" controls-position="right"></tiny-numeric>
          </tiny-form-item>
        </div>
      </tiny-col>
      <tiny-col :span="6">
        <div class="collection-field-item">
          <tiny-form-item
            prop="format.max"
            :label="type === 'string' ? '最多输入字符数（包含空格）' : '最大值'"
            label-width="300px"
          >
            <tiny-numeric v-model="formData.format.max" controls-position="right"></tiny-numeric>
          </tiny-form-item>
        </div>
      </tiny-col>
    </tiny-row>
  </div>
</template>

<script>
import { inject } from 'vue'
import { Numeric, FormItem, Row, Col } from '@opentiny/vue'
import { formDataInjectionSymbols } from './DataSourceFieldForm.vue'
export default {
  components: {
    TinyNumeric: Numeric,
    TinyFormItem: FormItem,
    TinyRow: Row,
    TinyCol: Col
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
  .field-item-tip {
    padding-left: 5px;
    color: var(--ti-lowcode-datasource-description-error-color);
    padding-right: 5px;
    padding-top: 5px;
    font-size: 12px;
  }
}
.collection-field-item:first-child {
  margin-right: 12px;
}
.collection-field-item-label {
  color: var(--ti-lowcode-datasource-dialog-font-color);
}
.collection-field-num {
  align-items: center;
  justify-content: space-between;
}
</style>
