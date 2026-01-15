<template>
  <div class="object-group-container">
    <div v-for="(data, idx) in properties" :key="idx" class="meta-config-item">
      <config-item
        :key="idx"
        :property="data"
        :data-prop-index="idx"
        :data-group-index="index"
        @update:modelValue="onValueChange(data.property, $event)"
      >
        <slot name="prefix" :data="data" />
        <slot name="suffix" :data="data" />
      </config-item>
    </div>
  </div>
</template>
<script>
import { computed } from 'vue'
import { ConfigItem } from '@opentiny/tiny-engine-common'

export default {
  name: 'ObjectDepthConfigurator',
  components: {
    ConfigItem
  },
  props: {
    meta: {
      type: Object,
      default: () => {}
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const properties = computed(() => {
      const result = props.meta?.properties?.[0]?.content || []
      const propsModelValue = props.meta.widget.props?.modelValue

      if (result.length && propsModelValue) {
        result.forEach((item) => {
          const modelValue = propsModelValue
          const model_value_property = modelValue[item.property]
          item.widget.props.modelValue =
            typeof model_value_property === 'boolean' ? model_value_property : model_value_property || null
        })
      }
      return result
    })
    const onValueChange = (property, value) => {
      emit('update:modelValue', { ...props.meta.widget.props.modelValue, [property]: value })
    }

    return {
      properties,
      onValueChange
    }
  }
}
</script>
<style lang="less" scoped>
.object-group-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  height: calc(100% - 34px); // 34为头部+底部的高度
  overflow-y: auto;

  .meta-config-item {
    flex: 1;
    padding: 0 10px;
    margin-bottom: var(--te-common-vertical-item-spacing-normal);
  }
}
</style>
