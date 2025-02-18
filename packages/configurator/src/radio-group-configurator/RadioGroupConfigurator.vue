<template>
  <div class="meta-radio-group-container">
    <tiny-radio-group v-if="type === 'button'" v-model="value" v-bind="$attrs" @change="handleChange">
      <tiny-radio-button
        v-for="item in parsedOptions"
        :key="item"
        :label="item.label ?? item"
        :text="item.text ?? item.label"
      ></tiny-radio-button>
    </tiny-radio-group>
    <tiny-radio-group
      v-if="type === 'radio'"
      v-model="value"
      v-bind="$attrs"
      :options="parsedOptions"
      @change="handleChange"
    ></tiny-radio-group>
  </div>
</template>

<script>
import { ref, watchEffect, computed } from 'vue'
import { RadioGroup, RadioButton } from '@opentiny/vue'
import i18n from '@opentiny/tiny-engine-common/js/i18n'

export default {
  name: 'RadioGroupConfigurator',
  components: {
    TinyRadioGroup: RadioGroup,
    TinyRadioButton: RadioButton
  },
  props: {
    modelValue: {
      type: String
    },
    options: {
      type: Array,
      default: () => []
    },
    type: {
      type: String,
      default: 'radio'
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const locale = i18n.global.locale.value
    const value = ref(props.modelValue)

    watchEffect(() => {
      value.value = props.modelValue ?? ''
    })

    const handleChange = () => {
      emit('update:modelValue', value.value)
    }

    const parsedOptions = computed(() =>
      props.options.map((item) =>
        typeof item === 'object'
          ? {
              ...item,
              text: item.text?.[locale] || item.text
            }
          : { label: item, text: String(item) }
      )
    )

    return {
      value,
      handleChange,
      parsedOptions
    }
  }
}
</script>

<style lang="less" scoped>
.meta-radio-group-container {
  :deep(.tiny-radio-button__inner.tiny-radio-button__inner.tiny-radio-button__inner) {
    padding: 5px 16px;
  }
}
</style>
