<template>
  <div
    v-if="state.showVerticalDivider"
    class="divider-wrapper divider-vertical"
    @click="handleSplit"
    @mouseenter="handleMouseEnter('vertical')"
    @mouseleave="handleMouseLeave"
  >
    <div class="divider"></div>
  </div>
  <div
    v-if="state.showHorizontalDivider"
    class="divider-wrapper divider-horizontal"
    @click="handleSplitRow"
    @mouseenter="handleMouseEnter('horizontal')"
    @mouseleave="handleMouseLeave"
  >
    <div class="divider"></div>
  </div>

  <div v-if="state.showDividerLine" class="divider-line" :style="state.dividerStyle"></div>
</template>

<script>
import { reactive, watch } from 'vue'
import { extend } from '@opentiny/vue-renderless/common/object'
import { getCurrent, updateRect } from './container'

const LEGAL_DIVIDER_COMPONENT = ['CanvasRow', 'CanvasCol']

const ROW_SNIPPET = {
  componentName: 'CanvasRow',
  props: {
    rowGap: '20px',
    colGap: '20px'
  },
  children: [
    {
      componentName: 'CanvasCol',
      props: {
        rowGap: '20px',
        colGap: '20px',
        grow: true,
        shrink: true,
        widthType: 'auto'
      },
      children: []
    }
  ]
}

const COL_SNIPPET = {
  componentName: 'CanvasCol',
  props: {
    rowGap: '20px',
    colGap: '20px',
    grow: true,
    shrink: true,
    widthType: 'auto'
  },
  children: []
}

export default {
  props: {
    selectState: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const state = reactive({
      horizontalLeft: 0,
      horizontalTop: 0,
      verLeft: 0,
      verTop: 0,
      showVerticalDivider: false,
      showHorizontalDivider: false,
      showDividerLine: false,
      dividerStyle: {}
    })

    const handleSplit = () => {
      const { parent, schema } = getCurrent()

      const index = parent.children.findIndex(({ id }) => id === schema.id)

      parent.children.splice(index + 1, 0, extend(true, {}, COL_SNIPPET))
      updateRect()
    }

    const handleSplitRow = () => {
      const { parent, schema } = getCurrent()

      const index = parent.children.findIndex(({ id }) => id === schema.id)

      if (schema.componentName === 'CanvasRow') {
        parent.children.splice(index + 1, 0, extend(true, {}, ROW_SNIPPET))

        return
      }

      // 当前选中组件是 CanvasCol 横向切割
      if (schema.componentName === 'CanvasCol') {
        // 当前组件为空组件，直接切成两行
        if (!schema.children?.length) {
          schema.children = [extend(true, {}, ROW_SNIPPET), extend(true, {}, ROW_SNIPPET)]
        } else if (schema.children[0].componentName !== 'CanvasRow') {
          // 当前组件不为空组件且第一个孩子不为 row，则是第一次切割，切割成两行，需要将原来有的 children 放置到第一个 row 的 col
          schema.children = [
            {
              ...extend(true, {}, ROW_SNIPPET),
              children: [
                {
                  ...extend(true, {}, COL_SNIPPET),
                  children: [...(schema.children || [])]
                }
              ]
            },
            extend(true, {}, ROW_SNIPPET)
          ]
        } else {
          // 已经切割过了，直接加一行
          schema.children.push(extend(true, {}, ROW_SNIPPET))
        }
      }

      updateRect()
    }

    watch(
      () => props.selectState,
      (selectState) => {
        const { width, height, left, top, componentName } = selectState

        if (!LEGAL_DIVIDER_COMPONENT.includes(componentName)) {
          state.showHorizontalDivider = false
          state.showVerticalDivider = false

          return
        }

        state.showHorizontalDivider = true
        state.showVerticalDivider = 'CanvasRow' !== componentName

        const centerLeft = left + width / 2
        const centerTop = top + height / 2

        state.verLeft = `${centerLeft}px`
        state.verTop = `${top}px`

        state.horizontalLeft = `${left}px`
        state.horizontalTop = `${centerTop}px`
      },
      { deep: true }
    )

    // 鼠标进入剪刀按钮，出现剪刀线
    const handleMouseEnter = (type) => {
      const { width, height, left, top } = props.selectState
      if (type === 'vertical') {
        state.dividerStyle = {
          width: '1px',
          height: `${height}px`,
          left: `${state.verLeft}px`,
          top: `${top}px`
        }
      } else {
        state.dividerStyle = {
          width: `${width}px`,
          height: '1px',
          left: `${left}px`,
          top: `${state.horizontalTop}px`
        }
      }
      state.showDividerLine = true
    }

    const handleMouseLeave = () => {
      state.showDividerLine = false
      state.dividerStyle = {}
    }

    return {
      state,
      handleSplit,
      handleSplitRow,
      handleMouseEnter,
      handleMouseLeave
    }
  }
}
</script>

