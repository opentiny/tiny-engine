<template>
  <div>
    <div class="mapping-list" v-if="state.columns.length">
      <div v-for="item in state.columns" :key="item.id" class="mapping-list-item">
        <div class="item-body">
          <span>{{ item.name }}</span>
          <tiny-select
            v-if="item.status"
            v-model="item.type"
            :options="mappingType"
            placeholder="请选择字段输入类型"
            text-field="name"
            value-field="type"
          ></tiny-select>
          <tiny-input v-model="item.title" placeholder="输入相应的 label 名称"></tiny-input>
          <div class="open">
            <tiny-checkbox v-model="item.status" name="tiny-checkbox" @change="change(item)"></tiny-checkbox>
            <span class="tip">启用该字段</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="mapping-empty-wrap">
      <svg-icon class="empty-icon" name="empty"></svg-icon>
      <p class="empty-text">暂无数据</p>
    </div>
  </div>
</template>

<script lang="ts">
/* metaService: engine.plugins.collections.DataSourceRemoteMapping */
import { reactive, watchEffect, ref } from 'vue'
import { TinyInput, TinySelect, TinyCheckbox } from '@opentiny/vue'
import mappingType from './config.js'

export const isOpen = ref(false)

export const open = () => {
  isOpen.value = true
}

export const close = () => {
  isOpen.value = false
}

export default {
  components: {
    TinySelect,
    TinyInput,
    TinyCheckbox
  },
  props: {
    modelValue: {
      type: Array,
      default: () => []
    },
    data: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const state = reactive({
      columns: []
    })

    watchEffect(() => {
      state.columns = Object.keys(props.data).map((res) => {
        return {
          title: '',
          name: res,
          field: res,
          type: 'string',
          status: true,
          format: {}
        }
      })
    })

    // 导入字段按钮 change 事件
    const change = (item) => (value) => {
      item.status = value
    }

    const saveMapping = () => {
      const newColumns = state.columns.filter((item) => item.status)

      return newColumns
    }

    return {
      state,
      mappingType,
      change,
      saveMapping,
      isOpen
    }
  }
}
</script>

<style lang="less" scoped>
.mapping-list {
  padding: 10px;
  .mapping-list-item {
    padding-left: 8px;
    margin-bottom: 10px;

    .item-title {
      margin-bottom: 10px;
      span {
        display: inline-block;
        color: var(--te-datasource-toolbar-breadcrumb-text-color);
      }
      .dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--te-datasource-common-border-color-success);
        margin-right: 8px;
        line-height: 16px;
      }
    }

    .item-body {
      display: grid;
      align-items: center;
      grid-template-columns: 1fr 2.5fr 2.5fr 1.5fr;
      column-gap: 10px;
      :deep(.tiny-input .tiny-input__inner) {
        color: var(--te-datasource-toolbar-breadcrumb-text-color);
      }

      .tip {
        color: var(--te-datasource-toolbar-breadcrumb-text-color);
        padding-left: 3px;
        font-size: 12px;
      }
      .open {
        display: flex;
        align-items: center;
      }
    }
  }
}
.mapping-empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 56px;
  .empty-icon {
    width: 80px;
    height: 80px;
  }
  .empty-text {
    font-size: 12px;
    color: var(--te-component-common-text-color-weaken);
  }
}
</style>
