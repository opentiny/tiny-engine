<template>
  <div :class="['item-content', { 'active-item': currentIndex === index }]" :key="item.itemId">
    <div class="option-input">
      <div class="left">
        <slot name="content" :data="item"></slot>
      </div>
      <div class="right">
        <slot name="operate" :data="item">
          <template v-if="enabledOperation">
            <template v-for="item in dataScource.btnList" :key="item.type">
              <template v-if="item.type === 'edit'">
                <tiny-popover
                  :key="itemData.index"
                  v-model="itemData.option.isVisible"
                  placement="bottom-start"
                  :popper-class="['option-popper', { 'fixed-left': expand }]"
                  :visible-arrow="!expand"
                  title=""
                  width="295"
                  height="auto"
                  trigger="manual"
                  @hide="hide(item)"
                >
                  <template v-if="itemData.option.isVisible">
                    <div ref="addOptions" class="add-options" :style="`left:${itemData.left}px;top:${itemData.top}px`">
                      <icon-close class="tiny-svg-size icon-close" @click="closeEditOption"></icon-close>
                      <slot name="metaForm">
                        <meta-form
                          v-bind="itemData"
                          footerbtnHide="true"
                          @changeItem="change"
                          @cancel="cancel"
                          @confirm="formConfirm"
                        ></meta-form>
                      </slot>
                      <slot name="footer"></slot></div
                  ></template>
                  <template #reference>
                    <span title="编辑">
                      <component
                        :is="item.icon"
                        class="tiny-svg-size icon-edit"
                        @click="btnClick($event, item.type)"
                      ></component>
                    </span>
                  </template>
                </tiny-popover>
              </template>
            </template>
          </template>
          <span title="拖拽">
            <icon-more class="tiny-svg-size icon-more"></icon-more>
          </span>
        </slot>
      </div>
    </div>
  </div>
  <!-- 遮罩层 -->
  <mask-modal :visible="showMask && !expand" @close="closeMask"></mask-modal>
</template>

<script>
import { reactive, watchEffect, ref } from 'vue'
import { Tooltip, Input, FormItem, Form, Popover, Button } from '@opentiny/vue'
import { iconMore, iconClose } from '@opentiny/vue-icon'
import { MaskModal, MetaForm } from '@opentiny/tiny-engine-common'

export default {
  components: {
    TinyTooltip: Tooltip,
    TinyInput: Input,
    TinyFormItem: FormItem,
    TinyForm: Form,
    TinyPopover: Popover,
    TinyButton: Button,
    MetaForm,
    MaskModal,
    IconClose: iconClose(),
    IconMore: iconMore()
  },
  inheritAttrs: false,
  props: {
    item: {
      type: Object,
      default: () => {}
    },
    dataScource: {
      type: Object,
      default: () => {}
    },
    index: {
      type: Number,
      default: 0
    },
    currentIndex: {
      type: Number,
      default: -1
    },
    enabledOperation: {
      type: Boolean,
      default: true
    },
    // 子级弹出层是否在左侧展开
    expand: {
      type: Boolean,
      default: false
    }
  },
  emits: ['editItem', 'changeItem'],
  setup(props, { emit }) {
    const itemData = reactive({})
    const showMask = ref(false)
    const top = ref(0)

    const editList = () => {
      showMask.value = true
      itemData.option.isVisible = true
    }

    const btnClick = ($event, action) => {
      switch (action) {
        case 'edit':
          emit('editItem', { action: 'edit', index: props.index })
          editList()
          break
        default:
          emit('editItem', { index: props.index })
          editList()
          break
      }
    }

    const change = () => {
      emit('changeItem', itemData)
    }

    const closeEditOption = () => {
      emit('closeItem')
      itemData.option.isVisible = false
      showMask.value = false
    }

    const hide = () => {
      emit('hide')
    }

    const isShowModal = ref(false)

    const cancel = () => {
      itemData.option.isVisible = false
    }

    const formConfirm = (formData) => {
      emit('changeItem', { data: formData, index: props.index })
      itemData.option.isVisible = false
    }

    watchEffect(() => {
      itemData.option = props.item
      itemData.textField = props.dataScource.textField
      itemData.valueField = props.dataScource.valueField
      itemData.label = props.dataScource.label
      itemData.index = props.index
      if (props.currentIndex !== props.index) {
        cancel()
      }
    })
    const closeMask = () => {
      showMask.value = false
      itemData.option.isVisible = false
    }

    return {
      itemData,
      change,
      closeEditOption,
      btnClick,
      editList,
      hide,
      showMask,
      closeMask,
      top,
      isShowModal,
      formConfirm,
      cancel
    }
  }
}
</script>

<style lang="less" scoped>
.item-content {
  border-bottom: 1px solid var(--te-component-common-border-color-divider);
  background: var(--te-component-common-bg-color);
  margin-bottom: -1px;
  color: var(--te-component-common-text-color-primary);
  &.active-item {
    background-color: var(--te-component-meta-list-item-bg-color);
  }
  .option-input {
    display: flex;
    height: 28px;
    align-items: center;
    padding: 0 10px;
    & > div {
      overflow: hidden;
      .tiny-svg {
        margin-right: 5px;
        font-size: 12px;
        opacity: 0.4;
        margin-bottom: 2px;
        color: var(--te-component-common-text-color-primary);
        &:hover {
          cursor: pointer;
          opacity: 1;
        }
      }

      &.left {
        flex: 1;
        display: flex;
        align-items: center;
        :deep(span) {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      &.right {
        float: left;
        text-align: right;
        margin-right: 2px;
        .icon-more {
          font-size: 14px;
          flex-shrink: 0;
          cursor: move;
        }
      }
    }
  }
}

.tiny-popover {
  position: relative;
  .icon-close {
    position: absolute;
    top: 6px;
    right: 10px;
  }
}
.add-options {
  overflow-y: auto;
  max-height: calc(100vh - 94px); // 94为头部高度和底部高度
  &.top {
    margin-bottom: 0;
  }
}
</style>
