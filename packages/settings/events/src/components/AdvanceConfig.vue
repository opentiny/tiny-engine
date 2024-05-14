<template>
  <div class="advanced-config-container">
    <div class="advnce-config">
      <label class="text-ellipsis-multiple">是否渲染</label>
      <div class="advanced-config-form-item">
        <meta-switch v-if="!isBind" :modelValue="condition" @update:modelValue="setConfig"> </meta-switch>
        <div v-else class="binding-state text-ellipsis-multiple" :title="condition.value">
          已绑定：{{ condition.value }}
        </div>
        <meta-bind-variable v-model="condition" name="advance" @update:modelValue="setConfig"></meta-bind-variable>
      </div>
    </div>

    <div class="advnce-config">
      <label class="text-ellipsis-multiple">循环数据</label>
      <div class="advanced-config-form-item">
        <meta-code-editor
          v-if="!state.isLoop"
          v-model="state.loopData"
          data-type="JSExpression"
          @update:modelValue="setLoop"
          @open="openEditor"
        ></meta-code-editor>
        <div v-else class="binding-state text-ellipsis-multiple" :title="state.loopData?.value">
          已绑定：{{ state.loopData?.value }}
        </div>
        <meta-bind-variable v-model="state.loopData" name="advance" @update:modelValue="setLoop"></meta-bind-variable>
      </div>
    </div>
    <div class="advnce-config">
      <label class="text-ellipsis-multiple">迭代变量名</label>
      <div class="advanced-config-form-item">
        <meta-input
          v-model="state.loopItem"
          :placeholder="`默认值为：${DEFAULT_LOOP_NAME.ITEM}`"
          @update:modelValue="setLoopItem"
        ></meta-input>
      </div>
    </div>
    <div class="advnce-config">
      <label class="text-ellipsis-multiple">索引变量名</label>
      <div class="advanced-config-form-item">
        <meta-input
          v-model="state.loopIndex"
          :placeholder="`默认值为：${DEFAULT_LOOP_NAME.INDEX}`"
          @update:modelValue="setLoopIndex"
        ></meta-input>
      </div>
    </div>
    <div class="advnce-config">
      <label class="text-ellipsis-multiple">key</label>
      <div class="advanced-config-form-item">
        <tiny-tooltip content="建议填写循环项中的唯一值（如item.id），如果填写为数字将不保存">
          <meta-input
            v-model="state.loopKey"
            :placeholder="`默认为索引名：${getIndexName()}`"
            @update:modelValue="setLoopKey"
          ></meta-input>
        </tiny-tooltip>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, reactive, watch } from 'vue'
import { MetaSwitch, MetaBindVariable, MetaInput, MetaCodeEditor } from '@opentiny/tiny-engine-common'
import { useProperties, useCanvas } from '@opentiny/tiny-engine-controller'
import { PROP_DATA_TYPE } from '@opentiny/tiny-engine-controller/utils'
import { string2Obj } from '@opentiny/tiny-engine-controller/adapter'
import { constants } from '@opentiny/tiny-engine-utils'
import { Tooltip } from '@opentiny/vue'

const { DEFAULT_LOOP_NAME } = constants

