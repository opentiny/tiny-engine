<template>
  <div class="meta-modal-wrap">
    <tiny-button @click="open">{{ title }}</tiny-button>
    <div v-if="modalState.created" v-show="modalState.show" class="mask" @click.self="close">
      <div class="property-item">
        <div class="property-item-header">
          <span class="header-text">{{ title }}</span>
          <span class="icon-wrap">
            <icon-close class="header-icon" @click="close"></icon-close>
          </span>
        </div>
        <slot name="body">
          <div class="meta-modal-body">
            <meta-child-item :meta="meta" @update:modelValue="onValueChange"></meta-child-item>
          </div>
        </slot>
        <slot name="footer">
          <div v-show="false" class="property-item-footer">
            <tiny-button @click="close">关闭</tiny-button>
            <tiny-button type="info" @click="save">保存</tiny-button>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
import { Button } from '@opentiny/vue'
import { iconClose } from '@opentiny/vue-icon'
import { reactive, computed } from 'vue'
import MetaChildItem from './MetaChildItem.vue'

export default {
  components: {
    MetaChildItem,
    TinyButton: Button,
    IconClose: iconClose()
  },
  props: {
    meta: {
      type: Object,
      default: () => {}
    }
  },
  emits: ['save'],
  setup(props, { emit }) {
    const modalState = reactive({
      show: false,
      created: false
    })
    const title = computed(() => `编辑${props.meta.label?.text?.zh_CN || props.meta.property || '属性'}`)

    // 关闭编辑器
    const close = () => {
      modalState.show = false
      emit('close')
    }

    // 打开编辑器
    const open = () => {
      if (!modalState.created) {
        modalState.created = true
      }

      modalState.show = true
    }

    const save = (value) => {
      emit('update:modelValue', value)

      close()
    }

    const onValueChange = ({ propertyKey, propertyValue }) => {
      const newPropertyValue = { ...props.meta.widget?.props?.modelValue, [propertyKey]: propertyValue }
      emit('update:modelValue', newPropertyValue)
    }

    return {
      title,
      modalState,
      save,
      close,
      open,
      onValueChange
    }
  }
}
</script>

<style lang="less" scoped>
.mask {
  width: 100%;
  height: 100%;
  position: fixed;
  z-index: 999;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
  .property-item {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    z-index: 9999;
    width: 50vw;
    height: fit-content;
    min-height: 200px;
    max-height: 90vh;
    padding: 0 16px;
    margin: auto;
    border-radius: 4px;
    border: 1px solid var(--te-component-common-border-color);
    background-color: var(--te-component-meta-modal-bg-color);
    box-shadow: rgb(0 0 0 / 30%) 0px 1px 15px 0px;

    .property-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      color: var(--te-component-common-text-color-secondary);

      .header-title {
        font-size: 14px;
      }

      .icon-wrap {
        width: 20px;
        height: 20px;
        color: var(--te-component-common-icon-color);
        font-size: 16px;
        border-radius: 2px;
        cursor: pointer;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        transition: 0.3s;
        &:hover {
          color: var(--te-component-common-icon-color-hover);
          background: var(--te-component-common-bg-color-hover);
        }
      }
    }

    .property-item-content {
      // min-height: 200px;
      height: calc(100% - 86px);
      box-shadow: 0px 0px 4px rgb(0 0 0 / 20%);
    }

    .property-item-footer {
      display: flex;
      justify-content: flex-end;
      padding: 10px 0;
    }
  }
  .meta-modal-body {
    display: flex;
    flex-wrap: wrap;
  }
}
.meta-modal-wrap {
  :deep(.items-container) {
    .meta-config-item {
      width: 50%;
    }
  }
}
</style>
