<template>
  <div>
    <tiny-popover :visible-arrow="false" width="188" trigger="click">
      <template #reference>
        <div>
          <svg-icon class="user-icon" name="user"></svg-icon>
          <svg-icon class="expand-icon" :name="iconExpand"></svg-icon>
        </div>
      </template>
      <div class="user-style">
        <div class="user-setting">
          <div class="user-name"><svg-icon class="user-icon" name="user"></svg-icon>xxxxxxx</div>
          <div class="user-tenant">
            <div class="tenant-label">选择组织</div>
            <tiny-select v-model="state.tenantValue" :options="tenantOptions"> </tiny-select>
          </div>
        </div>
        <div class="user-out">
          <svg-icon class="out-icon" name="log-out"></svg-icon>
          退出登录
        </div>
      </div>
    </tiny-popover>
  </div>
</template>

<script lang="ts">
import { reactive } from 'vue'
import type { Component } from 'vue'
import { Popover, Select } from '@opentiny/vue'

export default {
  components: {
    TinyPopover: Popover as Component,
    TinySelect: Select
  },
  props: {
    iconExpand: {
      type: String,
      default: 'down-arrow'
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },
  setup() {
    const tenantOptions = [
      { value: 1, label: 'public' },
      { value: 2, label: 'aaa' }
    ]
    const state = reactive({
      tenantValue: 1
    })
    return {
      tenantOptions,
      state
    }
  }
}
</script>
<style lang="less" scoped>
.user-icon {
  width: 28px;
  height: 28px;
  margin-right: 2px;
}
.user-setting {
  padding-bottom: 8px;
  border-bottom: 1px solid #dbdbdb;
  font-size: 12px;
  .user-name {
    height: 40px;
    line-height: 40px;
  }
  .user-tenant {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 6px;
    height: 40px;
  }
  .tenant-label {
    font-size: 12px;
    margin-right: 6px;
  }
}
.user-out {
  display: flex;
  align-items: center;
  height: 28px;
  line-height: 28px;
  margin-top: 8px;
  font-size: 12px;
  cursor: pointer;
  .out-icon {
    margin-right: 6px;
  }
}
:deep(.tiny-select) {
  width: 100px;
}
</style>
