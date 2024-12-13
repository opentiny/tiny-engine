<template>
  <div class="display-row">
    <div :class="['display-label', { selected: picked }]" @click="openDisplayModal($event)">
      <span>排布</span>
    </div>
    <div class="display-content">
      <tabs-group-configurator
        :options="layoutOpts"
        :modelValue="picked"
        @update:modelValue="select"
      ></tabs-group-configurator>
    </div>
  </div>

  <modal-mask v-if="showModal" @close="showModal = false">
    <reset-button @reset="reset" />
  </modal-mask>
</template>

<script>
import { ref, computed } from 'vue'
import { DISPLAY_TYPE, DISPLAY_TEXT } from '../../js/cssType'
import { TabsGroupConfigurator } from '@opentiny/tiny-engine-configurator'
import useEvent from '../../js/useEvent'
import ResetButton from '../inputs/ResetButton.vue'
import ModalMask, { useModal } from '../inputs/ModalMask.vue'

export default {
  components: {
    TabsGroupConfigurator,
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
    const { setPosition } = useModal()

    const picked = computed(() => props.display)
    const showModal = ref(false)

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
      picked.value = null
      emit('update', { display: null })
      showModal.value = false
    }

    const layoutOpts = ref([
      {
        value: DISPLAY_TYPE.Block,
        label: DISPLAY_TEXT.Block
      },
      {
        value: DISPLAY_TYPE.Flex,
        label: DISPLAY_TEXT.Flex
      },
      {
        value: DISPLAY_TYPE.Grid,
        label: DISPLAY_TEXT.Grid,
        collapsed: true
      },

      {
        value: DISPLAY_TYPE.InlineBlock,
        label: DISPLAY_TEXT.InlineBlock,
        collapsed: true
      },
      {
        value: DISPLAY_TYPE.Inline,
        label: DISPLAY_TEXT.Inline,
        collapsed: true
      },
      {
        value: DISPLAY_TYPE.Invisible,
        label: DISPLAY_TEXT.Invisible,
        collapsed: true
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
    line-height: 24px;
    color: var(--te-common-text-secondary);
    span {
      padding: 2px;
    }
    &.selected {
      span {
        cursor: pointer;
        border-radius: 2px;
        color: var(--te-common-text-emphasize);
        background-color: var(--te-common-bg-text-emphasize);
      }
    }
  }

  .display-content {
    flex: auto;
    display: flex;
  }
}
</style>