export default {
  components: {
    MetaSwitch,
    TinyTooltip: Tooltip,
    MetaBindVariable,
    MetaInput,
    MetaCodeEditor
  },
  inheritAttrs: false,
  setup() {
    const { pageState } = useCanvas()
    const condition = ref(false)
    const isBind = computed(() => condition.value?.type === PROP_DATA_TYPE.JSEXPRESSION)
    const getIndexName = () => useProperties().getSchema()?.loopArgs?.[1] || DEFAULT_LOOP_NAME.INDEX

    const state = reactive({
      loopData: {
        type: PROP_DATA_TYPE.JSEXPRESSION,
        value: '[]'
      },
      loopItem: 'item',
      loopIndex: 'index',
      isLoop: computed(() => state.loopData?.type === PROP_DATA_TYPE.JSEXPRESSION),
      loopKey: '',
      shouldUpdate: false
    })

    watch(
      () => [pageState?.currentSchema, state.shouldUpdate],
      ([value]) => {
        condition.value = value?.condition === undefined ? true : value?.condition
        state.loopData = value?.loop
        state.loopItem = value?.loopArgs?.[0] || ''
        state.loopIndex = value?.loopArgs?.[1] || ''
        state.loopKey = value?.props?.key?.value || ''
      }
    )

    const setLoopKey = (value = '') => {
      value = value.replace(/\s*/g, '')
      const schema = useProperties().getSchema()

      if (!schema) {
        return
      }

      const isNumber = Number(value).toString() !== 'NaN'

      schema.props = schema.props || {}
      const props = schema.props

      if (value && !isNumber) {
        props.key = {
          type: PROP_DATA_TYPE.JSEXPRESSION,
          value
        }
      }
      if (!value) {
        if (state.isLoop) {
          props.key = {
            type: PROP_DATA_TYPE.JSEXPRESSION,
            value: getIndexName()
          }
        } else {
          delete props.key
        }
      }
    }

    watch([() => state.isLoop, () => state.loopIndex], () => {
      if (!state.loopKey && state.isLoop) {
        setLoopKey(getIndexName())
      }

      if (!state.isLoop) {
        setLoopKey('')
      }
    })

    const openEditor = () => {
      state.loopData = useProperties().getSchema()?.loop
    }

    const setConfig = (value) => {
      if (!useProperties().getSchema()) {
        return
      }

      if (value === false || value?.type) {
        useProperties().getSchema().condition = value
      } else {
        delete useProperties().getSchema().condition
      }

      useCanvas().canvasApi.value.updateRect()
      condition.value = value
    }

    const setLoopIndex = (value) => {
      if (useProperties().getSchema().loopArgs) {
        useProperties().getSchema().loopArgs[1] = value || DEFAULT_LOOP_NAME.INDEX
      } else {
        useProperties().getSchema().loopArgs = [DEFAULT_LOOP_NAME.ITEM, value]
      }
    }

    const setLoop = (value) => {
      if (value) {
        useProperties().getSchema().loop = value?.type ? value : string2Obj(value)
        setLoopIndex(DEFAULT_LOOP_NAME.INDEX)
      } else {
        setLoopKey()
        delete useProperties().getSchema().loop
        delete useProperties().getSchema().loopArgs
      }

      // 触发更新state
      state.shouldUpdate = !state.shouldUpdate
    }

    const setLoopItem = (value) => {
      if (useProperties().getSchema().loopArgs) {
        useProperties().getSchema().loopArgs[0] = value || DEFAULT_LOOP_NAME.ITEM
      } else {
        useProperties().getSchema().loopArgs = [value, DEFAULT_LOOP_NAME.INDEX]
      }
    }

    return {
      condition,
      setConfig,
      isBind,
      state,
      setLoop,
      setLoopItem,
      DEFAULT_LOOP_NAME,
      openEditor,
      setLoopIndex,
      setLoopKey,
      getIndexName
    }
  }
}
</script>

<style lang="less" scoped>
.advanced-config-container {
  .advnce-config {
    padding: 10px;
    align-items: center;
    display: flex;
    column-gap: 12px;
    color: var(--ti-lowcode-events-advanced-config-color);

    label {
      width: 80px;
      word-break: keep-all;
      color: var(--ti-lowcode-events-advanced-label-color);
      flex-shrink: 0;
    }

    .advanced-config-form-item {
      display: grid;
      grid-template-columns: 1fr auto;
    }
    .binding-state {
      box-sizing: border-box;
      background: var(--ti-lowcode-events-advanced-binding-state-bg-color);
      color: var(--ti-lowcode-events-advanced-binding-state-color);
      font-size: 12px;
      height: 30px;
      line-height: 22px;
      padding: 4px 8px;
      --ellipsis-line: 1;
      border-radius: 6px;
    }

    .advance-config-loop-wrap {
      .advance-item {
        width: 100%;
      }
    }
  }
}
</style>
