<template>
  <div class="property-setting-container">
    <div class="property-title" @click="handleCancelEdit">
      <icon-chevron-left></icon-chevron-left>
      {{ propertyName }}
    </div>
    <tiny-form class="property-form" label-position="left" label-width="110px">
      <tiny-form-item label="属性名(ID)">
        <tiny-input v-model="propertyName"></tiny-input>
      </tiny-form-item>
      <tiny-form-item label="属性值类型">
        <tiny-select v-model="type" :options="typeList" @change="changeType"></tiny-select>
      </tiny-form-item>
      <tiny-form-item label="属性面板组件">
        <tiny-select
          v-model="widgetComponent"
          :options="widgetComponentList"
          @change="handleChangeWidgetComponent"
        ></tiny-select>
        <div class="global-desc-info">
          区块发布后使用当前区块时，会在属性面板中使用当前选择的组件（例如SelectConfigurator），来配置该属性
        </div>
      </tiny-form-item>
      <tiny-form-item label="属性面板组件属性">
        <meta-code-editor
          :modelValue="widgetProps"
          title="属性面板组件属性"
          button-text="设置"
          language="json"
          :tips="componentPropsTips"
          @save="handleSaveWidgetProps"
        >
        </meta-code-editor>
      </tiny-form-item>
      <tiny-form-item v-if="showArrayItemConfig" label="配置项">
        <meta-list-items class="config-list" :optionsList="arrayConfig">
          <template #content="{ data }">
            <div :class="{ 'item-text': true }">
              {{ data?.property }}
            </div>
          </template>
          <template #operate="{ data }">
            <div class="operate-right-container">
              <tiny-tooltip class="item" effect="light" content="编辑" placement="top">
                <span class="item-icon" @click.stop="handleEdit(data)">
                  <svg-icon name="to-edit"></svg-icon>
                </span>
              </tiny-tooltip>
              <tiny-tooltip class="item" effect="light" content="删除" placement="top">
                <span class="item-icon" @click="del(data)">
                  <svg-icon name="delete"></svg-icon>
                </span>
              </tiny-tooltip>
            </div>
          </template>
        </meta-list-items>
        <span class="add-item-btn" @click="handleAddItem">
          <icon-plus-circle class="icon"></icon-plus-circle>
          <span class="text">添加一项</span>
        </span>
        <teleport to=".block-manage">
          <div v-if="showPropertyConfigItem" class="config-item-container" @click.stop>
            <div v-for="(data, idx) in itemConfig" :key="idx" class="meta-config-item">
              <config-item
                :key="idx"
                :property="data"
                :data-prop-index="idx"
                :data-group-index="index"
                @update:modelValue="handleConfigItemChange(data.property, $event)"
              >
                <slot name="prefix" :data="data"></slot>
                <slot name="suffix" :data="data"></slot>
              </config-item>
            </div>
          </div>
        </teleport>
      </tiny-form-item>
      <tiny-form-item label="默认值">
        <config-item
          :property="defaultValueProperty"
          :onlyEdit="true"
          @update:modelValue="updateDefaultValue"
        ></config-item>
      </tiny-form-item>
      <tiny-form-item label="属性显示名">
        <tiny-input v-model="label"></tiny-input>
      </tiny-form-item>
      <tiny-form-item label="获取属性值">
        <meta-code-editor
          :modelValue="getterValue"
          title="获取属性值"
          button-text="getter"
          language="javascript"
          single
          @save="(...args) => saveAccessor('getter', ...args)"
        ></meta-code-editor>
      </tiny-form-item>
      <tiny-form-item label="设置属性值">
        <meta-code-editor
          :modelValue="setterValue"
          title="设置属性值"
          button-text="setter"
          language="javascript"
          single
          @save="(...args) => saveAccessor('setter', ...args)"
        ></meta-code-editor>
      </tiny-form-item>
      <div v-if="property.linked" class="linked-info">
        链接到组件: {{ property.linked.componentName }} 属性: {{ property.linked.property }}
      </div>
    </tiny-form>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue'
