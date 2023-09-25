<template>
  <div :class="['style-numeric', { focus: focus }]">
    <tiny-input
      v-model="numericalModelValue"
      :placeholder="placeholder"
      @focus="focus = true"
      @blur="focus = false"
      @change="change"
    >
      <template #suffix>
        <span class="suffix">{{ numericalSuffix }}</span>
      </template>
    </tiny-input>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue'
import { Input } from '@opentiny/vue'
import useEvent from '../../js/useEvent'

export default {
  components: {
    TinyInput: Input
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
      type: [String, Number],
      default: ''
    },
    suffix: {
      type: String,
      default: 'PX'
    }
  },
  emits: useEvent(),
  setup(props, { emit }) {
    const numericalModelValue = ref(String(props.numericalText || ''))

    const percentageReg = (val) => /^\d+(.\d+)?%$/.test(val)
    const numericalSuffix = computed(() => {
      const val = String(numericalModelValue.value).toLowerCase()
      return val === 'auto' || val === 'none' || percentageReg(val) ? '-' : props.suffix
    })

    watch(
      () => props.numericalText,
      (newValue) => {
        numericalModelValue.value = String(newValue || '')
      }
    )

    const focus = ref(false)

    const change = (value) => {
      focus.value = false

      if (value.trim().length === 0) {
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
  background-color: var(--ti-lowcode-tabs-bg);
  border-radius: 3px;
  transition: 0.3s;
  &.focus {
    border-color: var(--ti-lowcode-canvas-handle-hover-bg);
  }

  .suffix {
    font-size: 12px;
    color: var(--ti-lowcode-text-color);
  }

  :deep(.tiny-input-suffix) {
    .tiny-input__inner {
      padding: 0 20px 0 4px;
    }
    .tiny-input__suffix {
      right: 4px;
    }
  }
}
</style>
