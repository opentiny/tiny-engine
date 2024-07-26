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
import i18n from '@opentiny/tiny-engine-common/js/i18n'

export default {
  name: 'MultPropertyConfigurator',
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
      return options.map(({ label, ...rest }) => ({ ...rest, text: label[locale.value] ?? label, isChange: false }))
    }

    const optionsData = ref(getLocaledOptions(props.options))

    watchEffect(() => {
      value.value = props.modelValue
      optionsData.value = getLocaledOptions(props.options)
    })

    const change = (val) => {
      optionsData.value.map((item) => {
        item.isChange = item.value === val ? true : false
      })
      emit('update:modelValue', optionsData.value)
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
  width: 100%;
  margin-top: 0px;
  :deep(ul.tiny-group-item) {
    width: 100%;
    display: flex;
    li.active button:not(.disabled) {
      background: var(--ti-lowcode-button-group-select-bg);
      border-color: var(--ti-button-group-item-active-border-color);
      outline: 0;
    }
    li button:not(.disabled) {
      background: var(--ti-lowcode-button-group-default-bg);
    }
    li {
      flex: 1;
      height: 28px;
      margin-top: 2px;
    }
    li button {
      width: 100%;
      min-width: 40px;
      padding: 0px 8px;
      max-width: 300px;
      line-height: 30px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    border: 0px;
  }
}
</style>
