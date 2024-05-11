<template>
  <tiny-button-group
    class="meta-button-group"
    type="mini"
    v-model="value"
    :data="optionsData"
    @update:modelValue="change"
  ></tiny-button-group>
</template>

<script>
import { ref, watchEffect } from 'vue'
import { ButtonGroup } from '@opentiny/vue'
import i18n from '@opentiny/tiny-engine-controller/js/i18n'

export default {
  name: 'MetaButtonGroup',
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
  :deep(ul.tiny-group-item) {
    li.active button:not(.disabled) {
      background: var(--ti-button-group-item-active-bg-color);
      color: var(--ti-button-group-item-active-text-color);
      border-color: var(--ti-button-group-item-active-border-color);
      outline: 0;
    }
    li button:not(.disabled) {
      background: var(--ti-button-group-item-bg-color);
    }
    li:not(:last-child) {
      margin-right: 2px;
    }
    li button {
      min-width: 48px;
      padding: 0px 12px;
      max-width: 300px;
      line-height: 28px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    border: 0px;
  }
}
</style>
