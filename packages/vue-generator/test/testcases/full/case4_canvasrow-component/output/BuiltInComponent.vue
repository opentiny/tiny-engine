<template>
  <div>
    <canvas-row-col-container rowGap="20px">
      <canvas-row rowGap="20px" colGap="20px">
        <canvas-col rowGap="20px" colGap="20px" :grow="true" :shrink="true" widthType="auto"></canvas-col>
        <canvas-col rowGap="20px" colGap="20px" :grow="true" :shrink="true" widthType="auto"></canvas-col>
      </canvas-row>
      <canvas-row rowGap="20px" colGap="20px">
        <canvas-col rowGap="20px" colGap="20px" :grow="true" :shrink="true" widthType="auto">
          <canvas-row rowGap="20px" colGap="20px">
            <canvas-col rowGap="20px" colGap="20px" :grow="true" :shrink="true" widthType="auto"></canvas-col>
          </canvas-row>
          <canvas-row rowGap="20px" colGap="20px">
            <canvas-col rowGap="20px" colGap="20px" :grow="true" :shrink="true" widthType="auto"></canvas-col>
          </canvas-row>
          <canvas-row rowGap="20px" colGap="20px">
            <canvas-col rowGap="20px" colGap="20px" :grow="true" :shrink="true" widthType="auto"></canvas-col>
          </canvas-row>
        </canvas-col>
        <canvas-col rowGap="20px" colGap="20px" :grow="true" :shrink="true" widthType="auto"></canvas-col>
      </canvas-row>
    </canvas-row-col-container>
  </div>
</template>

<script setup>
import * as vue from 'vue'
import { defineProps, defineEmits } from 'vue'
import { I18nInjectionKey } from 'vue-i18n'
import { CanvasRow, CanvasCol, CanvasRowColContainer } from '@opentiny/tiny-engine-builtin-component'

const props = defineProps({})
const emit = defineEmits([])

const { t, lowcodeWrap, stores } = vue.inject(I18nInjectionKey).lowcode()
const wrap = lowcodeWrap(props, { emit }, t)

const state = vue.reactive({})

wrap({
  stores,
  state
})
</script>

<style scoped></style>
