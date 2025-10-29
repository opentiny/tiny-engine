<template>
  <div class="presence-container">
    <div class="avatar-list">
      <div class="avatar-wrapper" :title="currentUser.name + '( You )'">
        <img :src="currentUser.avatarUrl" alt="Your avatar" class="avatar self" />
        <span class="you-label">You</span>

        <div class="user-tooltip">
          <div class="tooltip-header">
            <img :src="currentUser.avatarUrl" alt="Your avatar" class="tooltip-avatar" />
            <div class="tooltip-info">
              <div class="tooltip-name">{{ currentUser.name }}</div>
              <div class="tooltip-status online">Online</div>
            </div>
          </div>
          <div class="tooltip-body">
            <p>ID: {{ currentUser.id }}</p>
            <p>Email: {{ currentUser.email || 'not-set' }}</p>
          </div>
        </div>
      </div>

      <div v-for="user in visibleUsers" :key="user.id" class="avatar-wrapper" :title="user.name">
        <img :src="user.avatarUrl || user.user.avatarUrl" :alt="user.name" class="avatar" />
        <div class="status-dot online"></div>

        <div class="user-tooltip">
          <div class="tooltip-header">
            <img :src="user.avatarUrl || user.user.avatarUrl" :alt="user.name" class="tooltip-avatar" />
            <div class="tooltip-info">
              <div class="tooltip-name">{{ user.name || user.user.name }}</div>
              <div class="tooltip-status online">Online</div>
            </div>
          </div>
          <div class="tooltip-body">
            <p>ID: {{ user.id || user.user.id }}</p>
            <p>Email: {{ user.email || user.user.email || 'not-set' }}</p>
            <p v-if="user.selection" class="editing-status">
              Editing
              <span class="editing-target">{{
                `${user.selection.componentName}组件 ID:${user.selection.schema.id}`
              }}</span>
            </p>
          </div>
        </div>
      </div>

      <div v-if="hiddenUsersCount > 0" class="avatar-wrapper more-users" :title="`${hiddenUsersCount} more users`">
        + {{ hiddenUsersCount }}
      </div>
    </div>

    <transition-group name="notifications" tag="div" class="notification-area">
      <div v-for="notification in notifications" :key="notification.id" class="notification-bubble">
        <img :src="notification.user.avatarUrl" :alt="notification.user.name" class="notification-avatar" />
        <span>{{ notification.message }}</span>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted, reactive, ref, toRaw, watch } from 'vue'
