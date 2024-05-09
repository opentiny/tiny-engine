<template>
  <div class="box-shadow-input">
    <ul class="list">
      <li v-for="(item, index) in state.dateList" :key="index" class="list-item">
        <label>{{ item.label }}</label>
        <component :is="item.comName" class="component"></component>
      </li>
    </ul>
  </div>
</template>

<script>
import { reactive } from 'vue'

export default {
  setup() {
    const state = reactive({
      dateList: [
        {
          label: '颜色',
          comName: 'BackgroundInput'
        },
        {
          label: 'X',
          comName: 'NumericSelect'
        },
        {
          label: 'Y',
          comName: 'NumericSelect'
        },
        {
          label: 'Blur',
          comName: 'NumericSelect'
        },
        {
          label: 'Spread',
          comName: 'NumericSelect'
        }
      ]
    })

    return {
      state
    }
  }
}
</script>

<style lang="less" scoped>
.box-shadow-input {
  .list-item {
    display: flex;
    align-items: center;

    &:not(:last-child) {
      margin-bottom: 16px;
    }

    label {
      flex-shrink: 0;
      margin-right: 8px;
      width: 30%;
    }

    .component {
      width: 70%;
    }
  }
}
</style>
