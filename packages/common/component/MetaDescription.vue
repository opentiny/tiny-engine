<template>
  <div v-show="showDescription" :class="[classObject, { border: border }]">
    <div class="content">
      <slot name="content">
        {{ text }}
      </slot>
    </div>
    <div class="footer">
      <div>
        <slot name="footer-left">
          <a :href="footer.href" target="_blank" class="footer-text link">{{ footer.text }}</a>
        </slot>
      </div>
      <div>
        <slot name="footer-right">
          <div class="footer-text" @click="closeDescription">{{ footer.confirm }}</div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watchEffect, reactive } from 'vue'

const $constants = {
  DESCRIPTION_TYPE: {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error'
  }
}

export default {
  props: {
    type: {
      type: String,
      default: $constants.DESCRIPTION_TYPE.INFO
    },
    text: {
      type: String,
      default: ''
    },
    footer: {
      type: Object,
      default: () => ({})
    },
    border: {
      type: Boolean,
      default: false
    },
    visible: {
      type: Boolean,
      default: true
    }
  },
  setup(props, { emit }) {
    const showDescription = ref(true)

    const classObject = reactive({
      wrapper: true,
      warning: props.type === $constants.DESCRIPTION_TYPE.WARNING,
      error: props.type === $constants.DESCRIPTION_TYPE.ERROR
    })

    const closeDescription = () => {
      showDescription.value = false
      emit('close')
    }

    watchEffect(() => {
      classObject.warning = props.type === $constants.DESCRIPTION_TYPE.WARNING
      classObject.error = props.type === $constants.DESCRIPTION_TYPE.ERROR
      showDescription.value = props.visible
    })

    return {
      showDescription,
      classObject,
      closeDescription
    }
  }
}
</script>

<style lang="less" scoped>
.wrapper {
  align-items: start;
  border-left: 2px solid currentcolor;
  border-radius: 0 3px 3px 0;
  line-height: 1.4;
  padding-block: 4px;
  padding-inline: 11px 8px;
  width: auto;
  color: var(--te-component-common-text-color-secondary);
  background-color: var(--te-component-meta-description-bg-color);
  box-shadow: 0px 0px 6px 2px rgba(0, 0, 0, 0.3);
  &.warning {
    color: var(--te-component-common-warning-color);
  }
  &.error {
    color: var(--te-component-common-error-color);
  }

  &.border {
    border: 1px solid var(--te-component-common-border-color);
    border-left: none;
  }
  .content {
    color: var(--te-component-common-text-color-secondary);
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--te-component-common-text-color-secondary);
    .footer-text {
      cursor: pointer;
      &.link {
        display: block;
        color: var(--te-component-common-text-color-link);
        &:hover {
          text-decoration: underline;
        }
      }
    }
    .footer-text:not(:empty) {
      margin-top: 5px;
    }
  }
}
</style>
