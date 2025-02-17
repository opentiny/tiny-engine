<template>
  <div class="container">
    <div class="container-title">{{ label }}</div>
    <div>
      <tiny-radio-group v-model="state.type" vertical @change="change">
        <div v-for="(item, index) in meta.type" :key="item" class="property-container">
          <div class="item-label">
            <tiny-radio :label="item">
              {{ TYPE_MAP[item] || item }}
            </tiny-radio>
          </div>
          <slot name="prefix"></slot>
          <div class="component-wrap">
            <component
              :is="getConfigurator(meta.widget.component?.[index])"
              v-bind="meta.widget.props"
              v-model="state.typesValue[index].modelValue"
              :meta="meta"
              @update:modelValue="handleChange(index, $event)"
            ></component>
          </div>
          <slot name="suffix"></slot>
        </div>
      </tiny-radio-group>
    </div>
  </div>
</template>

<script>
import { reactive } from 'vue'
import { Tooltip, Popover, Radio, RadioGroup } from '@opentiny/vue'
import { getConfigurator } from '@opentiny/tiny-engine-meta-register'

export default {
  name: 'MultiTypeSelector',
  components: {
    TinyTooltip: Tooltip,
    TinyPopover: Popover,
    TinyRadio: Radio,
    TinyRadioGroup: RadioGroup
  },
  inheritAttrs: false,
  props: {
    meta: {
      type: Object,
      default: () => ({})
    },
    label: {
      type: String,
      default: ''
    }
  },
  emits: ['change', 'update:modelValue'],
  setup(props, { emit }) {
    const getModelValueType = (types, value) => {
      let result = types[0] || ''

      if (value === undefined) return result
      for (const type of types) {
        if (typeof value === type || (type === 'array' && Array.isArray(value))) {
          result = type
          emit('change', [type])
          break
        }
      }

      return result
    }

    const currentType = getModelValueType(props.meta.type, props.meta.widget?.props?.modelValue)
    const defaultType = getModelValueType(props.meta.type, props.meta.defaultValue)

    const initModelValue = () =>
      props.meta.type.map((type) => {
        if (type === currentType) return { modelValue: props.meta.widget?.props?.modelValue }
        if (type === defaultType) return { modelValue: props.meta.defaultValue }
        return { modelValue: null }
      })

    const state = reactive({
      type: currentType, // 当前选中的组件类型
      typesValue: initModelValue() // 保存多个组件的modelValue
    })

    const TYPE_MAP = {
      string: '字符串',
      number: '数字',
      boolean: '布尔值',
      object: '对象',
      array: '数组'
    }

    const change = (val) => {
      const itemIndex = props.meta.type.findIndex((type) => type === val[0])
      if (itemIndex > -1) {
        emit('update:modelValue', state.typesValue[itemIndex].modelValue)
      }
      emit('change', val)
    }

    const handleChange = (index, val) => {
      const type = props.meta.type[index]

      if (state.type !== type) {
        state.type = type
        emit('change', [type])
      }
      emit('update:modelValue', val)
    }

    return {
      state,
      TYPE_MAP,
      change,
      handleChange,
      getConfigurator
    }
  }
}
</script>

<style lang="less" scoped>
.container {
  width: 100%;
  padding: 0;
  position: relative;
  .container-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .tiny-radio {
    color: var(--te-component-common-icon-color);
  }
  .tiny-radio-group {
    width: 100%;
  }
  .property-container {
    width: 100%;
    padding: 8px 0px;
    display: flex;
    align-items: center;
    .item-label {
      width: 35%;
    }
    .component-wrap {
      width: calc(65% - 16px);
    }
  }
}
</style>
