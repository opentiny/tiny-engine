<template>
  <div class="right-item">
    <tiny-form label-position="top">
      <tiny-form-item prop="name" label="数据源类型">
        <tiny-radio-group v-model="dataSourceType">
          <div v-for="{ name, value } in RADIO_GROUP" :key="value">
            <tiny-radio :text="name" :label="value" :disabled="editable" />
          </div>
        </tiny-radio-group>
      </tiny-form-item>
    </tiny-form>
  </div>
</template>

<script>
import { watch, ref } from 'vue'
import { Form, FormItem, RadioGroup, Radio } from '@opentiny/vue'

export default {
  components: {
    TinyForm: Form,
    TinyFormItem: FormItem,
    TinyRadioGroup: RadioGroup,
    TinyRadio: Radio
  },
  props: {
    modelValue: {
      type: String,
      default: 'array'
    },
    editable: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const RADIO_GROUP = [
      {
        name: '对象数组',
        value: 'array'
      },
      {
        name: '树结构',
        value: 'tree'
      }
    ]

    const dataSourceType = ref(props.modelValue)

    watch(
      () => dataSourceType.value,
      (newVal) => {
        emit('update:modelValue', newVal)
      }
    )

    return {
      RADIO_GROUP,
      dataSourceType
    }
  }
}
</script>

<style lang="less" scoped>
.right-item {
  color: var(--ti-lowcode-datasource-toolbar-icon-color);
  display: flex;
  flex-direction: column;
  .title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    line-height: 22px;
    font-weight: normal;
    margin-bottom: 10px;
    color: var(--ti-lowcode-datasource-label-color);
  }

  .item-type {
    font-size: 12px;
    color: var(--ti-lowcode-datasource-input-icon-color);
    display: inline-flex;
    align-items: center;
    cursor: pointer;

    &.not-allowed {
      cursor: not-allowed;
    }

    &:not(:last-child) {
      margin-right: 24px;
    }

    &.is-checked {
      color: var(--ti-lowcode-datasource-toolbar-breadcrumb-color);
      .svg-icon {
        color: var(--ti-lowcode-datasource-common-border-primary-color);
      }
    }
    .svg-icon {
      font-size: 24px;
      color: var(--ti-lowcode-datasource-input-icon-color);
      margin-right: 8px;
    }
  }
}
</style>
