<template>
  <div class="className-container">
    <h6 class="title">样式选择器</h6>
    <div class="selector-container">
      <tiny-select
        v-model="state.className.classNameList"
        :options="state.selectorOptionLists"
        class="className-selector"
        allow-create
        filterable
        default-first-option
        @change="handleSelectorChange"
      >
      </tiny-select>
      <tiny-select v-model="state.className.mouseState" :options="stateOptions" class="state-selectors">
      </tiny-select>
    </div>
  </div>
</template>

<script>
import { Select } from '@opentiny/vue'
import { getSchema as getCanvasPageSchema } from '@opentiny/tiny-engine-canvas'
import { useProperties } from '@opentiny/tiny-engine-controller'
import useStyle from '../../js/useStyle'

const { getSchema, setProp } = useProperties()

export default {
    components: {
        TinySelect: Select
    },
    setup() {
      const stateOptions = [
        { label: 'None', value: '' },
        { label: 'hover', value: 'hover' },
        { label: 'pressed', value: 'pressed' },
        { label: 'focused', value: 'focused' },
        { label: 'disabled', value: 'disabled' }
      ]

      const state = useStyle().state

      const addToClassName = (curClassName) => {
        const schema = getSchema() || getCanvasPageSchema()
        const type = curClassName.startWith('.') ? 'className' : 'id'
        const className = schema.props.className || ''
        const ids = schema.props.id || ''
        const typeMap = {
            className: classNames,
            id: ids
        }
        let newClassNames = curClassName.slice(1)

        // 表达式类型，无法写入
        if (typeof typeMap[type] !== 'string') {
            return
        }

        if (typeMap[type]) {
            newClassNames = `${typeMap[type]} ${newClassNames}`
        }
        setProp(type, newClassNames)
      }

      const handleSelectorChange = (newSelector) => {
        let curClassName = newSelector

        if (!curClassName.startWith('.') && !curClassName.startWith('#')) {
            curClassName = `.${curClassName}`
        }

        // 用户手动输入新增选择器的时候，添加到当前 props 的类名中
        if (!state.selectorOptionLists.find(({ value }) => value === curClassName)) {
            addToClassName(curClassName)
        }
      }

      return {
        state,
        stateOptions,
        handleSelectorChange
      }
    }
}

</script>

<style lang="less" scoped>
.className-container {
    padding: 10px;
}
.selector-container {
    display: flex;
    margin-top: 10px;
    .className-selector {
        flex: 7;
    }
    .state-selector {
        flex: 4;
        margin-left: 4px;
    }
}
.title {
    margin: 0;
    color: var(--ti-lowcode-common-primary-text-color);
}
</style>