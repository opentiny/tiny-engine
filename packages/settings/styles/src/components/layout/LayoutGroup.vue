<template>
  <div class="display-row">
    <div :class="['display-label', { selected: display }]" @click="openDisplayModal($event)">排布</div>
    <div class="display-content">
      <radio-configurator :options="layoutOpts" :value="picked" @pickedChange="select"></radio-configurator>
    </div>
  </div>

  <modal-mask v-if="showModal" @close="showModal = false">
    <reset-button @reset="reset" />
  </modal-mask>
</template>

<script>
import { ref, watch } from 'vue'
import { DISPLAY_TYPE } from '../../js/cssType'
import { RadioConfigurator } from '@opentiny/tiny-engine-configurator'
import useEvent from '../../js/useEvent'
import { ModalMask, useModalMask, ResetButton } from '@opentiny/tiny-engine-common'

export default {
  components: {
    RadioConfigurator,
    ModalMask,
    ResetButton
  },
  props: {
    effect: {
      type: String,
      default: 'dark'
    },
    placement: {
      type: String,
      default: 'top'
    },
    display: {
      type: String,
      default: null
    },
    disabled: {
      type: Object,
      default: () => ({})
    }
  },
  emits: useEvent(),
  setup(props, { emit }) {
    const { setPosition } = useModalMask()

    const picked = ref(props.display)
    const showModal = ref(false)

    watch(
      () => props.display,
      () => {
        picked.value = props.display
      }
    )

    const select = (type) => {
      picked.value = type
      if (type && !props.disabled[type]) {
        emit('update', { display: type })
      }
    }

    const openDisplayModal = (event) => {
      if (props.display) {
        setPosition(event)
        showModal.value = true
      }
    }

    const reset = () => {
      picked.value = ''
      emit('update', { display: '' })
      showModal.value = false
    }

    const layoutOpts = ref([
      {
        value: DISPLAY_TYPE.Block,
        title: '',
        tip: 'block-块级布局',
        icon: 'display-block'
      },
      {
        value: DISPLAY_TYPE.Flex,
        title: '',
        tip: 'flex-弹性布局',
        icon: 'display-flex'
      },
      {
        value: DISPLAY_TYPE.Grid,
        title: '',
        tip: 'grid-网格布局',
        icon: 'display-grid'
      },
      {
        value: DISPLAY_TYPE.InlineBlock,
        title: '',
        tip: 'inline-block-内联块级',
        icon: 'display-inline-block'
      },
      {
        value: DISPLAY_TYPE.Inline,
        title: '',
        tip: 'inline-内联',
        icon: 'display-inline'
      },
      {
        value: DISPLAY_TYPE.Invisible,
        title: '',
        tip: 'eye-invisible-隐藏',
        icon: 'eye-invisible'
      }
    ])

    return {
      layoutOpts,
      picked,
      reset,
      select,
      showModal,
      openDisplayModal
    }
  }
}
</script>

<style lang="less" scoped>
.display-row {
  display: flex;
  align-items: center;

  .display-label {
    flex: 0 0 50px;
    padding: 0 3px;
    line-height: 24px;

    &.selected {
    }
  }

  .display-content {
    flex: auto;
    display: flex;

    .display-content-item {
      flex: 1;
      padding: 4px 0;
      font-size: 16px;
      background: var(--ti-lowcode-canvas-wrap-bg);
      position: relative;
      color: var(--ti-lowcode-component-setting-panel-icon-color);
      display: flex;
      justify-content: center;
      align-items: center;

      &:not(:last-child)::after {
        content: '';
        width: 1px;
        height: 100%;
        background: var(--ti-lowcode-tabs-border-color);
        display: inline-block;
        position: absolute;
        top: 0;
        right: 0;
      }

      &:hover {
        color: var(--ti-lowcode-property-hover-color);
      }

      &.selected {
        color: var(--ti-lowcode-toolbar-icon-color);
        background-color: var(--ti-lowcode-tabs-bg);
      }

      &.disabled {
        background-color: var(--ti-lowcode-error-tip-color);

        &:hover {
          cursor: not-allowed;
        }
      }

      .display-svg {
        margin: auto;
      }
    }
  }
}
</style>