import { useCollabCursor } from '@opentiny/tiny-engine-multi-person-collaboration'
import { HOOK_NAME, initHook, useRealtimeCollab, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

export default {
  name: 'Avatar',
  setup() {
    const notifications = ref([])
    let notificationId = 0
    const currentUser = {
      id: 'user-2',
      name: 'Bob',
      color: '#1296db',
      email: 'opentiny@tiny-engine',
      avatarUrl: 'https://avatars.githubusercontent.com/u/3?v=4'
    }

    // 远程数据
    const collabState = reactive(
      useCollabCursor({
        roomId: 'cursor-yjs',
        currentUser
      })
    )

    const baseInfo = ref(getMetaApi(META_SERVICE.GlobalService).getBaseInfo())
    const currentPageId = ref(baseInfo.value.pageId)
    const search = ref(location.search)

    initHook(HOOK_NAME.useRealtimeCollab, collabState)

    // 将远程数据转换为数组
    const remoteUsers = computed(() => {
      // 缓存 useRealtimeCollab() 的结果，避免多次调用创建新实例
      const realtime = useRealtimeCollab()
      const rawState = toRaw(realtime.collabState)

      // 当前页面 ID
      const pageId = currentPageId.value

      // 获取本地 remoteCursors 中的用户
      const remoteUser = Object.values(collabState.remoteCursors ?? {})
        .filter((state) => state?.user)
        .map((state) => state.user)

      // 获取远程协作状态（非空才使用）
      const hasRemoteState = !!rawState && Object.values(rawState).length !== 0
      const remoteUserAndSelection = hasRemoteState
        ? Object.values(rawState).filter((state) => state.pageId === pageId) // 过滤当前页面
        : remoteUser

      // 逻辑保持一致（不要改动判断方向）
      return remoteUserAndSelection.length > remoteUser.length ? remoteUser : remoteUserAndSelection
    })

    const maxVisible = 4
    const visibleUsers = computed(() => remoteUsers.value.slice(0, maxVisible - 1))
    const hiddenUsersCount = computed(() => Math.max(0, remoteUsers.value.length - visibleUsers.value.length))

    // 通知系统批处理优化
    let notificationBuffer = { enter: [], left: [] }
    let notificationTimer = null

    const removeNotification = (id) => {
      notifications.value = notifications.value.filter((n) => n.id !== id)
    }

    // 添加通知的辅助函数
    const addNotification = (user, type) => {
      const id = notificationId++
      const message = type === 'enter' ? `${user.name} joined` : `${user.name} left`
      notifications.value.push({ id, user, type, message })

      // 3 秒后自动移除通知
      setTimeout(() => removeNotification(id), 3000)
    }

    const addBatchNotification = (users, type) => {
      const id = notificationId++
      const names = users.map((u) => u.name)
      let message
      if (names.length <= 2) {
        message = `${names.join(' and ')} ${type === 'enter' ? 'joined' : 'left'}`
      } else {
        message = `${names.slice(0, 2).join(', ')} and ${names.length - 2} others ${
          type === 'enter' ? 'joined' : 'left'
        }`
      }

      notifications.value.push({ id, user: users[0], type, message })
      setTimeout(() => removeNotification(id), 4000)
    }

    // 处理通知缓冲区的函数
    const processNotificationBuffer = () => {
      const { enter, left } = notificationBuffer

      if (enter.length === 1) {
        addNotification(enter[0], 'enter')
      } else if (enter.length > 1) {
        addBatchNotification(enter, 'enter')
      }

      if (left.length === 1) {
        addNotification(left[0], 'left')
      } else if (left.length > 1) {
        addBatchNotification(left, 'left')
      }

      // 清空缓冲区
      notificationBuffer = { enter: [], left: [] }
    }

    // 更新函数：当 URL 改变时执行
    const updateSearch = () => {
      search.value = location.search
    }

    // 监视一个由 collabState.remoteCursors 的所有属性创建的新对象的浅拷贝
    watch(
      () => ({ ...collabState.remoteCursors }),
      (newStates, oldStates) => {
        const newClientIds = Object.keys(newStates)
        const oldClientIds = Object.keys(oldStates)

        // 检查新加入的用户
        newClientIds.forEach((id) => {
          if (!oldClientIds.includes(id) && newStates[id].user) {
            notificationBuffer.enter.push(newStates[id].user)
          }
        })

        // 检查离开的用户
        oldClientIds.forEach((id) => {
          if (!newClientIds.includes(id) && oldStates[id].user) {
            notificationBuffer.left.push(oldStates[id].user)
          }
        })

        // 防抖来处理通知
        clearTimeout(notificationTimer)
        notificationTimer = setTimeout(() => {
          processNotificationBuffer()
        }, 2500)
      },
      { deep: true }
    )

    // 当 search 改变时重新更新 baseInfo
    watch(search, () => {
      const newInfo = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
      baseInfo.value = newInfo
      currentPageId.value = newInfo.pageId
    })

    onMounted(() => {
      window.addEventListener('popstate', updateSearch)
      // 劫持 pushState / replaceState，使编程式跳转也能触发
      const { pushState, replaceState } = history
      history.pushState = function (...args) {
        pushState.apply(this, args)
        updateSearch()
      }
      history.replaceState = function (...args) {
        replaceState.apply(this, args)
        updateSearch()
      }
    })

    onUnmounted(() => {
      window.removeEventListener('popstate', updateSearch)
    })

    return {
      currentUser,
      visibleUsers,
      hiddenUsersCount,
      notifications
    }
  }
}
</script>

<style scoped>
.presence-container {
  position: fixed;
  bottom: 10px;
  right: 120px;
  z-index: 100000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.avatar-list {
  display: flex;
  padding: 6px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 22px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.avatar-wrapper {
  position: relative;
  width: 32px;
  height: 32px;
  margin-left: -8px;
  transition: transform 0.2s ease;
}

.avatar-wrapper.self-wrapper {
  transform: scale(1.05);
}

.you-label {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #007bff;
  color: white;
  font-size: 9px;
  font-weight: bold;
  padding: 1px 5px;
  border-radius: 6px;
  border: 1px solid white;
  line-height: 1.2;
}

.avatar-wrapper:first-child {
  margin-left: 0;
}
.avatar-wrapper:hover {
  transform: translateY(-3px);
}

.avatar-wrapper:hover .avatar.self {
  box-shadow: 0 0 12px rgba(0, 123, 255, 0.8);
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid white;
  object-fit: cover;
}

.avatar.self {
  border: 3px solid #007bff;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.6);
  animation: breathing-glow 2.5s infinite ease-in-out;
}

.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1.5px solid white;
}
.status-dot.online {
  background-color: #28a745;
}

.more-users {
  background-color: #e9ecef;
  color: #495057;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  border: 2px solid white;
}

/* --- 通知样式 --- */
.notification-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-bubble {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.4);
  color: white;
  border-radius: 20px;
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notification-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.notifications-enter-active,
.notifications-leave-active {
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.notifications-enter-from,
.notifications-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 用户信息悬浮窗 */
.user-tooltip {
  /* 1. 默认状态：隐藏、不可见、无交互 */
  position: absolute;
  bottom: 120%; /* 定位在头像正上方，留出一些间隙 */
  left: 50%;
  transform: translateX(-50%) translateY(10px); /* 初始时向下偏移一点，用于动画 */

  width: 240px; /* 固定宽度 */
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  padding: 16px;

  opacity: 0;
  visibility: hidden;
  pointer-events: none;

  /* 2. 添加平滑的过渡动画 */
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s;
  z-index: 10; /* 确保在其他头像之上 */
}

/* 3. 关键：当鼠标悬浮在 .avatar-wrapper 上时，显示悬浮框 */
.avatar-wrapper:hover .user-tooltip {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0); /* 向上移动到最终位置 */
}

/* 悬浮框内部样式 */
.tooltip-header {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.tooltip-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.tooltip-info {
  display: flex;
  flex-direction: column;
}

.tooltip-name {
  font-size: 16px;
  font-weight: 600;
  color: #212529;
}

.tooltip-status {
  font-size: 12px;
  color: #28a745; /* 绿色 */
  display: flex;
  align-items: center;
}
.tooltip-status::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #28a745;
  margin-right: 6px;
}

.tooltip-body {
  font-size: 13px;
  color: #6c757d;
}
.tooltip-body p {
  margin: 4px 0;
}

.editing-status {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 500;
  margin-top: 8px;
  line-height: 1.4;
  white-space: nowrap;
  animation: fadePulse 2.2s ease-in-out infinite;
}

.editing-status::before {
  content: '✏️';
  display: inline-block;
  font-size: 14px;
  animation: pencilMove 1.5s infinite ease-in-out;
}

.editing-target {
  display: inline-block;
  max-width: 200px;
  word-break: break-word;
  white-space: normal;
}

@keyframes fadePulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.6;
  }
}

@keyframes pencilMove {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0);
  }
}

.editing-target {
  background: rgba(37, 99, 235, 0.08);
  color: #1e40af;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 600;
}

@keyframes breathing-glow {
  0% {
    box-shadow: 0 0 4px rgba(0, 123, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 12px rgba(0, 123, 255, 0.9);
  }
  100% {
    box-shadow: 0 0 4px rgba(0, 123, 255, 0.4);
  }
}
</style>
