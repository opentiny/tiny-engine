<template>
  <div class="request-load">
    <div class="loadTitle">请求加载</div>
    <tiny-switch v-model="state.value" class="send-requesNew" @change="change"></tiny-switch>
    <div class="use-service">页面初始化时是否加载该服务</div>
  </div>
</template>

<script>
import { reactive } from 'vue'
import { Switch } from '@opentiny/vue'

export default {
  components: {
    TinySwitch: Switch
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const state = reactive({
      value: props.modelValue
    })

    const change = (value) => {
      emit('update:modelValue', value)
    }

    return {
      state,
      change
    }
  }
}
</script>

<style lang="less" scoped>
.request-load {
  display: flex;
  margin-bottom: 15px;
  margin-top: -10px;
  .loadTitle {
    margin-left: 12px;
    color: var(--ti-lowcode-datasource-label-color);
  }
  :deep(.send-requesNew) {
    margin-left: 28px;
    margin-top: -1px;
  }
  .use-service {
    color: var(--ti-lowcode-datasource-description-minor-color);
    font-size: 12px;
    margin-top: 2px;
    padding-left: 15px;

    span {
      color: var(--ti-lowcode-datasource-description-warning-color);
    }
  }
}
</style>
