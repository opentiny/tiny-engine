<template>
  <div class="user-card">
    <div class="header">
      <h2>{{ state.userInfo.name }}</h2>
      <span class="status" :class="{ active: state.userInfo.isActive }">
        {{ state.userInfo.isActive ? '在线' : '离线' }}
      </span>
    </div>

    <div class="content">
      <p>邮箱: {{ state.userInfo.email }}</p>
      <p>年龄: {{ state.userInfo.age }}</p>
      <p>注册时间: {{ formatDate(state.userInfo.createTime) }}</p>
    </div>

    <div class="actions">
      <button @click="editUser" :disabled="!canEdit" class="btn btn-primary">编辑用户</button>
      <button @click="deleteUser" class="btn btn-danger" v-if="state.userInfo.canDelete">删除用户</button>
    </div>

    <div class="statistics" v-if="showStats">
      <h3>用户统计</h3>
      <ul>
        <li>总登录次数: {{ state.userStats.loginCount }}</li>
        <li>最后登录: {{ formatDate(state.userStats.lastLogin) }}</li>
        <li>账户等级: {{ userLevel }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

export default {
  name: 'UserCard',
  props: {
    userId: { type: [String, Number], required: true },
    showStats: { type: Boolean, default: false }
  },
  emits: ['user-updated', 'user-deleted'],
  setup(props, { emit }) {
    const state = reactive({
      userInfo: {
        name: '',
        email: '',
        age: 0,
        isActive: false,
        canDelete: true,
        createTime: null
      },
      userStats: {
        loginCount: 0,
        lastLogin: null
      }
    })
    const loading = ref(false)
    const error = ref(null)

    const canEdit = computed(() => state.userInfo.isActive && !loading.value)
    const userLevel = computed(() => {
      const count = userStats.loginCount
      if (count > 100) return 'VIP'
      if (count > 50) return '高级用户'
      if (count > 10) return '普通用户'
      return '新用户'
    })

    const fetchUserData = async () => {
      loading.value = true
      error.value = null
      try {
        const response = await fetch(`/api/users/${props.userId}`)
        const data = await response.json()
        Object.assign(userInfo, data.user)
        Object.assign(userStats, data.stats)
      } catch (err) {
        error.value = err.message
      } finally {
        loading.value = false
      }
    }

    const formatDate = (timestamp) => (timestamp ? new Date(timestamp).toLocaleDateString('zh-CN') : '未知')

    const editUser = () => {
      if (!canEdit.value) return
      emit('user-updated', { userId: props.userId, action: 'edit' })
    }

    const deleteUser = () => {
      if (!userInfo.canDelete) return
      emit('user-deleted', { userId: props.userId, userName: userInfo.name })
    }

    onMounted(() => {
      fetchUserData()
    })
    onUnmounted(() => {})

    return { userInfo, userStats, loading, error, canEdit, userLevel, fetchUserData, formatDate, editUser, deleteUser }
  }
}
</script>

<style scoped>
.user-card {
  padding: 20px;
}
</style>
