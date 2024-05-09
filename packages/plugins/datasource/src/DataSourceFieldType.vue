<template>
  <div v-if="isOpen" class="step-select-first">
    <div class="field-row field-row-border-bottom-none">
      <div class="icon-and-text">
        <div class="field-cell-type">
          <icon-arrow-down></icon-arrow-down>
        </div>
        <div class="field-cell-name">
          <span>请选择类型</span>
        </div>
      </div>
      <span class="btn">
        <tiny-button @click="cancelSelectType">取消</tiny-button>
      </span>
    </div>
    <div class="field-content type-list">
      <a v-for="fieldType in state.fieldTypes" :key="fieldType.name" class="type-item" @click="selectType(fieldType)">
        <svg-icon :name="fieldType.icon" class="type-icon" />
        <span>{{ fieldType.name }}</span>
      </a>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import { iconArrowDown } from '@opentiny/vue-icon'
import { Button } from '@opentiny/vue'
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
    TinyButton: Button,
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
  border-bottom: 1px solid var(--ti-lowcode-datasource-list-bottom-border-color);
  svg {
    color: var(--ti-lowcode-datasource-toolbar-icon-color);
  }
}
.field-row {
  display: flex;
  flex-wrap: wrap;
  padding: 8px 10px;
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
      width: 20px;
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
}
.field-content {
  padding: 8px 10px;
}
.type-list {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  .type-item {
    display: grid;
    grid-template-rows: 60px 24px;
    place-items: center;
    background-color: var(--ti-lowcode-datasource-canvas-wrap-bg);
    border-radius: 2px;
    color: var(--ti-lowcode-datasource-dialog-font-color);
    .type-icon {
      font-size: 25px;
    }
  }
}
</style>
