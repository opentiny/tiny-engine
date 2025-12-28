<template>
  <div>
    <tiny-popover :visible-arrow="false" width="188" trigger="click">
      <template #reference>
        <div>
          <svg-icon class="user-icon" name="default-user"></svg-icon>
          <svg-icon class="expand-icon" :name="iconExpand"></svg-icon>
        </div>
      </template>
      <div class="user-style">
        <div class="user-setting">
          <div class="user-name">
            <svg-icon class="user-icon" name="default-user"></svg-icon>{{ userInfo.username }}
          </div>
          <div class="user-tenant">
            <div class="tenant-label">创建组织</div>
            <tiny-input v-model="state.newTenant" placeholder="输入组织名" @blur="createTenant"> </tiny-input>
          </div>
          <div class="user-tenant">
            <div class="tenant-label">选择组织</div>
            <tiny-select v-model="state.tenantValue" :options="tenantList" @change="changeTenant"> </tiny-select>
          </div>
        </div>
        <div class="user-out" @click="logOut">
          <svg-icon class="out-icon" name="log-out"></svg-icon>
          退出登录
        </div>
      </div>
    </tiny-popover>
  </div>
</template>

<script lang="ts">
import { reactive, computed } from 'vue'
import type { Component } from 'vue'
import { Popover, Select, Input } from '@opentiny/vue'
import { getMetaApi, META_SERVICE, useModal } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinyPopover: Popover as Component,
    TinySelect: Select,
    TinyInput: Input
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
    const { getUserInfo, fetchUserInfo, setUserInfo, setTenantInfo, setNeedToLogin, getBaseInfo } = getMetaApi(
      META_SERVICE.GlobalService
    )
    const state = reactive({
      tenantValue: getBaseInfo().tenantId,
      newTenant: ''
    })

    const userInfo = computed(() => getUserInfo())
    const tenantList = computed(() => {
      const info = getUserInfo()

      return info.tenant?.map((item) => {
        return {
          ...item,
          value: item.id,
          label: item.nameCn
        }
      })
    })

    const logOut = () => {
      localStorage.removeItem('engineToken')
      setNeedToLogin(true)
    }

    const createTenant = () => {
      getMetaApi(META_SERVICE.Http)
        .post('/platform-center/api/tenant/create', {
          nameCn: state.newTenant
        })
        .then(() => {
          fetchUserInfo().then((data: any) => {
            if (data) {
              setUserInfo(data)
            }
          })
        })
    }

    const changeTenant = (id) => {
      setTenantInfo(id).then((tenantData) => {
        setUserInfo(tenantData)
        localStorage.setItem('engineToken', tenantData.token)
        const baseUrl = `${window.location.origin}${window.location.pathname}?type=app&`
        window.location.href = `${baseUrl}tenant=${id}`
      })
    }

    return {
      userInfo,
      tenantList,
      state,
      logOut,
      createTenant,
      changeTenant
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
    font-weight: 700;
    .user-icon {
      margin-right: 6px;
    }
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
    width: 80px;
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
</style>
