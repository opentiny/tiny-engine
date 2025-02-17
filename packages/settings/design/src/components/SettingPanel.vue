<template>
  <div class="properties-wrap setting-panel">
    <template v-if="store?.currentEditGroupInfo">
      <h5>分组信息</h5>
      <div>
        <span class="label">分组名称</span>
        <tiny-input v-model="store.currentEditGroupInfo.label.zh_CN"></tiny-input>
      </div>
      <div>
        <span class="label">分组描述</span>
        <tiny-input v-model="store.currentEditGroupInfo.description.zh_CN"></tiny-input>
      </div>
    </template>

    <template v-if="store.currentProperty?.label?.text">
      <h5>属性配置</h5>
      <div>
        <span class="label">属性名</span>
        <tiny-input v-model="store.currentProperty.property" disabled></tiny-input>
      </div>
      <div>
        <span class="label">属性名称</span>
        <tiny-input v-model="store.currentProperty.label.text.zh_CN"></tiny-input>
      </div>
      <div>
        <span class="label">属性类型</span>
        <tiny-select
          v-model="store.currentProperty.type"
          :options="META_TYPES_OPTIONS"
          @change="handleTypeChange"
        ></tiny-select>
      </div>
      <div>
        <span class="label">属性描述</span>
        <tiny-input v-model="store.currentProperty.description.zh_CN"></tiny-input>
      </div>
      <div>
        <span class="label">布局</span>
        <tiny-radio-group v-model="store.currentProperty.cols" class="setting-radio-group" size="mini">
          <tiny-radio-button :label="4"></tiny-radio-button>
          <tiny-radio-button :label="6"></tiny-radio-button>
          <tiny-radio-button :label="12"></tiny-radio-button>
        </tiny-radio-group>
      </div>
      <div>
        <span class="label">提示位置</span>
        <tiny-radio-group
          v-model="store.currentProperty.labelPosition"
          class="setting-radio-group setting-layout"
          size="mini"
        >
          <tiny-radio-button label="top"></tiny-radio-button>
          <tiny-radio-button label="left"></tiny-radio-button>
          <tiny-radio-button label="bottom"></tiny-radio-button>
          <tiny-radio-button label="none"></tiny-radio-button>
        </tiny-radio-group>
      </div>
      <div>
        <span class="label">是否必填</span>
        <tiny-switch v-model="store.currentProperty.required" class="switch"> </tiny-switch>
      </div>
      <div>
        <span class="label">是否隐藏</span>
        <tiny-switch v-model="store.currentProperty.hidden"> </tiny-switch>
      </div>
      <div>
        <span class="label">使用设备</span>
        <tiny-select v-model="store.currentProperty.device" :options="deviceOptions" multiple> </tiny-select>
      </div>
      <div>
        <span class="label">是否只读</span>
        <tiny-switch v-model="store.currentProperty.readOnly" class="switch"> </tiny-switch>
      </div>
      <div>
        <span class="label">是否禁用</span>
        <tiny-switch v-model="store.currentProperty.disabled" class="switch"> </tiny-switch>
      </div>
      <div>
        <span class="label">渲染组件</span>
        <tiny-select
          v-model="store.currentProperty.widget.component"
          :options="options"
          @change="handleTypeChange"
        ></tiny-select>
      </div>
      <div v-if="showArrayItem">
        <span class="label">配置项</span>
        <div class="form-item array-config-item">
          <meta-list-items :optionsList="list">
            <template #content="{ data }">
              <div :class="{ 'item-text': true }" :title="data?.property" @click="edit(data)">
                {{ `${data?.property?.slice(0, 20)}${data?.property?.length > 20 ? '...' : ''}` }}
              </div>
            </template>
            <template #operate="{ data }">
              <tiny-tooltip class="item operate-tips-item" effect="light" content="编辑" placement="top">
                <span class="item-icon">
                  <svg-icon name="to-edit" @click.stop="handleEdit(data)"></svg-icon>
                </span>
              </tiny-tooltip>
              <tiny-tooltip class="item operate-tips-item" effect="light" content="删除" placement="top">
                <span class="item-icon">
                  <svg-icon name="delete" @click.stop="handleDelete(data)"></svg-icon>
                </span>
              </tiny-tooltip>
            </template>
          </meta-list-items>
          <div class="add-item">
            <icon-plus-circle class="icon"></icon-plus-circle>
            <span @click="handleAddArrItem">添加一项</span>
          </div>
        </div>
      </div>
      <div>
        <span class="label">渲染组件属性</span>
        <tiny-input v-model="propsValue" type="textarea" rows="8" @change="codeChange"> </tiny-input>
      </div>
    </template>
  </div>
</template>

<script>
import { computed, watchEffect, ref } from 'vue'
import { Input, Select, Switch, RadioButton, RadioGroup, Tooltip } from '@opentiny/vue'
import { MetaListItems } from '@opentiny/tiny-engine-common'
import { iconPlusCircle } from '@opentiny/vue-icon'
import store, {
  drawItems,
  META_TYPES_ENUM,
  META_TYPES_OPTIONS,
  META_COMPONENTS,
  DEFAULT_INIT_PROPERTIES
} from '../store'
import { widgetNames } from './widgets'

