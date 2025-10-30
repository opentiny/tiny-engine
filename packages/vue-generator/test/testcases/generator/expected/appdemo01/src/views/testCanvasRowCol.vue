<template>
  <div>
    <canvas-row-col-container rowGap="20px">
      <canvas-row rowGap="20px" colGap="20px">
        <canvas-col rowGap="20px" colGap="20px" :grow="true" :shrink="true" widthType="auto"></canvas-col>
        <canvas-col rowGap="20px" colGap="20px" :grow="true" :shrink="true" widthType="auto"></canvas-col
      ></canvas-row>
      <canvas-row rowGap="20px" colGap="20px">
        <canvas-col rowGap="20px" colGap="20px" :grow="true" :shrink="true" widthType="auto">
          <canvas-row rowGap="20px" colGap="20px">
            <canvas-col rowGap="20px" colGap="20px" :grow="true" :shrink="true" widthType="auto"></canvas-col
          ></canvas-row>
          <canvas-row rowGap="20px" colGap="20px">
            <canvas-col rowGap="20px" colGap="20px" :grow="true" :shrink="true" widthType="auto"></canvas-col
          ></canvas-row>
          <canvas-row rowGap="20px" colGap="20px">
            <canvas-col
              rowGap="20px"
              colGap="20px"
              :grow="true"
              :shrink="true"
              widthType="auto"
            ></canvas-col></canvas-row
        ></canvas-col>
        <canvas-col rowGap="20px" colGap="20px" :grow="true" :shrink="true" widthType="auto"></canvas-col></canvas-row
    ></canvas-row-col-container>
  </div>
</template>

<script setup>
import { CanvasRow, CanvasCol, CanvasRowColContainer } from '@opentiny/tiny-engine-builtin-component'
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'

const props = defineProps({})

const emit = defineEmits([])
const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit })
wrap({ stores })

const state = vue.reactive({
  canvasConfig: { rowGap: '20px', colGap: '20px', layoutMode: 'grid' },
  uiState: { showGrid: true, selectedElement: null }
})
wrap({ state })

const handleElementClick = wrap(function handleElementClick(elementId) {
  this.state.uiState.selectedElement = elementId
})

wrap({ handleElementClick })
</script>
<style scoped>
body {
  background-color: #eef0f5;
  margin-bottom: 80px;
}
</style>
