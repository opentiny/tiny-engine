<template>
  <div :class="['input-select', { focus: state.focus, 'is-disabled': disabled }]">
    <tiny-input
      v-model="state.inputValue"
      :placeholder="placeholder"
      @focus="state.focus = true"
      @blur="state.focus = false"
      @change="inputChange"
    >
      <template #suffix>
        <tiny-select
          v-model="state.selectValue"
          :disabled="disabled"
          popper-class="position-origin-select"
          placeholder=""
          @change="selectChange"
        >
          <tiny-option v-for="item in state.selectOptions" :key="item.value" :label="item.label" :value="item.value">
            <span class="suffix">{{ item.label === '-' ? 'AUTO' : item.label }}</span>
          </tiny-option>
        </tiny-select>
      </template>
    </tiny-input>
  </div>
</template>

<script>
import { watch, reactive } from 'vue'
import { Input, Select, Option } from '@opentiny/vue'

export default {
  components: {
    TinyInput: Input,
    TinySelect: Select,
    TinyOption: Option
  },
  props: {
    modelValue: {
      type: [String, Number],
      default: ''
    },
    suffixValue: {
      type: String,
      default: 'px'
    },
    placeholder: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    options: {
      type: Array,
      default: () => [
        {
          label: 'px',
          value: 'px'
        },
        {
          label: '%',
          value: '%'
        },
        {
          label: 'vw',
          value: 'vw'
        },
        {
          label: 'vh',
          value: 'vh'
        }
      ]
    }
  },
  emits: ['input-change', 'select-change'],
  setup(props, { emit }) {
    const state = reactive({
      focus: false,
      inputValue: props.modelValue,
      selectValue: props.suffixValue,
      selectOptions: props.options
    })

    const inputChange = (val) => {
      state.focus = false
      emit('input-change', val)
    }

    const selectChange = (val) => {
      emit('select-change', val)
    }

    watch(
      () => props.modelValue,
      (newValue) => {
        state.inputValue = newValue
      }
    )

    watch(
      () => props.suffixValue,
      (newValue) => {
        state.selectValue = newValue
      }
    )

    return {
      state,
      inputChange,
      selectChange
    }
  }
}
</script>

<style lang="less" scoped>
.input-select {
  display: flex;
  align-items: center;
  background-color: var(--te-styles-common-bg-color);
  border-radius: 3px;
  transition: 0.3s;
  &.focus {
    border-color: var(--te-styles-common-border-color-checked);
  }

  &.is-disabled {
    cursor: not-allowed;
    &.focus {
      border-color: transparent;
    }
    :deep(.tiny-input) {
      cursor: not-allowed;
      .tiny-input__inner {
        cursor: not-allowed;
        pointer-events: none;
        &:focus {
          border-color: transparent;
        }
      }
    }
    :deep(.tiny-select) {
      .tiny-input__inner:hover {
        color: var(--te-styles-common-text-color-secondary);
        background: transparent;
      }
      .tiny-input.is-disabled .tiny-input__inner {
        background: transparent;
      }
    }
  }

  .suffix {
    font-size: 12px;
  }
  :deep(.tiny-input__inner) {
    padding: 0 12px 0 4px;
  }
  :deep(.tiny-input__suffix) {
    right: 1px;
  }
  :deep(.tiny-select) {
    width: auto;
    max-width: 30px;
    .tiny-input__inner {
      color: var(--te-styles-common-text-color-secondary);
      padding: 2px 0;
      font-size: 12px;
      border: none;
      height: 20px;
      text-align: center;
      box-sizing: border-box;
      cursor: pointer;
      &:hover {
        background: var(--te-styles-common-bg-color-hover);
      }
    }
    .tiny-input__suffix {
      display: none;
    }
  }
}
</style>
