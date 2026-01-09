<template>
  <div class="template-manager">
    <div class="manager-header">
      <div>
        <tiny-icon-arrow-left
          v-if="!!currentPageId"
          class="icon-arrow-left"
          @click="$emit('backToDesigner', '')"
        ></tiny-icon-arrow-left>
        <svg-icon class="logo-icon" name="template-logo"></svg-icon>
        <span>TinyEngine</span>
      </div>
      <div class="user-wrapper">
        <tiny-popover :visible-arrow="false" width="150" trigger="click">
          <template #reference>
            <div class="tenant-wrapper">
              <span>{{ tenantValue.label }}</span>
              <svg-icon class="expand-icon" name="down-arrow"></svg-icon>
            </div>
          </template>
          <div class="dropdown-menu__items">
            <div class="tenant-title">选择组织</div>
            <div v-if="tenantList.length">
              <div
                class="dropdown-menu__item"
                :class="{ 'active-menu': item.id === tenantValue?.id }"
                v-for="item in tenantList"
                :key="item.id"
                @click="changeTenant(item.id)"
              >
                <svg-icon class="tenant-icon" name="organize"></svg-icon>
                <span>{{ item.label }}</span>
              </div>
            </div>
            <div class="empty" v-else>暂无相关数据</div>
          </div>
        </tiny-popover>
        <tiny-popover :visible-arrow="false" width="150" trigger="click">
          <template #reference>
            <div>
              <svg-icon class="user-icon" name="default-user"></svg-icon>
            </div>
          </template>
          <div class="user-name">
            <svg-icon class="user-icon" name="default-user"></svg-icon>{{ userInfo.username }}
          </div>
          <div class="divider"></div>
          <div class="user-out" @click="logOut">
            <svg-icon class="out-icon" name="log-out"></svg-icon>
            退出登录
          </div>
        </tiny-popover>
      </div>
    </div>
    <div class="manager-index">
      <div class="manager-menu">
        <template v-for="item in workspaceRegistry" :key="item.value">
          <div class="menu-item" :class="{ active: activeNode.id === item.id }" @click="handleMenuClick(item)">
            <svg-icon :name="item.icon" />
            <span>{{ item.title }}</span>
          </div>
        </template>
      </div>
      <div class="manager-container">
        <component :is="activeNode.entry" @handleToMenu="handleMenuClick" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { iconArrowLeft } from '@opentiny/vue-icon'
import { getMetaApi, META_SERVICE, getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { Popover } from '@opentiny/vue'

export default {
  components: {
    TinyPopover: Popover,
    TinyIconArrowLeft: iconArrowLeft()
  },
  props: {
    workspaceRegistry: {
      type: Array,
      default: () => []
    },
    currentPageId: {
      type: String,
      default: ''
    }
  },
  emits: ['backToDesigner'],
  setup(props) {
    const activeNode = ref(
      props.workspaceRegistry.find((item) => item.id === props.currentPageId) || props.workspaceRegistry[0]
    )

    const enableLogin = getMergeMeta('engine.config')?.enableLogin
    const { getUserInfo, setNeedToLogin, getBaseInfo } = getMetaApi(META_SERVICE.GlobalService)

    const userInfo = computed(() => getUserInfo())
    const tenantList = computed(() => {
      const info = getUserInfo()

      return Array.isArray(info?.tenant)
        ? info.tenant?.map((item) => {
            return {
              ...item,
              label: item.nameEn
            }
          })
        : []
    })
    const tenantValue = computed(() =>
      enableLogin
        ? tenantList.value.find((item) => item.id === getBaseInfo().tenantId) || tenantList.value[0]
        : { ...getBaseInfo(), label: 'Public' }
    )

    const changeTenant = (id) => {
      const baseUrl = `${window.location.origin}${window.location.pathname}?type=app&`
      window.location.href = `${baseUrl}tenant=${id}`
    }

    const logOut = () => {
      localStorage.removeItem('engineToken')
      setNeedToLogin(true)
    }
    const handleMenuClick = (menu) => {
      activeNode.value = menu
    }

    onMounted(() => {
      if (enableLogin) {
        const tenantId = getBaseInfo().tenantId || tenantList.value[0].id
        const url = new URL(window.location.href)
        if (!url.searchParams.has('tenant')) {
          url.searchParams.append('tenant', tenantId)
          window.history.replaceState({}, '', url.toString())
        }
      }
    })

    return {
      activeNode,
      tenantValue,
      userInfo,
      tenantList,
      handleMenuClick,
      changeTenant,
      logOut
    }
  }
}
</script>

<style lang="less" scoped>
.template-manager {
  width: 100%;
  height: 100vh;
  background-color: var(--te-common-bg-default);
  .manager-header {
    height: 48px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--te-common-border-bg-divider);
    padding: 0 32px;
    .icon-arrow-left {
      font-size: 28px;
      padding-right: 10px;
      cursor: pointer;
    }
    .logo-icon {
      font-size: 28px;
      padding-right: 8px;
    }

    span {
      font-size: 14px;
      font-weight: 500;
    }
    .user-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      .tenant-wrapper {
        display: flex;
        align-items: center;
        gap: 4px;
        .expand-icon {
          font-size: 16px;
        }
      }
      .user-icon {
        font-size: 32px;
      }
    }
  }
  .manager-index {
    display: flex;
    justify-content: space-between;
    height: calc(100vh - 49px);
    .manager-menu {
      font-size: 12px;
      padding-top: 24px;
      width: 220px;
      border-right: 1px solid var(--te-common-border-bg-divider);
    }
  }
  .menu-item {
    padding: 4px 16px;
    cursor: pointer;
    .svg-icon {
      padding-right: 4px;
    }
    &:hover {
      background: var(--te-common-bg-container);
    }
  }
  .active {
    background: var(--te-common-bg-container);
    position: relative;
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0px;
      width: 2px;
      height: 100%;
      background: var(--te-common-bg-primary);
    }
  }
  .manager-container {
    padding: 20px;
    width: calc(100% - 220px);
    background: var(--te-common-bg-container);
  }
}
.user-name {
  color: var(--te-layout-common-text-color-weaken);
  .user-icon {
    margin-right: 6px;
    font-size: 20px;
  }
}
.divider {
  width: 100%;
  height: 1px;
  background: var(--te-layout-common-border-color);
  margin: 8px 0;
}
.user-out {
  display: flex;
  align-items: center;
  font-size: 12px;
  padding: 4px 16px;
  margin: 0 -16px;
  cursor: pointer;
  .out-icon {
    margin-right: 6px;
  }
  &:hover {
    background: var(--te-layout-workspace-dropdown-bg-color-hover);
  }
}
.dropdown-menu__items {
  .tenant-title {
    font-size: 14px;
    line-height: 16px;
    margin-bottom: 14px;
    color: var(--te-layout-common-text-color-secondary);
  }
  .dropdown-menu__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 16px;
    margin: 0 -16px;
    line-height: 16px;
    .tenant-icon {
      font-size: 20px;
    }
    &:hover {
      background: var(--te-layout-workspace-dropdown-bg-color-hover);
    }
  }
  .empty {
    color: var(--te-layout-common-text-color-weaken);
  }
  .active-menu {
    background: var(--te-layout-workspace-dropdown-bg-color-active);
  }
}
</style>
