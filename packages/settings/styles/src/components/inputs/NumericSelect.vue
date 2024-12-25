<template>
  <div :class="['style-numeric', { focus: focus }]">
    <tiny-numeric
      v-model="numericalModelValue"
      :placeholder="placeholder"
      controls-position="right"
      :unit="numericalSuffix"
      :empty-value="null"
      min="0"
      allow-empty
      @mouseover="isNumericHover = true"
      @mouseleave="isNumericHover = false"
      @focus="focus = true"
      @blur="focus = false"
      @change="change"
    >
    </tiny-numeric>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue'
import { Numeric } from '@opentiny/vue'
import useEvent from '../../js/useEvent'

export default {
  components: {
    TinyNumeric: Numeric
  },
  props: {
    name: {
      type: String,
      default: ''
    },
    numericalText: {
      type: [String, Number],
      default: ''
    },
    controls: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: ''
    },
    suffix: {
      type: String,
      default: 'px'
    }
  },
  emits: useEvent(),
  setup(props, { emit }) {
    const numericalModelValue = ref(props.numericalText || null)
    const isNumericHover = ref(false)
    const focus = ref(false)

    const percentageReg = (val) => /^\d+(.\d+)?%$/.test(val)
    const numericalSuffix = computed(() => {
      const val = String(numericalModelValue.value).toLowerCase()
      if (isNumericHover.value) {
        return ''
      }
      return val === 'auto' || val === 'none' || percentageReg(val) ? '-' : props.suffix
    })

    watch(
      () => props.numericalText,
      (newValue) => {
        numericalModelValue.value = newValue || null
      }
    )

    const change = () => {
      focus.value = false
      numericalModelValue.value = String(numericalModelValue.value)
      if (numericalModelValue.value.trim().length === 0) {
        emit('update', { [props.name]: null })
      }

      emit('update', {
        [props.name]:
          props.name === 'zIndex' ||
          numericalModelValue.value === 'auto' ||
          numericalModelValue.value === 'none' ||
          percentageReg(numericalModelValue.value) ||
          !numericalModelValue.value
            ? numericalModelValue.value
            : `${numericalModelValue.value}px`
      })
    }

    return {
      numericalModelValue,
      numericalSuffix,
      isNumericHover,
      focus,
      change
    }
  }
}
</script>

<style lang="less" scoped>
.style-numeric {
  display: flex;
  align-items: center;
  background-color: var(--te-common-bg-default);
  border-radius: 3px;
  transition: 0.3s;
  &.focus {
    border-color: var(--te-common-border-default);
  }
  :deep(.tiny-numeric) {
    width: 100%;
    .tiny-numeric__input-inner {
      padding-right: 22px;
    }

    .tiny-numeric__unit {
      font-size: 12px;
      color: var(--te-common-text-weaken);
      background-color: var(--te-common-bg-default);
    }
  }
  .suffix-wrap {
    .suffix-text {
      font-size: 12px;
      color: var(--te-common-text-weaken);
    }

    &:hover {
      .suffix-text {
        display: none;
      }
    }
  }
}
</style>
