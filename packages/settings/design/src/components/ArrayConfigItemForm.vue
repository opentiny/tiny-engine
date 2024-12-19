<template>
  <div class="array-item-config-container">
    <div class="config-title-wrap" @click="handleCancelEditArrayItem">
      <icon-chevron-left></icon-chevron-left>
      <span class="config-title">{{ `配置项-${property}` }}</span>
    </div>
    <tiny-form class="config-item-form" label-position="left">
      <tiny-form-item label="显示值">
        <tiny-input v-model="property"></tiny-input>
      </tiny-form-item>
      <tiny-form-item label="值类型">
        <tiny-select
          v-model="store.currentSubConfig.type"
          :options="META_TYPES_OPTIONS"
          @change="changeType"
        ></tiny-select>
      </tiny-form-item>
      <tiny-form-item label="设计器">
        <tiny-select
          v-model="store.currentSubConfig.widget.component"
          :options="widgetNames"
          @change="changeType"
        ></tiny-select>
      </tiny-form-item>
      <tiny-form-item label="属性面板组件属性">
        <code-configurator
          :modelValue="props"
          single
          class="props-editor"
          title="属性面板组件属性"
          button-text="属性面板组件属性"
          language="json"
          @save="handleSaveProps"
        ></code-configurator>
      </tiny-form-item>
      <tiny-form-item label="缺省值">
        <component
          :is="component"
          :modelValue="defaultValue"
          class="default-component"
          @update:modelValue="handleSaveDefaultValue"
        >
        </component>
      </tiny-form-item>
      <tiny-form-item label="描述">
        <tiny-input v-model="label"></tiny-input>
      </tiny-form-item>
    </tiny-form>
  </div>
</template>

<script>
import { computed } from 'vue'
import { Input as TinyInput, Form as TinyForm, FormItem as TinyFormItem, Select as TinySelect } from '@opentiny/vue'
import { ConfigItem } from '@opentiny/tiny-engine-common'
import {
  CodeConfigurator,
  SwitchConfigurator,
  InputConfigurator,
  NumberConfigurator
} from '@opentiny/tiny-engine-configurator'
import { useNotify } from '@opentiny/tiny-engine-meta-register'
import { iconChevronLeft } from '@opentiny/vue-icon'
import store, { META_TYPES_ENUM, META_TYPES_OPTIONS } from '../store'
import { widgetNames } from './widgets'

const f = Function

export default {
  components: {
    TinyForm,
    TinyInput,
    TinySelect,
    TinyFormItem,
    ConfigItem,
    CodeConfigurator,
    IconChevronLeft: iconChevronLeft()
  },
  setup() {
    const property = computed({
      get() {
        return store.currentSubConfig.property
      },
      set(value) {
        store.currentSubConfig.property = value
      }
    })

    const getDefaultValue = (data) => {
      const type = store.currentSubConfig.type
      if (type === META_TYPES_ENUM.string || type === META_TYPES_ENUM.function) {
        return data
      }

      if (type === META_TYPES_ENUM.boolean) {
        return Boolean(data)
      }

      if (type === META_TYPES_ENUM.number) {
        return Number(data)
      }

      let newValue = data

      try {
        newValue = f(`return ${newValue}`)()
      } catch (error) {
        useNotify({
          type: 'error',
          title: '默认值解析错误',
          message: error?.message || '默认值解析错误，请检查'
        })
      }

      if (type === META_TYPES_ENUM.object && typeof newValue === 'object' && newValue !== null) {
        return newValue
      }

      if (type === META_TYPES_ENUM.array && Array.isArray(newValue)) {
        return newValue
      }

      return ''
    }

    const props = computed(() => store.currentSubConfig.widget.props)

    const defaultValue = computed(() => store.currentSubConfig.defaultValue)
    const handleSaveProps = ({ content } = {}) => {
      if (typeof content === 'object' && content !== null) {
        store.currentSubConfig.widget.props = content

        return
      }
      try {
        store.currentSubConfig.widget.props = JSON.parse(content)
      } catch (error) {
        // do nothing
      }
    }

    const label = computed({
      get() {
        return store.currentSubConfig.label.text.zh_CN
      },
      set(value) {
        store.currentSubConfig.label.text.zh_CN = value
      }
    })

    const component = computed(() => {
      const type = store.currentSubConfig.type
      if (['array', 'object', 'function'].includes(type)) {
        return CodeConfigurator
      }

      if (type === 'number') {
        return NumberConfigurator
      }

      if (type === 'boolean') {
        return SwitchConfigurator
      }

      return InputConfigurator
    })

    const handleSaveDefaultValue = (value) => {
      const computedDefaultValue = getDefaultValue(value)
      store.currentSubConfig.defaultValue = computedDefaultValue
    }

    const handleCancelEditArrayItem = () => {
      store.currentSubConfig = null
    }

    return {
      store,
      property,
      props,
      defaultValue,
      handleSaveProps,
      label,
      component,
      handleSaveDefaultValue,
      handleCancelEditArrayItem,
      META_TYPES_OPTIONS,
      widgetNames
    }
  }
}
</script>

<style lang="less" scoped>
.config-title-wrap {
  margin-bottom: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--te-common-text-primary);
  .config-title {
    margin-left: 6px;
  }
}
.config-item-form {
  :deep(.tiny-form-item) {
    .tiny-form-item__label {
      color: var(--te-common-text-secondary);
    }
    .tiny-form-item__content {
      .editor-warp {
        --ti-lowcode-meta-codeEditor-border-color: var(--te-common-text-secondary);
        --ti-lowcode-meta-codeEditor-color: var(--te-common-text-secondary);
      }
    }
  }
}
</style>
