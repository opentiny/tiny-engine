<template>
  <div class="collaboration-container">
    <tiny-popover
      v-model="state.outsideVisible"
      trigger="click"
      width="260"
      append-to-body
      popper-class="toolbar-right-popover collaborator"
    >
      <div class="collaborators-list">
        <div v-for="(list, index) in state.userLists" :key="index" class="collaborators-list-group">
          <span class="page-name">{{ list.pageName }}</span>
          <ul>
            <li v-for="(userItem, index) in list.users" :key="index" class="user-item">
              <img class="user-item-head" :src="userItem.userHead" alt="" />
              <span class="user-item-name">{{ userItem.userName }}</span>
              <span class="user-item-status">正在{{ userItem.status }}</span>
            </li>
          </ul>
        </div>
      </div>
      <template #reference>
        <tiny-popover
          v-model="state.insideVisible"
          trigger="hover"
          :open-delay="1000"
          popper-class="collaboration-popover toolbar-right-popover"
          append-to-body
          :content="`该项目共有 ${state.userLists.length} 位用户在编辑`"
        >
          <template #reference>
            <div class="icon collaboration-wrap">
              <img class="user-head" :src="state.url" alt="" />
            </div>
          </template>
        </tiny-popover>
      </template>
    </tiny-popover>
  </div>
</template>

<script>
import { reactive, watchEffect } from 'vue'
import { Popover } from '@opentiny/vue'
import { useLayout } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinyPopover: Popover
  },
  setup() {
    const { layoutState } = useLayout()

    const state = reactive({
      outsideVisible: false,
      insideVisible: false,
      url: '',
      userLists: []
    })

    watchEffect(() => {
      state.url = 'img/defaultAvator.png'
      state.userLists = [
        {
          pageName: '当前页',
          users: [
            {
              userHead: 'img/defaultAvator.png',
              userName: layoutState.pageStatus.data?.username,
              status: '编辑'
            }
          ]
        }
      ]
    })

    const isSingle = () => {
      return true
    }

    return {
      state,
      isSingle
    }
  }
}
</script>

<style lang="less" scoped>
.collaboration-container {
  :deep(.reference-wrapper) {
    display: flex;
  }
}
.collaborators-list {
  .page-name {
    display: inline-block;
    width: 100%;
    font-size: 14px;
    padding: 12px 20px;
    color: var(--ti-lowcode-toolbar-breadcrumb-color);
    line-height: 18px;
    font-weight: 600;
  }
  .user-item {
    padding: 10px 16px;
    display: flex;
    align-items: center;
    &:hover {
      background: var(--ti-lowcode-toolbar-hover-color);
    }
    .user-item-head {
      width: 26px;
      height: 26px;
      border-radius: 50%;
    }

    .user-item-name {
      font-size: 14px;
      color: var(--ti-lowcode-dialog-font-color);
      line-height: 16px;
      font-weight: 400;
      margin: 0 4px 0 8px;
    }
    .user-item-status {
      font-size: 14px;
    }
  }
}
.collaboration-wrap {
  display: flex;
  align-items: center;
  cursor: pointer;

  .user-head {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    z-index: 9;
    border: 1px solid var(--ti-lowcode-toolbar-user-img-border-color);
  }
  .user-count {
    height: 20px;
    width: 20px;
    color: var(--ti-lowcode-toolbar-icon-color);
    background-color: var(--ti-lowcode-user-header-bg);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
