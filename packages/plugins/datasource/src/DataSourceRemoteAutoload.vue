<template>
  <div class="request-load">
    <tiny-checkbox v-model="state.value" class="send-requesNew" @change="change"></tiny-checkbox>
    <div class="use-service">页面初始化时是否加载该服务</div>
  </div>
</template>

<script>
import { reactive } from 'vue'
import { Checkbox } from '@opentiny/vue'

export default {
  components: {
    TinyCheckbox: Checkbox
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
  margin-top: 10px;

  .use-service {
    color: var(--ti-lowcode-datasource-color);
    font-size: 12px;
    margin-top: 2px;
    padding-left: 8px;

    span {
      color: var(--ti-lowcode-datasource-description-warning-color);
    }
  }
}
</style>
