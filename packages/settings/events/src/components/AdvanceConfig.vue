<template>
  <div class="advanced-config-container">
    <div class="advnce-config">
      <label class="text-ellipsis-multiple">是否渲染</label>
      <div class="advanced-config-form-item">
        <switch-configurator v-if="!isBind" :modelValue="condition" @update:modelValue="setConfig">
        </switch-configurator>
        <div v-else class="binding-state text-ellipsis-multiple" :title="condition.value">
          已绑定：{{ condition.value }}
        </div>
        <variable-configurator
          v-model="condition"
          name="advance"
          @update:modelValue="setConfig"
        ></variable-configurator>
      </div>
    </div>

    <div class="advnce-config loop-data-item">
      <label class="text-ellipsis-multiple">循环数据</label>
      <div class="advanced-config-form-item">
        <code-configurator
          v-if="!state.isLoop"
          v-model="state.loopData"
          data-type="JSExpression"
          @update:modelValue="setLoop"
          @open="openEditor"
        ></code-configurator>
        <div v-else class="binding-state text-ellipsis-multiple" :title="state.loopData?.value">
          已绑定：{{ state.loopData?.value }}
        </div>
        <variable-configurator
          v-model="state.loopData"
          name="advance"
          @update:modelValue="setLoop"
        ></variable-configurator>
      </div>
    </div>
    <div class="advnce-config">
      <label class="text-ellipsis-multiple">迭代变量名</label>
      <div class="advanced-config-form-item">
        <input-configurator
          v-model="state.loopItem"
          :placeholder="`默认值为：${DEFAULT_LOOP_NAME.ITEM}`"
          @update:modelValue="setLoopItem"
        ></input-configurator>
      </div>
    </div>
    <div class="advnce-config">
      <label class="text-ellipsis-multiple">索引变量名</label>
      <div class="advanced-config-form-item">
        <input-configurator
          v-model="state.loopIndex"
          :placeholder="`默认值为：${DEFAULT_LOOP_NAME.INDEX}`"
          @update:modelValue="setLoopIndex"
        ></input-configurator>
      </div>
    </div>
    <div class="advnce-config">
      <label class="text-ellipsis-multiple">key</label>
      <div class="advanced-config-form-item">
        <tiny-tooltip content="建议填写循环项中的唯一值（如item.id），如果填写为数字将不保存" effect="light">
          <input-configurator
            v-model="state.loopKey"
            :placeholder="`默认为索引名：${getIndexName()}`"
            @update:modelValue="setLoopKey"
          ></input-configurator>
        </tiny-tooltip>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, reactive, watch } from 'vue'
import {
  CodeConfigurator,
  InputConfigurator,
  SwitchConfigurator,
  VariableConfigurator
} from '@opentiny/tiny-engine-configurator'
import { useProperties, useCanvas } from '@opentiny/tiny-engine-meta-register'
import { PROP_DATA_TYPE } from '@opentiny/tiny-engine-common/js/constants'
import { constants, utils } from '@opentiny/tiny-engine-utils'
import { Tooltip } from '@opentiny/vue'

const { DEFAULT_LOOP_NAME } = constants
const { string2Obj } = utils

export default {
  components: {
    SwitchConfigurator,
    TinyTooltip: Tooltip,
    VariableConfigurator,
    InputConfigurator,
    CodeConfigurator
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
      const { getSchema, setProp } = useProperties()
      const schema = getSchema()

      if (!schema) {
        return
      }

      const isNumber = Number(value).toString() !== 'NaN'
      let newPropsKey = schema.props?.key

      if (value && !isNumber) {
        newPropsKey = {
          type: PROP_DATA_TYPE.JSEXPRESSION,
          value
        }
      }

      if (!value) {
        if (state.isLoop) {
          newPropsKey = {
            type: PROP_DATA_TYPE.JSEXPRESSION,
            value: getIndexName()
          }
        } else {
          newPropsKey = ''
        }
      }

      setProp('key', newPropsKey)
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
      const { getSchema } = useProperties()
      const schema = getSchema()

      if (!schema) {
        return
      }

      const { operateNode } = useCanvas()

      if (value === false || value?.type) {
        operateNode({ type: 'updateAttributes', id: schema.id, value: { condition: value } })
      } else {
        const { condition: _schemaCondition, children, ...rest } = schema
        operateNode({ type: 'updateAttributes', id: schema.id, value: { ...rest }, overwrite: true })
      }

      useCanvas().canvasApi.value.updateRect()
      condition.value = value
    }

    const setLoopIndex = (value) => {
      const schema = useProperties().getSchema()
      let loopArgs = schema.loopArgs
      const { operateNode } = useCanvas()

      if (loopArgs) {
        loopArgs[1] = value || DEFAULT_LOOP_NAME.INDEX
      } else {
        loopArgs = [DEFAULT_LOOP_NAME.ITEM, value]
      }

      operateNode({ type: 'updateAttributes', id: schema.id, value: { loopArgs } })
    }

    const setLoop = (value) => {
      const { operateNode } = useCanvas()
      const { getSchema } = useProperties()
      const schema = getSchema()

      if (value) {
        const newLoop = value?.type ? value : string2Obj(value)

        operateNode({ type: 'updateAttributes', id: schema.id, value: { loop: newLoop } })
        setLoopIndex(DEFAULT_LOOP_NAME.INDEX)
      } else {
        setLoopKey()
        const { loop: _loop, loopArgs: _loopArgs, children: _children, ...rest } = schema

        operateNode({ type: 'updateAttributes', id: schema.id, value: rest, overwrite: true })
      }

      // 触发更新state
      state.shouldUpdate = !state.shouldUpdate
    }

    const setLoopItem = (value) => {
      const schema = useProperties().getSchema()
      let loopArgs = schema.loopArgs
      const { operateNode } = useCanvas()

      if (loopArgs) {
        loopArgs[0] = value || DEFAULT_LOOP_NAME.ITEM
      } else {
        loopArgs = [value, DEFAULT_LOOP_NAME.INDEX]
      }

      operateNode({ type: 'updateAttributes', id: schema.id, value: { loopArgs } })
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
    &:not(:last-child) {
      margin-bottom: var(--te-common-vertical-item-spacing-normal);
    }
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
      flex: 1;
    }
    .binding-state {
      box-sizing: border-box;
      background: var(--ti-lowcode-events-advanced-binding-state-bg-color);
      color: var(--ti-lowcode-events-advanced-binding-state-color);
      border: 1px solid var(--ti-lowcode-events-advanced-binding-state-border-color);
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
  .loop-data-item {
    display: block;
    label {
      margin-bottom: 5px;
    }
  }
}
</style>
