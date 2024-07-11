<template>
  <tiny-select
    v-model="state.selected"
    :multiple="multi"
    :is-drop-inherit-width="true"
    :show-alloption="false"
    :clearable="true"
    @change="handleChange"
  >
    <template v-if="groups?.length">
      <tiny-option-group
        v-for="group in state.groupOptions"
        :key="group.label"
        :label="group.label?.[locale] ?? group.label"
        :disabled="group.disabled"
      >
        <tiny-option
          v-for="item in group.content"
          :key="item.value ?? item"
          :label="item.label?.[locale] ?? item.label ?? item"
          :value="item.value ?? item"
          :title="item.label?.[locale] ?? item.label ?? item"
        >
          <component :is="item.icon"></component>
          <span>{{ item.label?.[locale] ?? item.label ?? item }}</span>
        </tiny-option>
      </tiny-option-group>
    </template>
    <template v-else>
      <tiny-option
        v-for="item in options"
        :key="item.value ?? item"
        :label="item.label?.[locale] ?? item.label ?? item"
        :value="item.value ?? item"
        :disabled="item?.disabled"
        :title="item.label?.[locale] ?? item.label ?? item"
      >
        <component :is="item.icon"></component>
        <span>{{ item.label?.[locale] ?? item.label ?? item }}</span>
      </tiny-option>
    </template>
  </tiny-select>
</template>

<script>
import { computed, reactive, watchEffect } from 'vue'
import { Select, Option, OptionGroup, Tooltip } from '@opentiny/vue'
import i18n from '@opentiny/tiny-engine-common/js/i18n'

export default {
  components: {
    TinySelect: Select,
    TinyOption: Option,
    TinyTooltip: Tooltip,
    TinyOptionGroup: OptionGroup
  },
  props: {
    modelValue: {
      type: [String, Array],
      default: () => ''
    },
    multi: {
      type: Boolean,
      default: false
    },
    groups: {
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
    const { locale } = i18n.global
    const state = reactive({
      selected: props.modelValue ?? '',
      groupOptions: computed(() => {
        if (props.groups && props.groups.length > 0) {
          const map = {}
          props.options.forEach((item) => {
            map[item.value] = item
          })

          return props.groups.map(({ label, content, disabled }) => {
            return { label, content: content.map((value) => map[value]), disabled }
          })
        } else {
          return []
        }
      })
    })

    const handleChange = () => {
      emit('update:modelValue', state.selected)
    }

    watchEffect(() => {
      state.selected = props.modelValue ?? ''
    })

    return {
      state,
      locale,
      handleChange
    }
  }
}
</script>
<style scoped>
.tiny-select-dropdown__item {
  padding: 0 4px;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  line-height: 30px;
}
</style>