<style lang="less" scoped>
.divider-wrapper {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--ti-lowcode-common-text-color-3);
  cursor: pointer;
  z-index: 3;
  &.divider-vertical {
    transform: translateX(-50%);
    top: v-bind('state.verTop');
    left: v-bind('state.verLeft');
  }
  &.divider-horizontal {
    transform: translate(10px, -50%) rotate(270deg);
    top: v-bind('state.horizontalTop');
    left: v-bind('state.horizontalLeft');
  }
  &:hover {
    background-color: var(--ti-lowcode-common-primary-color);
    .divider {
      background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAGKADAAQAAAABAAAAGAAAAADiNXWtAAACbElEQVRIDZ2Vu2sVURCH9yZgbCxMsFFjKQkExScREgQtLISAXbS4GDu10fgHiL1gpxKDCLFRfICCCSpCwEiCYiNWFkYsImIRH4jgY/x+xzNy7t29614HvsycmfnN3j1nd5Nl0cysDrPwEV7DRVjn9Vaent7Y+wYvrWbUG/pJTIHsCzyBd1pg8v0NzcmC2kDswdkizIFmyKZCK4F+uWwGelxPfAx+wFPPpZ58JzyHX3DEa8TdoFmyesYf3ZKu+nd40nyJvGzEc+7JjYWK2aTn3JPXRTRzVhdYhjkvpp78KMieNeW7yGnPZYfSmsfktV3LHSSWoNVhro+CbTTvdzH+KGyI61batdSXdAcXQDYWBcGx1m2+ha/wHRZUwK+C9/ABtA3q6W7S+vadl6AH9LT8hAk4CKdAQtlJuBIis3340zE+gR+PsXqlkVYzNEsz/5wrQR/MQ2qfWYzHX72RWE+UnppPoP3vijUNVm9qCyz60rvSnXTAJtBjOwKr0wbWV8GtaDulkVYzdLbtGaLdINPed1ZVt3Mlf/21r8NVL1Cpj1+sM9IZvAK9uY8qCas2MfAGyPbC9RCZDVXVl/YxbHsc+FCNxDpE3cWDUmHVIoPug2yna4hvhYzZLs/9l2fInjjoZjqA3JaYn07zbccM0Qujw839TyB3B2Q72h4sAcIDQW52uWiABsf63aJ6aQ6h3uqX8A38q5nTULsHsq25YlkCweEgMzv3j77B2He7rK+hhmAFLII+YGsaigULevSU6bHdXFDOp2g8DrIz+Wo+Q99Q6Da7lq9mWdG3aCWNL+BskaA5V6vVHpPT8FpzTevfkrgJcwZ0OJIAAAAASUVORK5CYII=);
    }
  }
  .divider {
    width: 12px;
    height: 12px;
    color: var(--ti-lowcode-common-text-color-3);
    background-size: contain;
    background-repeat: no-repeat;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAGKADAAQAAAABAAAAGAAAAADiNXWtAAACO0lEQVRIDa2Uy6tNURzHN7cwMUAmHncot0QeV5QiBgZKmWEgzDDx+ANu5soMcUkxIY+iEFIKEZnIyMC9GZAMrke6hXt9Pvus1VnntPbZ53B/9dnrt36P7zpr7bVPUTRtD+5j+Arv4QwshDpbTIG1o2CvGmq12CVmk/ADnsGnMHccgCpbRiLWjuA/BTXUUrM0VzNwD+aVkcbjIMNveJnEUrePyWuYgP1JYi6+WmqWO3FLrpqKMy3tHE8LtzemLc99ITfcEm1MXERNtYsxcGs520nQBV61JWcyHw253W25OFVzbDqPj1D1MheF6tWM24LvcAD6w7yqdwF5tYvT4K90y6m5zQ/wE37BC9Bmw2f4Ah6DNdamFo/vlEHP3pvwB87CLjgGNrrwEbgY/K2MQ8E/zHg0+NbaY68aaqmpdmlLeT4HBSPf8RXQloA3ylvzDTx/34OmsLWxz9Hdqtlivo/l4NXy1syB1C4ziSK547THXjXU6tk20uECnn1fz91dNJynJu5gUxf1PZV4nr6DdzABj2BK7Rpq/votcDX4GxinxNagovjDoOZLdBcPwvy/h/souMDaROlGiK1PYv/kbg5C19u6V4b43bZ4z1M/GF/uQKbzFjF3NpjJdRXaEQQuVFQr7AK3K/Idw36Jb2Ec+jtU3iHnIqs61GRTe4naeDKbbQbXhbqbzVC9N4OSEfAPbD7UmbfMa7uirjDmD+H464/HQM3oB2f9lVxd7l9vFoVv4ESuIRN7QkzxaZlc8RcdnI7tMHZBlAAAAABJRU5ErkJggg==);
  }
}

.divider-line {
  position: absolute;
  border: 1px dashed var(--ti-lowcode-common-primary-color);
  z-index: 2;
}
</style>
