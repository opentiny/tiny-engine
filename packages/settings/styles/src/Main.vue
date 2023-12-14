<template>
  <div class="style-editor">
    <meta-code-editor
      :modelValue="state.cssContent"
      title="Css 编辑"
      button-text="编辑全局样式"
      language="css"
      single
      @save="save(CSS_TYPE.Css, $event)"
    />
    <meta-code-editor
      :modelValue="state.styleContent"
      title="Style 编辑"
      button-text="编辑行内样式"
      language="css"
      single
      @save="save(CSS_TYPE.Style, $event)"
    />
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
import { ref } from 'vue'
import { Collapse, CollapseItem } from '@opentiny/vue'
import { useHistory, useCanvas, useProperties } from '@opentiny/tiny-engine-controller'
import { setPageCss, getSchema as getCanvasPageSchema } from '@opentiny/tiny-engine-canvas'
import { MetaCodeEditor } from '@opentiny/tiny-engine-common'
import { formatString } from '@opentiny/tiny-engine-common/js/ast'
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
    TinyCollapseItem: CollapseItem
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
    const { getCurrentSchema, getPageSchema } = useCanvas()
    // 获取当前节点 style 对象
    const { state, updateStyle } = useStyle() // updateStyle
    const { addHistory } = useHistory()
    const { getSchema } = useProperties()

    // 打开编辑器

    // 保存编辑器内容，并回写到 schema
    const save = (type, { content }) => {
      if (type === CSS_TYPE.Style) {
        const pageSchema = getCanvasPageSchema()
        const schema = getSchema() || pageSchema
        const styleString = formatString(styleStrRemoveRoot(content), 'css')
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
      } else if (type === CSS_TYPE.Css) {
        const cssString = formatString(content.replace(/"/g, "'"), 'css')
        getPageSchema().css = cssString
        getCanvasPageSchema().css = cssString
        setPageCss(cssString)
        state.schemaUpdateKey++
        addHistory()
      }
    }

    return {
      state,
      activeNames,
      CSS_TYPE,
      open,
      save,
      close,
      updateStyle
    }
  }
}
</script>

<style lang="less" scoped>
.style-editor {
  display: flex;
  justify-content: space-around;
  padding: 8px 16px 12px;
  column-gap: 8px;
  :deep(.editor-wrap) {
    .tiny-button {
      padding: 0 16px;
    }
  }
}
</style>
