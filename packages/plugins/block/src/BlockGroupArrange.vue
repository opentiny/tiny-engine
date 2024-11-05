<template>
  <div class="footer-toolbar">
    <span
      v-for="item in state.arrangeList"
      :key="item.id"
      :class="['icon-wrap', { active: state.type === item.id }]"
      @click="typeClick(item.id)"
    >
      <svg-icon :name="item.svgName"></svg-icon>
    </span>
  </div>
</template>

<script>
import { reactive } from 'vue'

export default {
  components: {},
  props: {
    modelValue: {
      type: String,
      default: 'grid'
    },
    arrangeList: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { emit }) {
    const state = reactive({
      type: props.modelValue,
      arrangeList: props.arrangeList
    })

    const typeClick = (type) => {
      state.type = type
      emit('update:modelValue', state.type)
    }

    return {
      state,
      typeClick
    }
  }
}
</script>

<style lang="less" scoped>
.footer-toolbar {
  .icon-wrap {
    width: 20px;
    height: 20px;
    color: var(--ti-lowcode-text-color);
    font-size: 16px;
    border-radius: 2px;
    cursor: pointer;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    transition: 0.3s;
    &:hover {
      color: var(--ti-lowcode-common-primary-color);
    }
    &.active {
      color: var(--ti-lowcode-common-primary-color);
    }
  }
  .icon-wrap + .icon-wrap {
    margin-left: 8px;
  }
}
</style>
