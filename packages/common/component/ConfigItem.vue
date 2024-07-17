<template>
  <div
    v-if="!property.hidden"
    :key="property"
    :style="{ width: property.cols / 0.12 + '%' }"
    :class="[
      'properties-item',
      {
        active: property === currentProperty
      }
    ]"
  >
    <div :class="['item-warp', labelPosition, property.className, { multiType }]">
      <div v-if="showLabel" :class="['item-label', { linked: isLinked }]">
        <tiny-popover
          placement="top"
          title=""
          trigger="hover"
          popper-class="prop-label-tips-container"
          :open-delay="500"
          :disabled="!propDescription || propDescription === propLabel"
        >
          <div class="prop-content">
            <div class="prop-title">{{ property.property }}</div>
            <div class="prop-description">
              {{ propDescription }}
            </div>
          </div>
          <template #reference>
            <div>
              <div :class="[{ 'pro-underline': propDescription && propDescription !== propLabel }]">
                <span>{{ propLabel }}</span>
              </div>
            </div>
          </template>
        </tiny-popover>
      </div>
      <div class="item-input">
        <slot name="prefix"></slot>
        <div
          :class="[
            'widget',
            {
              'verify-failed': verification.failed
            }
          ]"
        >
          <div v-if="showBindState" class="binding-state text-ellipsis-multiple">
            {{ '已绑定：' + widget.props.modelValue?.value }}
          </div>
          <component
            v-else
            :is="component"
            v-show="!hidden"
            v-bind="widget.props"
            :model-value="bindValue"
            :language="currentLanguage"
            :meta="property"
            :label="propLabel"
            :metaComponents="metaComponents"
            @update:modelValue="onModelUpdate"
            @focus="handleFocus"
            @blur="handleBlur"
          ></component>
          <div v-if="showErrorPopup" class="error-tips-container">
            <svg-icon name="notify-failure" class="error-icon"></svg-icon>
            <span class="error-desc">{{ verification.message }}</span>
          </div>
        </div>

        <div class="action-icon">
          <slot name="suffix"></slot>
          <component
            :is="CodeConfigurator"
            v-if="showCodeEditIcon"
            ref="editorModalRef"
            v-bind="widget.props"
            :model-value="bindValue"
            :meta="property"
            :label="propLabel"
            language="json"
            @update:modelValue="onModelUpdate"
          >
            <template #default>
              <tiny-tooltip class="item" effect="dark" content="源码编辑" placement="left">
                <icon-writing class="code-icon" @click="editorModalRef?.open && editorModalRef.open()"></icon-writing>
              </tiny-tooltip>
            </template>
          </component>
          <component
            :is="VariableConfigurator"
            v-if="isTopLayer && !onlyEdit && property.bindState !== false && !isRelatedComponents(widget.component)"
            :model-value="widget.props.modelValue"
            :name="widget.props.name"
            @update:modelValue="onModelUpdate"
          ></component>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject, computed, watch, ref, reactive, provide } from 'vue'
import { Popover, Tooltip } from '@opentiny/vue'
import { IconWriting, IconHelpCircle, IconPlusCircle } from '@opentiny/vue-icon'
import { typeOf } from '@opentiny/vue-renderless/common/type'
import {
  useHistory,
  useProperties,
  useMaterial,
  useLayout,
  useCanvas,
  getConfigurator
} from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'
import i18n from '../js/i18n'
import MultiTypeSelector from './MultiTypeSelector.vue'
import { SCHEMA_DATA_TYPE, PAGE_STATUS, TYPES } from '../js/constants'

const { parseFunction: generateFunction } = utils

const hasRule = (required, rules) => {
  if (required) {
    return true
  }
  return Array.isArray(rules) && rules.length > 0
}

