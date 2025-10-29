<template>
  <div class="template-manager">
    <div class="manager-header">
      <div>
        <svg-icon name="template-logo"></svg-icon>
        <span>TinyEngine</span>
      </div>
    </div>
    <div class="manager-index">
      <div class="manager-menu">
        <template v-for="item in menuList" :key="item.value">
          <div class="menu-item" :class="{ active: activeMenu.value === item.value }" @click="handleMenuClick(item)">
            <svg-icon :name="item.icon"/>
            <span>{{ item.name }}</span>
          </div>
        </template>
      </div>
      <div class="manager-container">
        <component :is="activeMenu.component" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import TemplateCenter from './TemplateCenter.vue'
import AppCenter from './AppCenter.vue'

export default {
  components: {
    TemplateCenter,
    AppCenter
  },

  setup() {
    const menuList = [
      { name: '应用中心', value: 'app', component: AppCenter, icon: 'application-center' },
      { name: '模板中心', value: 'template', component: TemplateCenter, icon: 'template-center' }
    ]

    const activeMenu = ref({})

    const queryParams = new URLSearchParams(location.search)

    activeMenu.value = menuList.find((item) => item.value === queryParams.get('type'))

    const handleMenuClick = (menu) => {
      activeMenu.value = menu
      queryParams.set('type', menu.value)
      history.replaceState(null, '', `?${queryParams.toString()}`)
    }

    return {
      menuList,
      activeMenu,
      handleMenuClick
    }
  }
}
</script>

<style lang="less" scoped>
.template-manager {
  height: 100vh;
  .manager-header {
    height: 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--te-template-common-border-bg-color);
    padding: 0 32px;

    .svg-icon {
      font-size: 28px;
      padding-right: 8px;
    }

    span {
      font-size: 14px;
      font-weight: 500;
    }
  }
  .manager-index {
    display: flex;
    justify-content: space-between;
    height: calc(100vh - 49px);
    .manager-menu {
      font-size: 14px;
      padding-top: 24px;
      width: 220px;
      border-right: 1px solid var(--te-template-common-border-bg-color);
    }
  }
  .menu-item {
    padding: 4px 16px;
    cursor: pointer;
    .svg-icon {
      padding-right: 4px;
    }
    &:hover {
      background: var(--te-template-common-bg-color-hover);
    }
  }
  .active {
    background: var(--te-template-common-bg-color-active);
    position: relative;
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0px;
      width: 2px;
      height: 100%;
      background: var(--te-template-common-before-bg-color);
    }
  }
  .manager-container {
    padding: 20px;
    width: calc(100% - 220px);
    background: var(--te-template-common-container-bg-color);
  }
}
</style>
