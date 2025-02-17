<template>
  <div class="components-wrap">
    <tiny-tabs v-model="activeName" tab-style="button-card" class="full-width-tabs" @click="tabClick">
      <tiny-tab-item name="iconify" title="在线图标">
        <iconify></iconify>
      </tiny-tab-item>
      <tiny-tab-item name="custom" title="我的图标">
        <icon-custom></icon-custom>
      </tiny-tab-item>
    </tiny-tabs>
  </div>
</template>

<script>
import { ref } from 'vue'
import { Tabs, TabItem } from '@opentiny/vue'
import IconCustom from './Custom.vue'
import Iconify from './Iconify.vue'

export default {
  components: {
    TinyTabs: Tabs,
    TinyTabItem: TabItem,
    IconCustom,
    Iconify
  },
  setup() {
    const activeName = ref('iconify')
    const tabClick = (_tabs) => {}

    return {
      activeName,
      tabClick
    }
  }
}
</script>

<style lang="less" scoped>
.components-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;

  .tiny-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .tiny-tabs__content {
    flex: 1;
  }

  .tiny-collapse {
    flex: 1;
    overflow-y: scroll;
    .tiny-collapse-item.is-active + .tiny-collapse-item {
      margin-top: 0;
    }

    .components-items {
      .item {
        cursor: pointer;
      }
    }
  }
}
</style>
