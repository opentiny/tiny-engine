<template>
  <div class="meta-cascader">
    <tiny-cascader
      filterable
      v-model="selected"
      :placeholder="placeholder"
      :disabled="disabled"
      :clearable="clearable"
      :options="optionsData"
      :props="{ emitPath: false }"
      @update:modelValue="change"
    ></tiny-cascader>
  </div>
</template>

<script>
import { ref, watchEffect } from 'vue'
import { Cascader } from '@opentiny/vue'
import i18n from '@opentiny/tiny-engine-controller/js/i18n'

export default {
  name: 'MetaCascader',
  components: {
    TinyCascader: Cascader
  },
  props: {
    modelValue: {
      type: String
    },
    options: {
      type: Array,
      default: () => []
    },
    placeholder: {
      type: String
    },
    disabled: {
      type: Boolean,
      default: false
    },
    clearable: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { locale } = i18n.global
    const selected = ref(props.modelValue || '')

    const convertOptionsI18n = (obj) => {
      const { label, children, ...restProp } = obj
      const result = { ...restProp, label: label[locale.value] ?? label }
      if (children?.length) {
        result.children = children.map((child) => convertOptionsI18n(child))
      }

      return result
    }

    const getOptionsData = (options) => {
      if (!options || !options.length) return []
      return options.map((option) => convertOptionsI18n(option))
    }

    const optionsData = ref(getOptionsData(props.options))

    watchEffect(() => {
      selected.value = props.modelValue
      optionsData.value = getOptionsData(props.options)
    })

    const change = (val) => {
      emit('update:modelValue', val)
    }

    return {
      optionsData,
      selected,
      change
    }
  }
}
</script>

<style lang="less" scoped>
.meta-cascader {
  width: 100%;
  .tiny-cascader {
    width: 100%;
  }
}
</style>
