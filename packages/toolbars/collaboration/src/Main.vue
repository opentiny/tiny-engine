<template>
  <toolbar-base :options="options">
    <template #default>
      <span class="collaboration-container">
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
              class="toolbar-right-user"
              trigger="hover"
              :open-delay="1000"
              popper-class="collaboration-popover toolbar-right-popover"
              append-to-body
              :content="`该项目共有 ${state.userLists.length} 位用户在编辑`"
            >
              <template #reference>
                <span class="icon collaboration-wrap">
                  <span class="icon-hides">
                    <svg-icon v-if="state.url" :name="options.icon.default || options.icon"></svg-icon>
                  </span>
                  <span v-if="options?.collapsed">多人协作</span>
                </span>
              </template>
            </tiny-popover>
          </template>
        </tiny-popover>
      </span>
    </template>
  </toolbar-base>
</template>

<script>
import { reactive, watchEffect } from 'vue'
import { Popover } from '@opentiny/vue'
import { useLayout } from '@opentiny/tiny-engine-meta-register'
import { ToolbarBase } from '@opentiny/tiny-engine-common'

export default {
  components: {
    TinyPopover: Popover,
    ToolbarBase
  },
  props: {
    options: {
      type: Object,
      default: () => ({})
    }
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

.toolbar-right-user {
  :deep(.reference-wrapper) {
    padding: 0 !important;
  }
}

.collaborators-list {
  .page-name {
    display: inline-block;
    width: 100%;
    font-size: 14px;
    padding: 12px 20px;
    color: var(--te-toolbars-collaboration-text-color-secondary);
    line-height: 18px;
    font-weight: 600;
  }

  .user-item {
    padding: 10px 16px;
    display: flex;
    align-items: center;

    &:hover {
      background: var(--te-toolbars-collaboration-bg-color-hover);
    }

    .user-item-head {
      width: 26px;
      height: 26px;
      border-radius: 50%;
    }

    .user-item-name {
      font-size: 14px;
      color: var(--te-toolbars-collaboration-text-color-primary);
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
  font-size: 12px;

  .user-head {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    margin-right: 8px;
    z-index: 9;
    border: 1px solid var(--te-toolbars-collaboration-border-color);
  }
}
</style>
