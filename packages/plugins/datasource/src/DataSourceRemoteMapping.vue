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
              <tiny-input v-model="item.title" placeholder="输入相应的 label 名称"></tiny-input>
              <div>
                <tiny-switch v-model="item.status" @change="change(item)"></tiny-switch>
                <span class="tip">启用该字段</span>
              </div>
              <tiny-select
                v-if="item.status"
                v-model="item.type"
                :options="mappingType"
                placeholder="请选择字段输入类型"
                text-field="name"
                value-field="type"
              ></tiny-select>
            </div>
          </div>
        </div>
      </template>
    </plugin-setting>
  </div>
</template>

<script>
import { reactive, watchEffect, ref } from 'vue'
import { Input, Select, Switch } from '@opentiny/vue'
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
    TinySwitch: Switch,
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
        color: var(--ti-lowcode-datasource-toolbar-breadcrumb-color);
      }
      .dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--ti-lowcode-datasource-success-border-color);
        margin-right: 8px;
        line-height: 16px;
      }
    }

    .item-body {
      display: grid;
      align-items: center;
      grid-template-columns: 3fr 1.5fr 3fr;
      column-gap: 10px;
      :deep(.tiny-input .tiny-input__inner) {
        color: var(--ti-lowcode-datasource-toolbar-breadcrumb-color);
      }

      .tip {
        color: var(--ti-lowcode-datasource-toolbar-breadcrumb-color);
        padding-left: 3px;
        font-size: 12px;
      }
    }
  }
}
</style>