import {
  Input as TinyInput,
  Form as TinyForm,
  FormItem as TinyFormItem,
  Select as TinySelect,
  Tooltip as TinyTooltip
} from '@opentiny/vue'
import { iconChevronLeft, iconPlusCircle } from '@opentiny/vue-icon'
import { ConfigItem, MetaListItems, MetaCodeEditor } from '@opentiny/tiny-engine-common'
import { getEditProperty, DEFAULT_ARRAY_CONFIG, META_COMPONENTS_ENUM } from './js/blockSetting'
import {
  itemConfig,
  arrayConfig,
  showArrayItemConfig,
  type,
  label,
  propertyName,
  widgetComponent,
  saveAccessor,
  handleConfigItemChange,
  handleAddItem,
  del,
  handleSaveWidgetProps,
  updateDefaultValue,
  handleChangeWidgetComponent,
  handleEdit,
  handleCancelEdit,
  changeType,
  widgetComponentList,
  typeList,
  showPropertyConfigItem
} from './js/blockPropertyForm'

export default {
  components: {
    TinyForm,
    TinyInput,
    TinySelect,
    TinyFormItem,
    ConfigItem,
    MetaCodeEditor,
    IconChevronLeft: iconChevronLeft(),
    IconPlusCircle: iconPlusCircle(),
    MetaListItems,
    TinyTooltip
  },
  setup() {
    const property = computed(() => getEditProperty() || {})
    const getterValue = computed(() => property.value?.accessor?.getter?.value || 'function getter() {}')
    const setterValue = computed(() => property.value?.accessor?.setter?.value || 'function setter() {}')
    const defaultValueProperty = ref({
      ...property.value,
      widget: {
        props: {
          ...property.value.widget.props
        },
        component:
          property.value.widget.component === META_COMPONENTS_ENUM.ArrayItemConfigurator
            ? META_COMPONENTS_ENUM.CodeConfigurator
            : property.value.widget.component
      }
    })

    const componentPropsTips = ref({
      title: '该选项用于配置，当前选择的属性面板组件，其对应的props参数',
      demo: '例如SelectConfigurator的props参数可以是 { options: [{ "label": "xx", "value": "xx"}, ...] }'
    })
    watch(
      () => getEditProperty(),
      (property) => {
        if (!property) {
          return
        }

        const {
          defaultValue,
          widget: { props, component },
          ...otherProperty
        } = property

        const newDefaultValueProperty = {
          ...otherProperty,
          widget: {
            props: {
              ...props,
              modelValue: defaultValue
            },
            component:
              component === META_COMPONENTS_ENUM.ArrayItemConfigurator
                ? META_COMPONENTS_ENUM.CodeConfigurator
                : component
          }
        }

        Object.assign(defaultValueProperty.value, newDefaultValueProperty)
      },
      {
        deep: true
      }
    )

    const widgetProps = computed(() => property.value?.widget?.props || {})

    return {
      type,
      label,
      property,
      typeList,
      getterValue,
      setterValue,
      propertyName,
      changeType,
      saveAccessor,
      updateDefaultValue,
      handleCancelEdit,
      widgetProps,
      handleSaveWidgetProps,
      widgetComponent,
      widgetComponentList,
      handleChangeWidgetComponent,
      arrayConfig,
      DEFAULT_ARRAY_CONFIG,
      handleEdit,
      del,
      handleAddItem,
      showPropertyConfigItem,
      handleConfigItemChange,
      itemConfig,
      defaultValueProperty,
      showArrayItemConfig,
      componentPropsTips
    }
  }
}
</script>

<style lang="less" scoped>
.property-setting-container {
  padding: 12px 15px;
}

.property-title {
  margin-bottom: 12px;
  cursor: pointer;
  fill: currentcolor;
}

.property-form {
  :deep(.tiny-form-item__label) {
    font-size: 12px;
  }
}

.add-item-btn {
  display: inline-block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--te-block-property-add-item-text-color);
  cursor: pointer;

  .text {
    margin-left: 4px;
  }
}

.linked-info {
  margin-top: 10px;
  padding: 15px 0px;
}

.handle {
  display: flex;
  align-items: center;
  margin: 10px 0;
}

.config-item-container {
  position: absolute;
  right: calc(-280px - var(--base-collection-panel-width));
  top: 0;
  width: 280px;
  height: 100%;
  padding: 20px;
  background-color: var(--te-block-property-config-item-bg-color);
  border-right: 1px solid var(--te-block-property-config-item-border-color);
}

.config-list {
  :deep(.operate-right-container) {
    .item-icon {
      cursor: pointer;
      padding: 2px;
    }

    .item + .item {
      margin-left: 8px;
    }
  }
}
</style>
