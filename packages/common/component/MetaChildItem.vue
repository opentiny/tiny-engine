<template>
  <div class="items-container">
    <div class="title">{{ title }}</div>
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
import { isObject } from '@opentiny/vue-renderless/grid/static'
import ConfigItem from './ConfigItem.vue'
import i18n from '../js/i18n'

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
    const { locale } = i18n.global
    const untitled = {
      zh_CN: '未命名标题',
      en_US: 'Untitled'
    }

    const title = computed(() => {
      const propsModelValue = props.meta.widget.props?.modelValue || []
      const { title, label, type } = propsModelValue[props.arrayIndex] || {}
      const text = title || label
      const localizedText = isObject(text) ? text[locale.value] : text

      return localizedText || type || untitled[locale.value] || untitled.zh_CN
    })

    const properties = computed(() => {
      const result = [...(props.meta?.properties?.[0]?.content || [])]
      const propsModelValue = props.meta.widget.props?.modelValue

      if (result.length && propsModelValue) {
        result.forEach((item) => {
          let modelValue = propsModelValue
          if (props.type === 'array' && props.arrayIndex > -1) {
            modelValue = modelValue[props.arrayIndex]
          }
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
      title,
      properties,
      onValueChange
    }
  }
}
</script>

<style lang="less" scoped>
.title {
  color: var(--te-component-common-text-color-primary);
  padding: 0 10px;
  font-weight: bold;
  margin-bottom: 16px;
}
.items-container {
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
