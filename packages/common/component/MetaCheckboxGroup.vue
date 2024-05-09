<template>
  <tiny-checkbox-group
    v-model="value"
    type="checkbox"
    :options="parsedOptions"
    @change="handleChange"
  ></tiny-checkbox-group>
</template>

<script>
import { ref, watchEffect, computed } from 'vue'
import { CheckboxGroup } from '@opentiny/vue'
import i18n from '@opentiny/tiny-engine-controller/js/i18n'

export default {
  name: 'MetaCheckboxGroup',
  components: {
    TinyCheckboxGroup: CheckboxGroup
  },
  props: {
    modelValue: {
      type: Array,
      default: () => []
    },
    options: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const locale = i18n.global.locale.value
    const value = ref(props.modelValue)

    watchEffect(() => {
      value.value = props.modelValue || []
    })

    const handleChange = () => {
      emit('update:modelValue', value.value)
    }

    const parsedOptions = computed(() => {
      if (!Array.isArray(props.options)) {
        return []
      }

      return props.options.map((item) =>
        typeof item === 'object'
          ? {
              ...item,
              text: item.text?.[locale] || item.text
            }
          : { label: item, text: String(item) }
      )
    })

    return {
      value,
      handleChange,
      parsedOptions
    }
  }
}
</script>

<style lang="less" scoped></style>
