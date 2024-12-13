<template>
  <div v-if="isOpen" class="step-select-first">
    <div class="field-row field-row-border-bottom-none">
      <div class="icon-and-text">
        <div class="field-cell-type">
          <icon-arrow-down></icon-arrow-down>
        </div>
        <div class="field-cell-name">
          <span>选择字段类型</span>
        </div>
      </div>
      <span class="btn" @click="cancelSelectType"> 取消 </span>
    </div>
    <div class="type-list">
      <div v-for="fieldType in state.fieldTypes" :key="fieldType.name" class="type-item" @click="selectType(fieldType)">
        <svg-icon :name="fieldType.icon" class="type-icon" />
        <span>{{ fieldType.name }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import { iconArrowDown } from '@opentiny/vue-icon'
import fieldTypes from './config'

let isOpen = ref(false)

export const open = () => {
  isOpen.value = true
}

export const close = () => {
  isOpen.value = false
}

export default {
  components: {
    iconArrowDown: iconArrowDown()
  },
  emits: ['cancel', 'select'],
  setup(props, { emit }) {
    const state = reactive({
      fieldTypes
    })

    const selectType = (type) => {
      close()
      emit('select', type)
    }

    const cancelSelectType = () => {
      close()
      emit('cancel')
    }

    return {
      state,
      isOpen,
      cancelSelectType,
      selectType
    }
  }
}
</script>

<style lang="less" scoped>
.step-select-first {
  border: 1px solid var(--ti-lowcode-datasource-border-color);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 46px;
  svg {
    color: var(--ti-lowcode-datasource-toolbar-icon-color);
  }
}
.field-row {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 12px;
  -webkit-box-shadow: none;
  box-shadow: none;
  border-bottom: 2px solid var(--ti-lowcode-datasource-dialog-demo-border-color);
  justify-content: space-between;
  align-items: center;
  &.field-row-border-bottom-none {
    border-bottom: none;
  }
  .icon-and-text {
    display: flex;
    align-items: center;
    .field-cell-type {
      height: 20px;
      display: flex;
      align-items: center;
    }
    .field-cell-name {
      margin-left: 5px;
      .description {
        color: var(--ti-lowcode-datasource-input-icon-color);
        margin-left: 5px;
      }
    }
  }
  .btn {
    color: var(--ti-lowcode-datasource-color);
    font-size: 12px;
    cursor: pointer;
  }
}

.type-list {
  display: flex;
  gap: 8px;
  grid-template-columns: repeat(6, 1fr);
  .type-item {
    width: 70px;
    height: 70px;
    padding: 12px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-direction: column;
    cursor: pointer;
    background-color: var(--ti-lowcode-datasource-box-bg);
    border-radius: 4px;
    color: var(--ti-lowcode-datasource-dialog-font-color);
    .type-icon {
      font-size: 20px;
    }
  }
}
</style>
