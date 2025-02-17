<template>
  <div class="style-editor">
    <div class="line-style">
      <span class="line-text"> 行内样式 </span>
      <div class="inline-style">
        <component
          :is="CodeConfigurator"
          v-if="state.lineStyleDisable"
          :buttonShowContent="true"
          :modelValue="state.styleContent"
          title="编辑行内样式"
          :button-text="state.inlineBtnText"
          language="css"
          single
          @save="save"
        ></component>
        <div v-if="!state.lineStyleDisable">
          <tiny-input v-model="state.propertiesList" class="inline-bind-style"> </tiny-input>
        </div>
        <component
          :is="VariableConfigurator"
          ref="bindVariable"
          :model-value="state.bindModelValue"
          name="advance"
          @update:modelValue="setConfig"
        >
        </component>
      </div>
    </div>
  </div>
  <class-names-container></class-names-container>
  <tiny-collapse v-model="activeNames" @change="handoverGroup">
    <tiny-collapse-item title="布局" name="layout">
      <layout-group :display="state.style.display" @update="updateStyle" />
      <flex-box v-if="state.style.display === 'flex'" :style="state.style" @update="updateStyle"></flex-box>
      <grid-box v-if="state.style.display === 'grid'" :style="state.style" @update="updateStyle"></grid-box>
    </tiny-collapse-item>

    <tiny-collapse-item title="间距" name="spacing">
      <spacing-group :style="state.style" @update="updateStyle" />
    </tiny-collapse-item>

    <tiny-collapse-item title="尺寸" name="size">
      <size-group :style="state.style" @update="updateStyle" />
    </tiny-collapse-item>

    <tiny-collapse-item title="定位" name="position">
      <position-group :style="state.style" @update="updateStyle" />
    </tiny-collapse-item>

    <tiny-collapse-item title="文本" name="typography">
      <typography-group :style="state.style" @update="updateStyle" />
    </tiny-collapse-item>

    <tiny-collapse-item title="背景" name="backgrounds">
      <background-group :style="state.style" @update="updateStyle" />
    </tiny-collapse-item>

    <tiny-collapse-item title="边框" name="borders">
      <border-group :style="state.style" @update="updateStyle" />
    </tiny-collapse-item>

    <tiny-collapse-item title="效果" name="effects" class="effects-style">
      <effect-group :style="state.style" @update="updateStyle" />
    </tiny-collapse-item>
  </tiny-collapse>
</template>

<script>
import { watch, inject, ref } from 'vue'
import { Collapse, CollapseItem, Input } from '@opentiny/vue'
import { useHistory, useCanvas, useProperties, getConfigurator } from '@opentiny/tiny-engine-meta-register'
import {
  SizeGroup,
  LayoutGroup,
  FlexBox,
  GridBox,
  PositionGroup,
  BorderGroup,
  SpacingGroup,
  BackgroundGroup,
  EffectGroup,
  TypographyGroup,
  ClassNamesContainer
} from './components'
import { CSS_TYPE } from './js/cssType'
import useStyle from './js/useStyle'
import { styleStrRemoveRoot } from './js/cssConvert'

export default {
  components: {
    SizeGroup,
    LayoutGroup,
    FlexBox,
    GridBox,
    PositionGroup,
    BorderGroup,
    SpacingGroup,
    BackgroundGroup,
    TypographyGroup,
    EffectGroup,
    ClassNamesContainer,
    TinyCollapse: Collapse,
    TinyCollapseItem: CollapseItem,
    TinyInput: Input
  },
  setup() {
    const CodeConfigurator = getConfigurator('CodeConfigurator')
    const VariableConfigurator = getConfigurator('VariableConfigurator')
    const styleCategoryGroup = [
      'layout',
      'spacing',
      'size',
      'position',
      'typography',
      'backgrounds',
      'borders',
      'effects'
    ]
    const isCollapsed = inject('isCollapsed')
    const activeNames = ref(styleCategoryGroup)
    const { getCurrentSchema } = useCanvas()
    // 获取当前节点 style 对象
    const { state, updateStyle } = useStyle() // updateStyle
    const { addHistory } = useHistory()
    const { getSchema, setProp } = useProperties()

    const handoverGroup = (actives) => {
      if (isCollapsed.value) {
        activeNames.value = actives.length > 1 ? actives.shift() : actives
      }
    }

    const updateStyleToSchema = (value) => {
      const schema = getSchema()

      if (schema) {
        setProp('style', value)

        return
      }

      const { getSchema: getCanvasPageSchema, updateSchema } = useCanvas()
      const pageSchema = getCanvasPageSchema()

      // TODO: 当 style 为空时，支持移除 style key
      updateSchema({ props: { ...(pageSchema.props || {}), style: value } })
    }

    // 保存编辑器内容，并回写到 schema
    const save = ({ content }) => {
      const { updateRect } = useCanvas().canvasApi.value
      const styleString = styleStrRemoveRoot(content)

      state.styleContent = content

      updateStyleToSchema(styleString)

      addHistory()
      updateRect()
    }

    const setConfig = (value) => {
      const { updateRect } = useCanvas().canvasApi.value

      if (value !== '') {
        updateStyleToSchema(value)
        state.propertiesList = `已绑定：${value.value}`
        state.lineStyleDisable = false
        addHistory()
      } else {
        updateStyleToSchema('')
        state.propertiesList = '编辑行内样式'
        state.lineStyleDisable = true
        addHistory()
      }

      updateRect()
    }

    watch(
      () => getCurrentSchema(),
      (val) => {
        if (val?.props?.style?.value) {
          state.lineStyleDisable = false
          state.propertiesList = `已绑定：${val.props.style?.value}`
          state.bindModelValue = val.props.style
        } else {
          state.lineStyleDisable = true
          state.propertiesList = '编辑行内样式'
          state.bindModelValue = null
        }
      },
      {
        deep: true
      }
    )

    watch(
      () => isCollapsed.value,
      () => {
        if (isCollapsed.value) {
          activeNames.value = []
        } else {
          activeNames.value = styleCategoryGroup
        }
      }
    )

    return {
      CodeConfigurator,
      VariableConfigurator,
      state,
      activeNames,
      CSS_TYPE,
      open,
      handoverGroup,
      save,
      close,
      updateStyle,
      setConfig,
      isCollapsed
    }
  }
}
</script>

<style lang="less" scoped>
.style-editor {
  justify-content: space-around;
  padding: 12px 0 0;
  column-gap: 8px;
  .line-style {
    padding: 0 8px 0 12px;
    display: block;
    font-size: 12px;
    .line-text {
      display: block;
      margin-bottom: 8px;
      font-size: 12px;
      color: var(--te-styles-common-text-color-secondary);
    }
  }
  .inline-style {
    display: flex;
    align-items: center;
    :deep(.editor-wrap) {
      display: flex;
      .tiny-button {
        padding: 0 16px;
        border-radius: 8px;
        width: 216px;
        text-align: left;
        color: var(--te-styles-common-text-color-primary);
      }
      .tiny-button:hover {
        background: none;
        border-color: var(--te-styles-common-border-color);
      }
    }
    .inline-bind-style {
      :deep(.tiny-input__inner) {
        width: 216px;
        pointer-events: none;
        background: var(--te-styles-editor-bg-color);
        color: var(--te-styles-editor-font-text-color);
        border-color: var(--te-styles-editor-border-color);
      }
    }
  }
}

.dots {
  display: inline-block;
  margin-left: 4px;
  vertical-align: middle;
  border: 2px solid var(--te-styles-editor-border-color);
  border-radius: 2px;
}
</style>