export default {
  components: {
    TinyInput: Input,
    TinySelect: Select,
    TinySwitch: Switch,
    TinyRadioButton: RadioButton,
    TinyRadioGroup: RadioGroup,
    TinyTooltip: Tooltip,
    MetaListItems,
    IconPlusCircle: iconPlusCircle()
  },
  setup() {
    const haveChild = computed(
      () =>
        store.property?.items ||
        store.property?.properties ||
        store.property?.type === 'array' ||
        store.property?.type === 'object'
    )

    const propsValue = ref('')
    const showArrayItem = ref(false)
    const list = ref([])

    const codeChange = (value) => {
      try {
        store.currentProperty.widget.props = JSON.parse(value)
      } catch (error) {
        // do nothing
      }
    }

    const deviceOptions = [
      { label: 'pc', value: 'pc' },
      { label: 'mobile', value: 'mobile' }
    ]

    const handleTypeChange = () => {
      const shouldShowArrayItem =
        store.currentProperty.type === META_TYPES_ENUM.array &&
        store.currentProperty.widget.component === META_COMPONENTS.ArrayItemConfigurator

      showArrayItem.value = shouldShowArrayItem

      if (shouldShowArrayItem) {
        store.currentProperty.properties = store.currentProperty.properties || DEFAULT_INIT_PROPERTIES
        list.value = store.currentProperty.properties[0].content
      }

      if (!shouldShowArrayItem && store.currentSubConfig) {
        store.currentSubConfig = null
      }
    }

    const handleAddArrItem = () => {
      list.value.push({
        property: 'customProperty',
        type: 'string',
        defaultValue: '',
        label: {
          text: {
            zh_CN: 'customProperty'
          }
        },
        widget: {
          component: 'InputConfigurator',
          props: {}
        }
      })
    }

    const handleEdit = (data) => {
      store.currentSubConfig = data
    }

    const handleDelete = (data) => {
      list.value = list.value.filter((item) => item !== data)
    }

    watchEffect(() => {
      if (!store.currentProperty) {
        return
      }
      if (!store.currentProperty?.description) {
        store.currentProperty.description = { zh_CN: '' }
      }
      propsValue.value = JSON.stringify(store.currentProperty.widget.props, null, 2)
      list.value = store.currentProperty.properties?.[0]?.content || []
      handleTypeChange()
    })

    return {
      drawItems,
      store,
      haveChild,
      options: widgetNames,
      codeChange,
      propsValue,
      deviceOptions,
      META_TYPES_OPTIONS,
      handleTypeChange,
      showArrayItem,
      handleAddArrItem,
      list,
      handleEdit,
      handleDelete
    }
  }
}
</script>

<style lang="less" scoped>
.properties-wrap {
  max-height: var(--max-height);
  overflow-y: auto;
  & > div {
    padding: 10px;
    display: flex;
    justify-content: flex-start;
    .label {
      width: 80px;
      font-size: 12px;
      flex-shrink: 0;
      margin-right: 10px;
      color: #595959;
    }
  }

  h5 {
    font-size: 13px;
    color: #191919;
    margin: 20px 0;
  }
  .array-config-item {
    width: 100%;
    :deep(.list-group) {
      .option-item {
        border-top: 1px solid #dbdbdb;
      }
      .option-item:last-child {
        border-bottom: 1px solid #dbdbdb;
      }
      .item-icon {
        color: #808080;
        fill: currentColor;
      }
      .item-text {
        color: #191919;
      }
    }
    .operate-tips-item + .operate-tips-item {
      margin-left: 8px;
    }
    .add-item {
      cursor: pointer;
      color: #1476ff;
      margin-top: 8px;
      .icon {
        margin-right: 4px;
        fill: currentColor;
      }
    }
  }
  .properties-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    .properties-item {
      width: 100%;
      padding: 8px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .item-label {
        width: 38%;
        word-break: break-all;
        color: #595959;
      }
      .component-wrap {
        flex: 1;
        width: 62%;
        &.item-component {
          width: 100%;
        }

        .bind-dialog-wrap {
          margin-left: 8px;
        }
      }

      .flex-wrap {
        display: flex;
        justify-content: space-between;
        align-items: center;
        & > :deep(.data-source-wrap) {
          width: calc(100% - 24px);
        }
      }
      .nolabel {
        width: 100%;
      }
      &.col-6 {
        width: 50%;
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        .item-label {
          width: auto;
          margin-bottom: 6px;
        }
      }
      &.col-4 {
        width: 33.33%;
        flex-direction: column;
        align-items: flex-start;
        .item-label {
          width: auto;
          margin-bottom: 6px;
        }
      }
    }
  }

  .span-form-item {
    width: 100%;
  }

  :deep(.tiny-collapse-item__content) {
    display: flex;
    flex-wrap: wrap;
  }
  :deep(.tiny-checkbox-group) {
    flex-wrap: wrap;
    width: 100%;
  }
  :deep(.tiny-switch) {
    width: var(--ti-switch-width);
  }
  .setting-radio-group {
    &.setting-layout {
      width: 100%;
    }
    :deep(.tiny-radio-button:not(.is-active)) {
      .tiny-radio-button__inner {
        background-color: #e9edfa;
        border-color: transparent;
        padding: 6px 10px;
        &:hover {
          background-color: #1476ff;
        }
      }
    }
  }
}
</style>
