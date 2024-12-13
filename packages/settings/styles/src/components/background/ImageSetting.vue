<template>
  <div class="background-row line">
    <label class="image-label top">背景图</label>
    <div class="image-content">
      <div class="image-wrap">
        <div class="image-inner"></div>
      </div>
      <div class="text-wrap">
        <span class="size">background-image.svg</span>
        <span class="size">250 * 250 3.4 KB</span>
        <span>
          <tiny-checkbox v-model="state.checked" @change="imageSizeChange">@2x</tiny-checkbox>
        </span>
      </div>
      <div class="choose-image">
        <span>选择图片</span>
      </div>
    </div>
  </div>
  <div class="background-row line">
    <label class="size-label">大小</label>
    <tabs-group-configurator
      :options="BACKGROUND_SIZE_OPTIONS"
      :modelValue="state.sizeSelected"
      label-width="67"
      @update:modelValue="selectSize"
    ></tabs-group-configurator>
  </div>
  <div class="size-row">
    <div class="size-col">
      <label class="size-label">宽度</label>
      <input-select
        :modelValue="state.width"
        :suffixValue="state.widthSuffix"
        :options="UNIT_OPTIONS"
        :disabled="state.sizeSelected !== 'custom'"
        @input-change="sizeWidthChange"
        @select-change="suffixWidthChange"
      ></input-select>
    </div>
    <div class="size-col">
      <label class="size-label">高度</label>
      <input-select
        :modelValue="state.height"
        :suffixValue="state.heightSuffix"
        :options="UNIT_OPTIONS"
        :disabled="state.sizeSelected !== 'custom'"
        @input-change="sizeHeightChange"
        @select-change="suffixHeightChange"
      ></input-select>
    </div>
  </div>
  <position-origin class="background-row line" :is-top="true" @update="updateStyle"></position-origin>
  <div class="background-row tile-wrap">
    <label class="row-label">重复</label>
    <tabs-group-configurator
      :options="REPEAT_OPTIONS"
      :modelValue="state.repeat"
      label-width="50"
      @update:modelValue="selectRepeat"
    ></tabs-group-configurator>
  </div>
  <div class="background-row fixed-wrap">
    <label class="row-label">固定</label>
    <tabs-group-configurator
      :options="FIXED_OPTIONS"
      :modelValue="state.fixedSelected"
      label-width="98"
      @update:modelValue="selectFixed"
    ></tabs-group-configurator>
  </div>
</template>

<script setup>
import { reactive, defineProps, defineEmits, onMounted } from 'vue'
import { Checkbox as TinyCheckbox } from '@opentiny/vue'
import { TabsGroupConfigurator } from '@opentiny/tiny-engine-configurator'
import PositionOrigin from './PositionOrigin.vue'
import InputSelect from '../inputs/InputSelect.vue'
import {
  BACKGROUND_PROPERTY,
  UNIT_OPTIONS,
  BACKGROUND_SIZE_OPTIONS,
  FIXED_OPTIONS,
  REPEAT_OPTIONS
} from '../../js/styleProperty'

const props = defineProps({
  style: {
    type: Object,
    default: () => ({})
  },
  effect: {
    type: String,
    default: 'dark'
  },
  placement: {
    type: String,
    default: 'top'
  }
})

const emit = defineEmits(['updateStyle'])

const state = reactive({
  checked: false,
  sizeSelected: 'custom',
  repeat: 'no-repeat',
  fixedSelected: 'scroll',
  width: 'Auto',
  widthSuffix: 'auto',
  height: 'Auto',
  heightSuffix: 'auto'
})

const updateStyle = (property) => {
  emit('updateStyle', property)
}

const imageSizeChange = (val) => {
  state.width = val ? '125' : 'Auto'
  state.widthSuffix = val ? 'px' : 'auto'
  state.height = 'Auto'
  state.heightSuffix = 'auto'
  val
    ? updateStyle({ [BACKGROUND_PROPERTY.BackgroundSize]: '125px' })
    : updateStyle({ [BACKGROUND_PROPERTY.BackgroundSize]: null })
}

const selectSize = (value) => {
  if (value !== 'auto') {
    state.width = 'Auto'
    state.widthSuffix = 'auto'
    state.height = 'Auto'
    state.heightSuffix = 'auto'
  }
  state.checked = false
  state.sizeSelected = value
  updateStyle({ [BACKGROUND_PROPERTY.BackgroundSize]: value })
}

const isNum = (num) => {
  const reg = /^[0-9]+(.[0-9]+)?$/
  return reg.test(num)
}

const setBackgroundSize = () => {
  const isAutoWidth = state.width.toLocaleLowerCase() === 'auto'
  const isAutoHeight = state.height.toLocaleLowerCase() === 'auto'
  const width = isAutoWidth ? state.width.toLocaleLowerCase() : `${state.width.toLocaleLowerCase() + state.widthSuffix}`
  const height = isAutoHeight
    ? state.height.toLocaleLowerCase()
    : `${state.height.toLocaleLowerCase() + state.heightSuffix}`

  updateStyle({ [BACKGROUND_PROPERTY.BackgroundSize]: `${width} ${height}` })
}