export default {
  components: {
    MultiTypeSelector,
    TinyPopover: Popover,
    TinyTooltip: Tooltip,
    IconWriting: IconWriting(),
    IconPlusCircle: IconPlusCircle(),
    IconHelpCircle: IconHelpCircle()
  },
  props: {
    properties: {
      type: [Array, Object],
      default: () => []
    },
    property: {
      type: Object,
      default: () => ({})
    },
    isTopLayer: {
      type: Boolean,
      default: false
    },
    onlyEdit: {
      type: Boolean,
      default: false
    },
    group: {
      type: Object,
      default: () => ({})
    },
    metaComponents: {
      type: Object,
      default: () => ({})
    },
    showMessageError: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const CodeConfigurator = getConfigurator('CodeConfigurator')
    const VariableConfigurator = getConfigurator('VariableConfigurator')

    const { t, locale } = i18n.global

    const verification = reactive({
      failed: false,
      message: '',
      hasRule: computed(() => hasRule(props.property?.required, props.property?.rules))
    })
    const editorModalRef = ref(null)
    const currentProperty = inject('currentProperty', null)
    const propsObj = inject('propsObj', null)
    const required = computed(() => props.property?.required || false)

    const hidden = computed(() => props.hidden)
    const widget = computed(() => props.property?.widget || {})
    const propLabel = computed(
      () => props.property.property || props.property?.label?.text?.[locale.value] || props.property?.label?.text
    )
    const multiType = computed(() => Array.isArray(widget.value.component))
    const isBindingState = ref(false) // 当前是否是绑定到状态变量state
    const showCodeEditIcon = computed(
      () =>
        props.isTopLayer &&
        isBindingState.value === false &&
        (multiType.value || ['array', 'object'].includes(props.property.type))
    )
    const showLabel = computed(
      () =>
        !props.onlyEdit &&
        propLabel.value &&
        (isBindingState.value ||
          !['GroupItemConfigurator', 'ArrayItemConfigurator', 'RelatedColumnsConfigurator'].includes(
            widget.value.component
          )) &&
        !multiType.value
    )
    const propDescription = computed(
      () =>
        (props.property?.description?.[locale.value] ?? props.property?.description) ||
        (props.property?.label?.text?.[locale.value] ?? props.property?.label?.text)
    )
    const isLinked = computed(() => Boolean(props.property.linked))
    const component = computed(() => {
      // TODO: 需要弄清楚 props.metaComponents[widget.value.component] 是什么场景
      return multiType.value
        ? MultiTypeSelector
        : getConfigurator(widget.value.component) ||
            props.metaComponents[widget.value.component] ||
            getConfigurator('InputConfigurator')
    })
    const bindValue = computed(() => {
      let value = props.property?.widget?.props?.modelValue

      if (value === null || value === undefined) {
        const defaultValue = props.property?.defaultValue
        value = defaultValue?.[locale.value] ?? defaultValue
      }

      if (value?.componentName === 'Icon') {
        value = value.props.name
      }

      return value
    })

    const currentLanguage = computed(() => {
      const language = props.property?.widget?.props?.language
      const defaultLanguage =
        props.property?.description?.zh_CN === '分页配置' || props.property?.type === 'Object' ? 'json' : 'javascript'

      return language || defaultLanguage
    })

    const labelPosition = computed(() => {
      if (props.property.labelPosition) {
        return props.property.labelPosition
      }

      if (['SwitchConfigurator', 'SwitchConfigurator'].includes(props.property.widget?.component)) {
        return 'left'
      }

      return 'top'
    })

    const updateValue = (value) => {
      const { property, type } = props.property
      const { setProp } = useProperties()

      // 是否双向绑定
      if (value?.type === SCHEMA_DATA_TYPE.JSExpression) {
        const currentComponent = useProperties().getSchema().componentName
        const {
          schema: { events = {} }
        } = useMaterial().getMaterial(currentComponent)

        if (Object.keys(events).includes(`onUpdate:${property}`)) {
          // 默认情况下，v-model 在组件上都是使用 modelValue 作为 prop，并以 update:modelValue 作为对应的事件。
          // 支持指定参数的 v-model，如：`v-model:visible`，如果组件使用的是除 modelValue 之外的其它参数，则将该参数显式声明为 prop
          const model = property === 'modelValue' ? true : { prop: property }
          value = { ...value, model }
        }
      }

      if (property === 'children') {
        useProperties().getSchema().children = value
      } else {
        if (
          !useCanvas().isSaved() &&
          ![PAGE_STATUS.Guest, PAGE_STATUS.Occupy].includes(useLayout().layoutState.pageStatus.state)
        ) {
          return
        }

        if (
          property !== 'name' &&
          ['SelectIconConfigurator', 'SelectIconConfigurator'].includes(props.property.widget.component)
        ) {
          // icon以组件形式传入，实现类似:icon="IconPlus"的图标配置（排除Icon组件本身）
          value = {
            componentName: 'Icon',
            props: {
              name: value
            }
          }
        }

        if (props.isTopLayer) {
          setProp(property, value, type)
        }
      }

      useHistory().addHistory()
    }

    const setVerifyFailed = (result, message) => {
      result.failed = true
      result.message = typeof message === 'string' ? message : message?.[locale.value]
    }

    const verifyRequired = (value) => {
      if (typeOf(value) === TYPES.BooleanType) {
        return true
      }

      if (typeOf(value) === TYPES.StringType) {
        return value.trim()
      }

      return value
    }

    const verifyValue = (value = '', rules = []) => {
      const result = {
        failed: false,
        message: ''
      }

      if (!hasRule(props.property?.required, props.property?.rules)) {
        return result
      }

      if (required.value && !verifyRequired(value)) {
        setVerifyFailed(result, t('common.required'))

        return result
      }

      const length = rules.length
      const { getProp } = useProperties()

      for (let i = 0; i < length; i++) {
        const rule = rules[i]
        if (rule.required && !verifyRequired(value)) {
          setVerifyFailed(result, rule.message)
          return result
        }
        if (rule.pattern) {
          const reg = new RegExp(rule.pattern)

          if (!reg.test(value)) {
            setVerifyFailed(result, rule.message)
            break
          }
        } else if (rule.validator) {
          try {
            const fn = generateFunction(rule.validator, {
              props: {
                value
              },
              getProp
            })

            if (!fn(rule, value)) {
              setVerifyFailed(result, rule.message)
              break
            }
          } catch (error) {
            const printer = console
            printer.log(error)
          }
        }
      }

      return result
    }

    const executeRelationAction = (value, preValue) => {
      const { onChange, rules } = props.property
      const { setProp, delProp } = useProperties()

      // 关联
      if (onChange && propsObj) {
        try {
          const fun = generateFunction(onChange, {
            ...propsObj.value,
            config: {
              ...widget.value?.props
            },
            setProp: setProp,
            delProp
          })
          fun(value, preValue)
        } catch (error) {
          const printer = console
          printer.log(error)
        }
      }

      // 校验
      Object.assign(verification, verifyValue(value, rules))
    }

    const onModelUpdate = (data, shouldUpdate = true) => {
      const preValue = bindValue.value
      widget.value.props.modelValue = data
      emit('update:modelValue', data)
      if (!shouldUpdate) {
        return
      }
      updateValue(data)
      executeRelationAction(data, preValue)
    }

    const parentPath = inject('path', '')
    const parentData = inject('data', null)
    provide('path', `${parentPath ? parentPath + '.' : ''}${props.property.property}`)
    provide('data', useProperties().getSchema())

    watch(
      () => bindValue.value,
      (value) => {
        isBindingState.value = value?.type === SCHEMA_DATA_TYPE.JSExpression
      },
      {
        immediate: true
      }
    )

    const showErrorPopup = ref(false)

    let isFocus = ref(false)

    watch(
      () => [verification.failed, isFocus.value],
      () => {
        if (!verification.failed) {
          showErrorPopup.value = false
          return
        }

        showErrorPopup.value = true
      }
    )

    const handleFocus = () => {
      isFocus.value = true
    }

    const handleBlur = () => {
      isFocus.value = false
      const onBlur = props.property?.onBlur
      if (onBlur) {
        try {
          const fun = generateFunction(onBlur, {})
          fun(bindValue.value)
        } catch (error) {
          /* empty */
        }
      }
    }

    const isRelatedComponents = (component) =>
      ['RelatedEditorConfigurator', 'RelatedColumnsConfigurator'].includes(component)

    const showBindState = computed(
      () => !props.onlyEdit && (isBindingState.value || isLinked.value) && !isRelatedComponents(widget.value.component)
    )

    return {
      CodeConfigurator,
      VariableConfigurator,
      verification,
      showCodeEditIcon,
      editorModalRef,
      isBindingState,
      component,
      hidden,
      widget,
      required,
      isLinked,
      propLabel,
      showLabel,
      multiType,
      propDescription,
      bindValue,
      currentProperty,
      showBindState,
      onModelUpdate,
      parentData,
      currentLanguage,
      showErrorPopup,
      handleFocus,
      handleBlur,
      isFocus,
      isRelatedComponents,
      labelPosition
    }
  }
}
</script>

