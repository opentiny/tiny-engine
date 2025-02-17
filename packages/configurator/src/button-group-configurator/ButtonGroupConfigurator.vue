<template>
  <tiny-button-group
    class="meta-button-group"
    type="mini"
    v-model="value"
    :data="optionsData"
    @update:modelValue="change"
  >
  </tiny-button-group>
</template>

<script>
import { ref, watchEffect } from 'vue'
import { ButtonGroup } from '@opentiny/vue'
import i18n from '@opentiny/tiny-engine-common/js/i18n'

export default {
  name: 'ButtonGroupConfigurator',
  components: {
    TinyButtonGroup: ButtonGroup
  },
  props: {
    modelValue: {
      type: String
    },
    options: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { locale } = i18n.global
    const value = ref(props.modelValue || '')

    const getLocaledOptions = (options) => {
      if (!options || !options.length) return []
      return options.map(({ label, ...rest }) => ({ ...rest, text: label[locale.value] ?? label }))
    }

    const optionsData = ref(getLocaledOptions(props.options))

    watchEffect(() => {
      value.value = props.modelValue
      optionsData.value = getLocaledOptions(props.options)
    })

    const change = (val) => {
      emit('update:modelValue', val)
    }

    return {
      value,
      optionsData,
      change
    }
  }
}
</script>

<style lang="less" scoped>
.meta-button-group.tiny-button-group {
  margin-top: 0px;
  width: 100%;
  :deep(ul.tiny-group-item) {
    width: 100%;
    display: flex;
    li {
      margin: 0;
      flex: 1;
    }
    li:first-child {
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
    }
    li:last-child {
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
    }
    li.active button:not(.disabled) {
      background: var(--te-configurator-button-group-bg-color-active);
      color: var(--te-configurator-common-text-color-primary);
      outline: 0;
    }
    li button:not(.disabled) {
      background: var(--te-configurator-button-group-bg-color);
      color: var(--te-configurator-common-text-color-secondary);
    }
    li button {
      min-width: 0px;
      width: 100%;
      border-radius: 4px;
      padding: 0px 8px;
      max-width: 300px;
      height: 24px;
      line-height: 24px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    li:not(:last-child)::after {
      content: '';
      position: absolute;
      width: 1px;
      height: 50%;
      background-color: var(--te-configurator-common-border-color);
      right: 0;
      top: 50%;
      transform: translate(50%, -50%);
      z-index: 100;
    }
    li:has(+ li.active)::after,
    li.active::after {
      content: none;
    }
    border: 0px;
  }
}
</style>
