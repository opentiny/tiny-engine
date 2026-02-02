<template>
  <div class="object-group-container">
    <div class="overall-conf-wrap">
      <component
        :is="CodeConfigurator"
        :model-value="bindValue"
        language="json"
        buttonText="整体配置"
        @update:modelValue="onOptionsUpdate"
      >
      </component>
    </div>
    <div v-for="(data, idx) in properties" :key="idx" class="meta-config-item">
      <config-item
        :key="idx"
        :property="data"
        :data-prop-index="idx"
        :data-group-index="index"
        @update:modelValue="itemChange(data.property, $event)"
      >
        <slot name="prefix" :data="data" />
        <slot name="suffix" :data="data" />
      </config-item>
    </div>
  </div>
</template>
<script>
import { ref, computed } from 'vue'
import { ConfigItem } from '@opentiny/tiny-engine-common'
import { getConfigurator } from '@opentiny/tiny-engine-meta-register'

export default {
  name: 'NestedPropertyConfigurator',
  components: {
    ConfigItem
  },
  props: {
    meta: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const CodeConfigurator = getConfigurator('CodeConfigurator')
    const bindValue = ref(props.meta.widget.props?.modelValue)
    const properties = computed(() => {
      const result = [...(props.meta?.properties?.[0]?.content || [])]
      const propsModelValue = props.meta.widget.props?.modelValue

      if (result.length && propsModelValue) {
        result.forEach((item) => {
          const modelValue = propsModelValue
          const model_value_property = modelValue[item.property]
          item.widget.props.modelValue = typeof model_value_property === 'undefined' ? null : model_value_property
        })
      }
      return result
    })

    const onOptionsUpdate = (data) => {
      emit('update:modelValue', data)
    }
    const itemChange = (property, value) => {
      emit('update:modelValue', { ...props.meta.widget.props.modelValue, [property]: value })
    }

    return {
      CodeConfigurator,
      bindValue,
      properties,
      onOptionsUpdate,
      itemChange
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
  .overall-conf-wrap {
    top: -30px;
    position: absolute;
    right: 45px;
  }
  .meta-config-item {
    flex: 1;
    padding: 0 10px;
    margin-bottom: var(--te-common-vertical-item-spacing-normal);
  }
}
</style>
