<template>
  <position-origin class="background-row line" :is-top="true" @update="updatePositionOrigin"></position-origin>
  <div class="background-row line">
    <label class="row-label">Size</label>
    <tabs-group-configurator
      :options="RADIAL_SIZE_LIST"
      :modelValue="state.radialSize"
      label-width="50"
      :effect="effect"
      :placement="placement"
      @update:modelValue="selectRadialSize"
    ></tabs-group-configurator>
  </div>
  <background-image-gradient
    :repeat="state.repeat"
    :colorList="state.colorList"
    @update="updateGradient"
  ></background-image-gradient>
</template>

<script setup>
import { reactive, defineProps, defineEmits, onMounted } from 'vue'
import { TabsGroupConfigurator } from '@opentiny/tiny-engine-configurator'
import PositionOrigin from './PositionOrigin.vue'
import BackgroundImageGradient from './BackgroundImageGradient.vue'
import { BACKGROUND_PROPERTY, RADIAL_SIZE_LIST } from '../../js/styleProperty'

const props = defineProps({
  style: {
    type: Object,
    default: () => {}
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
  [BACKGROUND_PROPERTY.BackgroundPosition]: '50% 50%',
  radialSize: '',
  repeat: '',
  colorList: []
})

const updateStyle = () => {
  const property = {
    [BACKGROUND_PROPERTY.BackgroundImage]: `${state.repeat ? 'repeating-' : ''}radial-gradient(circle ${
      state.radialSize
    } at ${state[[BACKGROUND_PROPERTY.BackgroundPosition]]}, ${state.colorList.join(',')})`,
    [BACKGROUND_PROPERTY.BackgroundRepeat]: state.repeat
  }
  emit('updateStyle', property)
}

const selectRadialSize = (value) => {
  state.radialSize = value
  updateStyle()
}

const updatePositionOrigin = (styleObj) => {
  Object.assign(state, styleObj)
  updateStyle()
}

const updateGradient = (styleObj) => {
  Object.assign(state, styleObj)
  updateStyle()
}

onMounted(() => {
  const { styleObj } = props.style
  state.repeat = styleObj[BACKGROUND_PROPERTY.BackgroundRepeat] ?? ''

  const rExtentKeyword = /([-a-z]+)?/ // closest-side
  const rPosition = /(\d+%(?:\s)\d+%)/ // 50% 50%
  const rGradientCapture = new RegExp(`circle ${rExtentKeyword.source}\\s*at ${rPosition.source},`, 'gi')
  const gradientMatch = rGradientCapture.exec(styleObj[BACKGROUND_PROPERTY.BackgroundImage])
  if (gradientMatch) {
    state.radialSize = gradientMatch[1]
    state[BACKGROUND_PROPERTY.BackgroundImage] = gradientMatch[2]
  }

  const rColor = /#(?:[a-f0-9]{6}|[a-f0-9]{3})/ // #fff | #fff
  const rLengthPercentage = /(?:[+-]?\d*\.?\d+)(?:%|[a-z]+)?/ // .5 5px 50%
  const rLinearColorStop = new RegExp(`${rColor.source}(?:\\s+${rLengthPercentage.source})?`)
  const rComma = /\s*,\s*/
  const rColorStopList = new RegExp(`(?:(${rLinearColorStop.source}${rComma.source})*${rLinearColorStop.source})`, 'gi')
  const colorStopListMatch = styleObj[BACKGROUND_PROPERTY.BackgroundImage].match(rColorStopList)
  if (colorStopListMatch && colorStopListMatch.length) {
    state.colorList = colorStopListMatch.map((item, index) => {
      const [color, percent] = item.split(' ')
      return {
        color,
        percent: percent ?? (index === 0 ? '0%' : '100%')
      }
    })
  }
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
  background-color: rgb(43, 43, 43);
  border-style: solid;
  border-color: rgb(33, 33, 33);
  border-radius: 2px;
}
.image-inner {
  width: 100%;
  height: 100%;
  background-image: url(img/bgcModal.png);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: 50% 50%;
}
.choose-image {
  border-color: rgb(54, 54, 54);
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
  border-radius: 2px;
  color: rgb(217, 217, 217);
  background: rgb(94, 94, 94);
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
