<template>
  <div>
    <plugin-setting title="字段配置" :isSecond="true" @cancel="closeMapping" @save="saveMapping">
      <template #content>
        <div class="mapping-list">
          <div v-for="item in state.columns" :key="item.id" class="mapping-list-item">
            <div class="item-title">
              <span class="dot"></span>
              <span>{{ item.name }}</span>
            </div>
            <div class="item-body">
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
      </template>
    </plugin-setting>
  </div>
</template>

<script>
import { reactive, watchEffect, ref } from 'vue'
import { Input, Select, Checkbox } from '@opentiny/vue'
import { PluginSetting } from '@opentiny/tiny-engine-common'
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
    TinySelect: Select,
    TinyInput: Input,
    TinyCheckbox: Checkbox,
    PluginSetting
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
  setup(props, { emit }) {
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
      emit('update:modelValue', newColumns)

      close()
    }

    const closeMapping = () => {
      close()
    }

    return {
      state,
      mappingType,
      closeMapping,
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
      grid-template-columns: 3fr 3fr 1.5fr;
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
</style>