const sizeWidthChange = (val) => {
  state.width = val
  if (state.widthSuffix === 'auto') {
    state.widthSuffix = isNum(val) ? 'px' : 'auto'
  }
  setBackgroundSize()
}

const suffixWidthChange = (val) => {
  state.widthSuffix = val
  if (state.widthSuffix === 'auto') {
    state.width = 'Auto'
  }
  setBackgroundSize()
}

const sizeHeightChange = (val) => {
  state.height = val
  if (state.heightSuffix === 'auto') {
    state.heightSuffix = isNum(val) ? 'px' : 'auto'
  }
  setBackgroundSize()
}

const suffixHeightChange = (val) => {
  state.heightSuffix = val
  if (state.heightSuffix === 'auto') {
    state.height = 'Auto'
  }
  setBackgroundSize()
}

const selectRepeat = (value) => {
  state.repeat = value
  updateStyle({ [BACKGROUND_PROPERTY.BackgroundRepeat]: value })
}

const selectFixed = (value) => {
  state.fixedSelected = value
  updateStyle({ [BACKGROUND_PROPERTY.BackgroundAttachment]: value })
}

onMounted(() => {
  const { styleObj } = props.style
  state.fixedSelected = styleObj[BACKGROUND_PROPERTY.BackgroundAttachment]
  state.repeat = styleObj[BACKGROUND_PROPERTY.BackgroundRepeat]
  const sizeKeyword = ['cover', 'contain']
  const size = styleObj[BACKGROUND_PROPERTY.BackgroundSize] ?? ''
  state.sizeSelected = sizeKeyword.includes(size) ? size : 'custom'
  if (state.sizeSelected === 'custom') {
    const [width, height] = size.split(' ')
    const rLengthPercentage = /([+-]?\d*\.?\d+)(%|[a-z]+)?/
    const widthMatch = rLengthPercentage.exec(width)
    const heightMatch = rLengthPercentage.exec(height)
    if (widthMatch) {
      state.width = widthMatch[0]
      state.widthSuffix = widthMatch[1]
    } else {
      state.width = 'Auto'
      state.widthSuffix = 'auto'
    }
    if (heightMatch) {
      state.height = heightMatch[0]
      state.heightSuffix = heightMatch[1]
    } else {
      state.height = 'Auto'
      state.heightSuffix = 'auto'
    }
  }
  state.position = styleObj[BACKGROUND_PROPERTY.BackgroundPosition]
})
</script>

<style lang="less" scoped>
.image-content {
  display: grid;
  grid-template-columns: auto 1fr;
  row-gap: 8px;
}
.image-wrap {
  padding: 4px;
  width: 64px;
  height: 64px;
  border-width: 1px;
  box-sizing: border-box;
  border-style: solid;
  border: 1px dotted var(--te-common-border-default);
  border-radius: 4px;
}
.image-inner {
  width: 100%;
  height: 100%;
  background-image: url(img/bgcModal.png);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: 50% 50%;
}
.size-row {
  display: flex;
  padding: 6px 0;

  &:last-child {
    margin-bottom: 0;
  }
  .size-col {
    flex: 1;
    display: flex;
    align-items: center;
    &:not(:last-child) {
      margin-right: 8px;
    }
    .input-select {
      width: 70px;
    }
    .size-label {
      flex: 0 0 55px;
      margin-right: 6px;
      line-height: 28px;
      color: var(--ti-lowcode-component-setting-panel-label-color);
    }
    &:last-child {
      .size-label {
        flex: 0 0 48px;
        margin-right: 10px;
        text-align: right;
      }
    }
  }
}
.text-wrap {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: var(--te-common-text-secondary);
  margin-left: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  & > span {
    display: inline-block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    &:first-child {
      margin-bottom: 4px;
    }
    &:last-child {
      display: flex;
      align-items: center;
      margin-top: 2px;
    }
  }
  .size {
    color: var(--te-common-text-secondary);
  }
}
.choose-image {
  border-color: var(--te-common-border-default);
  outline: 0px;
  cursor: default;
  user-select: none;
  padding: 0px;
  box-sizing: border-box;
  grid-column: 1 / -1;
  font-family: inherit;
  font-size: inherit;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  border-radius: 4px;
  color: var(--te-common-text-primary);
  border-width: 1px;
  border-style: solid;
  align-self: center;
  span {
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.image-size-item {
  cursor: default;
}
.dim-wrap {
  align-items: center;
  display: grid;
  gap: 4px 8px;
  grid-template-columns: 1fr 1fr;
  margin-top: 12px;
  & > span {
    justify-self: center;
  }
}
.tile-wrap {
  padding: 8px 0 4px;
  .svg-icon {
    font-size: 16px;
  }
}
.fixed-wrap {
  padding: 4px 0 8px;
}
.top {
  align-self: flex-start;
}
</style>
