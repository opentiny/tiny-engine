<template>
  <div v-if="state.show" class="tiny-radio-buttons">
    <div
      v-for="(item, index) in data"
      :key="item"
      :class="['tiny-radio-button', state.active === index ? 'active' : '']"
      @click="triggerType(item, index, $event)"
    >
      <span>{{ item }}</span>
    </div>
  </div>
  <div class="head-content">
    <meta-input v-model="state.text" type="textarea" @update:modelValue="change"></meta-input>
  </div>
</template>
<script>
import { reactive, computed } from 'vue'
import { useProperties } from '@opentiny/tiny-engine-controller'
import MetaInput from './MetaInput.vue'

export default {
  inheritAttrs: false,
  components: {
    MetaInput
  },
  props: {
    modelValue: {
      type: String,
      default: 'h1'
    },
    showRadioButton: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const data = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6']

    const state = reactive({
      active: data.findIndex((item) => item === useProperties().getSchema()?.componentName.toUpperCase()),
      text: useProperties().getSchema().children,
      show: computed(() => props.showRadioButton)
    })

    const triggerType = (item, index) => {
      state.active = index
      useProperties().getSchema().componentName = item.toLowerCase()
    }

    const change = (value) => {
      if (useProperties().getSchema()) {
        useProperties().getSchema().children = value
      }
    }

    return {
      data,
      state,
      triggerType,
      change
    }
  }
}
</script>

<style lang="less" scoped>
.tiny-radio-buttons {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  margin-bottom: 20px;

  .tiny-radio-button {
    width: auto;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 2px;
    height: 25px;
    margin-right: -1px;
    border-radius: 0px;
    background: #5e5e5e;
    width: 22px;
    text-align: center;
    text-decoration: none;
    font-size: 11px;
    line-height: 20px;
    border: 1px solid #363636;
    border-radius: 2px;
    color: white;
    line-height: 0px;
    cursor: pointer;

    &:first-child {
      border-radius: 2px 0 0 2px;
    }

    &:first-child {
      margin-left: 0;
    }

    &.active {
      outline: 0;
      background: #2b2b2b;
      border-color: #212121;
    }
  }
}
</style>
