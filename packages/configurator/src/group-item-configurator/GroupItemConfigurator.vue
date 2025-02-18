<template>
  <div class="meta-group-container">
    <label v-if="meta.label && !meta.label.hidden" class="meta-group-label">{{ meta.label?.text?.zh_CN }}</label>
    <meta-child-item :meta="meta" @update:modelValue="onValueChange"></meta-child-item>
    <div v-if="!meta.widget.props.hiddenTopLine" class="sep-line top-line"></div>
    <div v-if="!meta.widget.props.hiddenBottomLine" class="sep-line bottom-line"></div>
  </div>
</template>

<script>
import { MetaChildItem } from '@opentiny/tiny-engine-common'

export default {
  name: 'GroupItemConfigurator',
  components: {
    MetaChildItem
  },
  inheritAttrs: false,
  props: {
    meta: {
      type: Object,
      default: () => {}
    }
  },
  setup(props, { emit }) {
    const onValueChange = ({ propertyKey, propertyValue }) => {
      const newPropertyValue = { ...props.meta.widget?.props?.modelValue, [propertyKey]: propertyValue }
      emit('update:modelValue', newPropertyValue)
    }

    return { onValueChange }
  }
}
</script>

<style lang="less" scoped>
.meta-group-container {
  position: relative;
  width: 100%;
  .sep-line {
    position: absolute;
    background-color: var(--te-configurator-common-bg-color-transparent);
    height: 1px;
    width: 272px;
    left: -16px;
  }
  .top-line {
    top: -10px;
  }
  .bottom-line {
    bottom: -10px;
  }
}
</style>
