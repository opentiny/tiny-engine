<template>
  <div class="right-item">
    <span class="title">数据源类型</span>
    <div class="item-radio-box">
      <span
        v-for="(item, index) in state.dataType"
        :key="item.name"
        :class="['item-type', { 'is-checked': state.checkedIndex === index }, { 'not-allowed': editable }]"
        @click="selectDataType(item, index)"
      >
        <svg-icon :name="item.icon"></svg-icon>
        <span>{{ item.name }}</span>
      </span>
    </div>
  </div>
</template>

<script>
import { reactive, watchEffect } from 'vue'

export default {
  props: {
    modelValue: {
      type: String,
      default: 'array'
    },
    editable: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const state = reactive({
      checkedIndex: 0,
      dataType: [
        {
          name: '对象数组',
          icon: 'json',
          value: 'array'
        },
        {
          name: '树结构',
          icon: 'tree-shape',
          value: 'tree'
        }
      ]
    })

    watchEffect(() => {
      const index = state.dataType.findIndex(({ value }) => value === props.modelValue)
      state.checkedIndex = index > -1 ? index : 0
    })

    const selectDataType = (item, index) => {
      if (props.editable) {
        return
      }
      state.checkedIndex = index
      emit('update:modelValue', item.value)
    }

    return {
      state,
      selectDataType
    }
  }
}
</script>

<style lang="less" scoped>
.right-item {
  padding: 16px 12px;
  color: var(--ti-lowcode-datasource-toolbar-icon-color);
  display: flex;
  .title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    line-height: 22px;
    font-weight: normal;
    margin-bottom: 10px;
    color: var(--ti-lowcode-datasource-label-color);
  }

  .item-type {
    font-size: 12px;
    color: var(--ti-lowcode-datasource-input-icon-color);
    display: inline-flex;
    align-items: center;
    cursor: pointer;

    &.not-allowed {
      cursor: not-allowed;
    }

    &:not(:last-child) {
      margin-right: 24px;
    }

    &.is-checked {
      color: var(--ti-lowcode-datasource-toolbar-breadcrumb-color);
      .svg-icon {
        color: var(--ti-lowcode-datasource-common-primary-color);
      }
    }
    .svg-icon {
      font-size: 24px;
      color: var(--ti-lowcode-datasource-input-icon-color);
      margin-right: 8px;
    }
  }
  .item-radio-box {
    margin-left: 30px;
  }
}
</style>
