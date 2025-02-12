<template>
  <data-source-field-check-multiple-line v-if="showMultiple"></data-source-field-check-multiple-line>

  <data-source-field-check-ranger v-if="showRanger" :type="type"></data-source-field-check-ranger>

  <tiny-form-item v-if="showTimeSelector" prop="format.dateTime">
    <div class="collection-field-item">
      <tiny-checkbox v-model="formData.format.dateTime" @change="change">是否包含时间选择器</tiny-checkbox>
    </div>
  </tiny-form-item>

  <tiny-form-item v-if="showRequire" prop="format.required">
    <div class="collection-field-item">
      <tiny-checkbox v-model="formData.format.required" @change="change">该字段是否必选</tiny-checkbox>
    </div>
  </tiny-form-item>
</template>

<script>
import { computed, inject } from 'vue'
import DataSourceFieldCheckMultipleLine from './DataSourceFieldCheckMultipleLine.vue'
import DataSourceFieldCheckRanger from './DataSourceFieldCheckRanger.vue'
import { formDataInjectionSymbols } from './DataSourceFieldForm.vue'
import { FormItem, Checkbox } from '@opentiny/vue'

export default {
  components: {
    DataSourceFieldCheckMultipleLine,
    DataSourceFieldCheckRanger,
    TinyCheckbox: Checkbox,
    TinyFormItem: FormItem
  },
  props: {
    type: {
      type: String,
      default: 'string'
    }
  },
  setup(props) {
    const formData = inject(formDataInjectionSymbols)

    /** 当前不同字段显示的配置规则， type取值：string、date、number、link、switch、slider
     *
     * string： 单行/多行、最大输入字符/最小输入字符、该字段是否必选
     * date: 是否包含时间选择器、该字段是否必选
     * number：最大值/最小值、格式化类型、是否容许负数、该字段是否必选
     * link: 该字段是否必选
     * switch、slider： 无
     */
    return {
      showTimeSelector: computed(() => props.type === 'date'),
      showRequire: computed(() => ['string', 'date', 'number', 'link'].indexOf(props.type) > -1),
      showMultiple: computed(() => props.type === 'string'),
      showRanger: computed(() => ['string', 'number'].indexOf(props.type) > -1),
      formData
    }
  }
}
</script>

<style scoped lang="less">
.collection-field-item {
  .tiny-checkbox {
    color: var(--te-datasource-dialog-font-text-color);
  }
}
</style>
