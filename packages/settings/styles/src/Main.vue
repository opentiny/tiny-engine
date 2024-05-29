<template>
  <div class="style-editor">
    <div class="line-style">
      <span class="line-text"> 行内样式 </span>
      <div class="inline-style">
        <meta-code-editor
          v-if="state.lineStyleDisable"
          :buttonShowContent="true"
          :modelValue="state.styleContent"
          title="编辑行内样式"
          :button-text="state.inlineBtnText"
          language="css"
          single
          @save="save"
        />
        <div v-if="!state.lineStyleDisable">
          <tiny-input v-model="state.propertiesList" class="inline-bind-style"> </tiny-input>
        </div>
        <meta-bind-variable
          ref="bindVariable"
          :model-value="state.bindModelValue"
          name="advance"
          @update:modelValue="setConfig"
        >
        </meta-bind-variable>
      </div>
    </div>
  </div>
  <class-names-container></class-names-container>
  <tiny-collapse v-model="activeNames">
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
import { ref, watch } from 'vue'
import { Collapse, CollapseItem, Input } from '@opentiny/vue'
import { useHistory, useCanvas, useProperties } from '@opentiny/tiny-engine-controller'
import { MetaCodeEditor, MetaBindVariable } from '@opentiny/tiny-engine-common'
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
    MetaCodeEditor,
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
    TinyInput: Input,
    MetaBindVariable
  },
  setup() {
    const activeNames = ref([
      'layout',
      'spacing',
      'size',
      'position',
      'typography',
      'backgrounds',
      'borders',
      'effects'
    ])
    const { getCurrentSchema } = useCanvas()
    // 获取当前节点 style 对象
    const { state, updateStyle } = useStyle() // updateStyle
    const { addHistory } = useHistory()
    const { getSchema } = useProperties()

    // 保存编辑器内容，并回写到 schema
    const save = ({ content }) => {
      const { getSchema: getCanvasPageSchema, updateRect } = useCanvas().canvasApi.value
      const pageSchema = getCanvasPageSchema()
      const schema = getSchema() || pageSchema
      const styleString = styleStrRemoveRoot(content)
      const currentSchema = getCurrentSchema() || pageSchema

      state.styleContent = content
      schema.props = schema.props || {}
      schema.props.style = styleString

      currentSchema.props = currentSchema.props || {}

      if (styleString) {
        currentSchema.props.style = styleString
      } else {
        delete currentSchema.props.style
      }

      addHistory()
      updateRect()
    }

    const setConfig = (value) => {
      const { getSchema: getCanvasPageSchema, updateRect } = useCanvas().canvasApi.value
      const pageSchema = getCanvasPageSchema()
      const currentSchema = getCurrentSchema() || pageSchema
      const schema = getSchema() || pageSchema

      if (value !== '') {
        schema.props.style = value
        currentSchema.props.style = value
        state.propertiesList = `已绑定：${value.value}`
        state.lineStyleDisable = false
        addHistory()
      } else {
        schema.props.style = ''
        currentSchema.props.style = ''
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

    return {
      state,
      activeNames,
      CSS_TYPE,
      open,
      save,
      close,
      updateStyle,
      setConfig
    }
  }
}
</script>

<style lang="less" scoped>
.style-editor {
  justify-content: space-around;
  padding: 8px 16px 0;
  column-gap: 8px;
  .line-style {
    display: block;
    color: var(--ti-lowcode-setting-style-font-color);
    font-size: 12px;
    .line-text {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      color: var(--ti-lowcode-setting-style-title-color);
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
        color: var(--ti-lowcode-setting-style-btn-font-color);
      }
      .tiny-button:hover {
        background: none;
        border-color: var(--ti-lowcode-setting-style-btn-border-color);
      }
    }
    .inline-bind-style {
      :deep(.tiny-input__inner) {
        width: 216px;
        pointer-events: none;
        background: var(--ti-lowcode-setting-style-input-bg);
        color: var(--ti-lowcode-setting-style-input-font-color);
        border-color: var(--ti-lowcode-setting-style-input-bg);
      }
    }
  }
}
</style>
