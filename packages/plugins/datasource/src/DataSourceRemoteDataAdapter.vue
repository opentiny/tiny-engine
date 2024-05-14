<template>
  <div class="send-service">
    <div class="use-service">
      <tiny-alert
        type="info"
        description="* 如果接口存在跨域、鉴权等情况，则请手动将响应数据，粘贴至下方的“请求结果”编辑器中。* 如果不存在上述情况，完善以上信息，点击此按钮，编辑器将请求该接口，响应的数据，将自动填充至下方的“请求结果”编辑器中。"
        :closable="false"
        class="life-cycle-alert"
      ></tiny-alert>
    </div>
  </div>
  <div>
    <remote-data-adapter-form
      v-model="state.shouldFetch"
      name="是否可以发起请求的计算函数（shouldFetch）"
    ></remote-data-adapter-form>
    <remote-data-adapter-form v-model="state.willFetch" name="请求参数处理函数（willFetch）"></remote-data-adapter-form>
    <remote-data-adapter-form v-model="state.dataHandler" name="请求完成回调函数（dataHandler）">
      <template #title>
        <tiny-popover placement="top" trigger="hover">
          <div>为了支持mock数据和表格快捷生成字段功能，数据源最终返回的格式建议是：</div>
          <div>对于对象数组：<code>{ code: string, msg: string, data: {items: any[], total: number} }</code></div>
          <div>对于树结构：<code>{ code: string, msg: string, data: any }</code></div>
          <template #reference>
            <div>
              <icon-help-circle class="help-icon"></icon-help-circle>
            </div>
          </template>
        </tiny-popover>
      </template>
    </remote-data-adapter-form>
    <remote-data-adapter-form
      v-model="state.errorHandler"
      name="请求失败后的回调函数（errorHandler）"
    ></remote-data-adapter-form>
  </div>
</template>

<script>
import { reactive, ref, watch } from 'vue'
import { Popover, Alert } from '@opentiny/vue'
import { iconHelpCircle } from '@opentiny/vue-icon'
import { constants } from '@opentiny/tiny-engine-utils'
import RemoteDataAdapterForm from './RemoteDataAdapterForm.vue'

const { DEFAULT_INTERCEPTOR } = constants

const dataHandler = ref(null)
const willFetch = ref(null)
const shouldFetch = ref(null)
const errorHandler = ref(null)

export default {
  components: {
    TinyPopover: Popover,
    IconHelpCircle: iconHelpCircle(),
    TinyAlert: Alert,
    RemoteDataAdapterForm
  },
  props: {
    modelValue: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['sendRequst', 'update:modelValue'],
  setup(props, { emit }) {
    const state = reactive({
      dataHandler: props.modelValue.dataHandler || DEFAULT_INTERCEPTOR.dataHandler.value,
      willFetch: props.modelValue.willFetch || DEFAULT_INTERCEPTOR.willFetch.value,
      shouldFetch: props.modelValue.shouldFetch || DEFAULT_INTERCEPTOR.shouldFetch.value,
      errorHandler: props.modelValue.errorHandler || DEFAULT_INTERCEPTOR.errorHandler.value
    })

    const getEditorValue = () => ({
      dataHandler: { type: 'JSFunction', value: state.dataHandler },
      willFetch: { type: 'JSFunction', value: state.willFetch },
      shouldFetch: { type: 'JSFunction', value: state.shouldFetch },
      errorHandler: { type: 'JSFunction', value: state.errorHandler }
    })

    watch(
      () => [state.dataHandler, state.willFetch, state.shouldFetch, state.errorHandler],
      ([dataHandler, willFetch, shouldFetch, errorHandler]) => {
        emit('update:modelValue', { dataHandler, willFetch, shouldFetch, errorHandler })
      }
    )

    return {
      state,
      getEditorValue,
      dataHandler,
      willFetch,
      shouldFetch,
      errorHandler
    }
  }
}
</script>

<style lang="less" scoped>
.send-service {
  :deep(.tiny-alert) {
    .tiny-alert__content {
      .tiny-alert__description {
        font-size: 14px;
        margin-bottom: -5px;
      }
    }
  }
  .life-cycle-alert {
    margin-top: -10px;
  }
}
</style>
