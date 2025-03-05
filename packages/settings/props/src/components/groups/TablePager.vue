<template>
  <button @click="openSetting">分页配置</button>
  <table-modal v-if="modal.created" v-show="modal.show" @close="closeModal">
    <table-setting-panel
      :properties="properties"
      :values="state.values"
      :namePrefix="state.namePrefix"
    ></table-setting-panel>
  </table-modal>
</template>

<script>
import { reactive } from 'vue'
import { useModal } from '@opentiny/tiny-engine-common'
import { MetaModal } from '@opentiny/tiny-engine-common'
import TableSettingPanel from '../modal/ModalContent.vue'

export default {
  components: {
    TableModal: MetaModal,
    TableSettingPanel
  },
  inheritAttrs: false,
  props: {
    name: {
      type: String,
      default: ''
    },
    modelValue: {
      type: Object,
      default: () => ({})
    },
    properties: {
      type: Array,
      default: () => []
    }
  },

  setup(props) {
    const state = reactive({
      values: props.modelValue
    })

    const { modal, openModal, closeModal } = useModal()

    const openSetting = () => {
      state.namePrefix = `${props.name}.`
      openModal()
    }

    return {
      modal,
      state,
      closeModal,
      openSetting
    }
  }
}
</script>

<style lang="less" scoped>
.colums {
  width: 100%;
  .top {
    color: var(--te-props-common-text-color-secondary);
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    .tiny-svg {
      color: var(--te-props-common-icon-color-primary);
      margin-right: 5px;
      font-size: 16px;
      &:hover {
        cursor: pointer;
      }
    }
  }
}
</style>
