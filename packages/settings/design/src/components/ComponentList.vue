<template>
  <div>
    <h4>组件列表</h4>
    <div class="component-list-wrap">
      <ul class="component-list">
        <li v-for="name in data" :key="name.key" class="item" @click="change(name)">
          {{ name.label }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  components: {},
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  setup(props, { emit }) {
    const change = (data) => {
      emit('change', data)
    }

    return {
      change
    }
  }
}
</script>

<style lang="less" scoped>
.component-list-wrap {
  max-height: var(--max-height);
  overflow-y: auto;
}
.item {
  padding: 5px 10px;
  cursor: pointer;
}
</style>