<style lang="less" scoped>
.sensitive-tip {
  width: 50px;
  position: absolute;
}
.properties-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  position: relative;
  align-items: center;
  &.active {
    background: var(--ti-lowcode-meta-config-item-active-bg);
  }

  .item-label {
    width: 30%;
    color: var(--ti-lowcode-meta-config-item-label-color);
    font-size: 12px;
    display: flex;
    margin-right: 5px;
    line-height: 18px;
  }

  .linked {
    background-color: var(--ti-lowcode-meta-config-item-link-color);
  }

  .item-input {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    overflow: hidden;
    &:has(.verify-failed) {
      align-items: flex-start;
    }
    .widget {
      flex: 1;
      padding: 1px;
      overflow: hidden;

      .binding-state {
        color: var(--ti-lowcode-meta-config-item-bind-color);
        background: var(--ti-lowcode-meta-config-item-bind-bg);
        padding: 4px 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        border-radius: 6px;
      }
      &:has(.tiny-switch) {
        text-align: right;
      }
      &.verify-failed {
        :deep(.tiny-input .tiny-input__inner) {
          &,
          &:focus {
            border-color: var(--ti-lowcode-input-error-color);
            background-color: var(--ti-lowcode-input-error-bg);
          }
        }
        :deep(.tiny-textarea__inner) {
          &,
          &:focus {
            background-color: var(--ti-lowcode-input-error-bg);
          }
        }
        :deep(.tiny-textarea) {
          &,
          &:focus {
            border-color: var(--ti-lowcode-input-error-color);
            background-color: var(--ti-lowcode-input-error-bg);
          }
        }
      }
      .widget-popover {
        display: inline-block;
        width: 100%;
      }
    }
    .action-icon {
      display: flex;
      align-items: center;
      .code-icon {
        font-size: 16px;
      }
    }
    :deep(.tiny-input__inner) {
      padding-right: 6px;
      padding-left: 4px;
    }
    :deep(.tiny-select .tiny-input__inner) {
      padding-right: 26px;
    }
  }

  .prop-description {
    margin-top: 8px;
    color: var(--ti-lowcode-common-text-desc-color);
  }
  .label-tip {
    padding: 2px 0;
  }

  .help-icon {
    margin-left: 3px;
    cursor: help;
    width: 14px;
    height: 14px;
  }

  .item-warp {
    display: flex;
    width: 100%;
    align-items: center;
    padding: 6px 0;
    .pro-underline {
      border-bottom: 1px dashed transparent;
      &:hover {
        border-bottom: 1px dashed;
      }
    }
    &.multiType {
      border-bottom: 1px solid var(--ti-lowcode-toolbar-active-bg);
      border-top: 1px solid var(--ti-lowcode-toolbar-active-bg);
    }
    &.top,
    &.bottom {
      flex-direction: column;
      .item-label {
        width: 100%;
        text-align: center;
      }
      .item-input {
        width: 100%;
        display: flex;
      }
    }
    &.top {
      flex-direction: column;
      align-items: flex-start;
      .item-label {
        margin-bottom: 8px;
      }
    }
    &.bottom {
      flex-direction: column-reverse;
    }
    &.none {
      .item-label {
        display: none;
      }
    }
  }
  .error-tips {
    margin: 0;
    display: flex;
    align-items: center;
    margin-top: 8px;
    color: var(--ti-lowcode-common-error-color);
    font-size: 12px;
    .failure-icon {
      width: 16px;
      height: 16px;
    }
    .error-desc {
      margin-left: 4px;
    }
  }
}

.error-tips-container {
  padding: 4px 6px;
  color: var(--ti-lowcode-meta-config-item-error-tips-color);
  .error-icon {
    flex-shrink: 0;
  }
  .error-desc {
    margin-left: 4px;
  }
}
</style>

<style lang="less">
.tiny-popover.tiny-popper {
  &.prop-label-tips-container {
    .prop-content {
      margin: 6px;
      max-width: 224px;

      .prop-title {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 8px;
        color: var(--ti-lowcode-meta-config-item-label-tips-title-color);
      }
      .prop-description {
        font-size: 12px;
        color: var(--ti-lowcode-meta-config-item-label-tips-desc-color);
        line-height: 18px;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 5;
        overflow-y: auto;
      }
    }
  }
}
</style>
