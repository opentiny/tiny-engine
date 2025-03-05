<template>
  <div class="radio-group">
    <tiny-tooltip
      v-for="option in options"
      :key="option.value"
      :open-delay="500"
      :disabled="disabled"
      :content="option.tip"
      placement="top"
      effect="light"
    >
      <label :class="['radio-button', { active: option.value === value }]">
        <input v-model="picked" type="radio" name="radio-buttons" :value="option.value" @click="change" />
        <component :is="option.icon" v-if="option.isTinyIcon" />
        <svg-icon v-if="!option.isTinyIcon && option.icon" :name="option.icon"></svg-icon>
        <span v-if="option.text">{{ option.text }}</span>
        {{ option.title || '' }}
      </label>
    </tiny-tooltip>
  </div>
</template>

<script>
import { ref } from 'vue'
import { Tooltip } from '@opentiny/vue'

export default {
  components: {
    TinyTooltip: Tooltip
  },
  props: {
    options: {
      type: Array,
      required: true,
      default: () => [
        {
          value: 'block',
          title: '',
          tip: 'block',
          icon: 'display-block'
        }
      ]
    },
    value: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['pickedChange'],
  setup(props, context) {
    const picked = ref(props.value)

    const change = (event) => {
      const radioValue = event.target.value
      context.emit('pickedChange', radioValue)
    }

    return {
      picked,
      change
    }
  }
}
</script>

<style lang="less" scoped>
input[type='radio'] {
  appearance: none;
  margin: 0;
}

.radio-group {
  display: table;
  width: 100%;
  border-radius: 2px;
}

.radio-button {
  display: table-cell;
  color: var(--te-configurator-common-text-color-secondary);
  padding: 4px;
  text-align: center;
  &:not(:last-child) {
  }
  &.active {
    color: var(--te-configurator-common-text-color-emphasize);
  }
  &:not(.active):hover {
    color: var(--te-configurator-common-text-color-secondary);
  }
  &:first-child {
    border-top-left-radius: 2px;
    border-bottom-left-radius: 2px;
  }
  &:last-child {
    border-top-right-radius: 2px;
    border-bottom-right-radius: 2px;
  }
  svg {
    font-size: 16px;
  }
  .svg-icon {
    font-size: 16px;
  }
}
</style>
