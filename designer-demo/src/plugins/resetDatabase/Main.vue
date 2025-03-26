<template>
  <div class="reset-database">
    <tiny-button plain @click="toggleDialog(true)">重置本地数据</tiny-button>
    <tiny-dialog-box v-model:visible="dialogVisible" title="重置本地数据" width="30%" append-to-body>
      <span>您确定要重复本地数据吗？您在Demo应用所有的数据改动都将被重置！</span>
      <template #footer>
        <div class="footer">
          <tiny-button @click="toggleDialog(false)"> 取消 </tiny-button>
          <tiny-button type="primary" @click="handleReset"> 确定 </tiny-button>
        </div>
      </template>
    </tiny-dialog-box>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { TinyButton, TinyDialogBox } from '@opentiny/vue'
import { useNotify } from '@opentiny/tiny-engine'
import { resetDataBase } from '../../db'

const dialogVisible = ref(false)

const toggleDialog = (visible) => {
  dialogVisible.value = visible
}
const handleReset = async () => {
  await resetDataBase()
  toggleDialog(false)

  useNotify({
    type: 'success',
    message: '重置成功，即将重新加载页面'
  })

  setTimeout(() => {
    const url = new URL(window.location.href)
    url.searchParams.delete('blockid')
    url.searchParams.set('pageid', 1)
    url.searchParams.set('id', 1)
    url.searchParams.set('tenant', 1)
    // 重置 url 参数
    window.history.replaceState({}, '', url)
    // 重新加载页面
    window.location.reload()
  }, 2000)
}
</script>

<style lang="less" scoped>
.footer {
  display: flex;
  column-gap: 10px;
}
</style>
