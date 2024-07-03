<template>
  <div class="items-container">
    <div v-for="(data, idx) in properties" :key="idx" class="meta-config-item">
      <config-item
        :key="idx"
        :property="data"
        :data-prop-index="idx"
        :data-group-index="index"
        @update:modelValue="onValueChange(data.property, $event)"
      >
        <slot name="prefix" :data="data"></slot>
        <slot name="suffix" :data="data"></slot>
      </config-item>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import ConfigItem from './ConfigItem.vue'

export default {
  components: {
    ConfigItem
  },
  inheritAttrs: false,
  props: {
    meta: {
      type: Object,
      default: () => {}
    },
    type: {
      type: String,
      default: 'object'
    },
    arrayIndex: {
      type: Number,
      default: -1
    }
  },
  setup(props, { emit }) {
    const properties = computed(() => {
      const result = [...(props.meta?.properties?.[0]?.content || [])]
      const propsModelValue = props.meta.widget.props?.modelValue

      if (result.length && propsModelValue) {
        result.forEach((item) => {
          let modelValue = propsModelValue
          if (props.type === 'array' && props.arrayIndex > -1) modelValue = modelValue[props.arrayIndex]
          let model_value_property = modelValue[item.property]
          item.widget.props.modelValue =
            typeof model_value_property === 'boolean' ? model_value_property : model_value_property || null
        })
      }
      return result
    })

    const onValueChange = (property, data) => {
      emit('update:modelValue', { propertyKey: property, propertyValue: data })
    }

    return {
      properties,
      onValueChange
    }
  }
}
</script>

<style lang="less" scoped>
.items-container {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  .meta-config-item {
    flex: 1;
    padding: 0 10px;
  }
}
</style>
