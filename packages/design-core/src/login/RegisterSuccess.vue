<template>
  <div class="success-main">
    <svg-icon class="register-success" name="register-success"></svg-icon>
    <div class="success-title">注册成功</div>
    <div class="success-text">
      <div class="success-key">
        您的账户恢复代码已生成：
        <span>{{ publicKey }}<svg-icon class="login-copy" name="login-copy" @click="copy"></svg-icon></span>
      </div>
      <div class="success-tips">请立即妥善保存，这是您在忘记密码时重新获取账户访问权的唯一凭证。</div>
    </div>

    <tiny-checkbox v-model="state.checked" name="tiny-checkbox">我已保存账户恢复代码</tiny-checkbox>
    <tiny-button v-if="state.checked" type="primary" @click="toLogin"> 去登录</tiny-button>
  </div>
</template>

<script lang="ts">
import { reactive, computed } from 'vue'
import { TinyCheckbox, TinyButton } from '@opentiny/vue'
import useLogin from './js/useLogin'
import { useModal } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinyCheckbox,
    TinyButton
  },
  emits: ['changeStatus'],
  setup(props, { emit }) {
    const state = reactive({
      checked: false
    })

    const publicKey = computed(() => useLogin().userState.publicKey)

    const toLogin = () => {
      emit('changeStatus', useLogin().LOGIN)
    }

    const copy = async () => {
      try {
        await navigator.clipboard.writeText(publicKey.value)
        useModal().message({ message: '复制成功', status: 'success' })
      } catch (err) {
        useModal().message({ message: '复制失败', status: 'error' })
      }
    }

    return {
      state,
      publicKey,
      toLogin,
      copy
    }
  }
}
</script>

<style lang="less" scoped>
.success-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .register-success {
    width: 80px;
    height: 80px;
    margin-bottom: 8px;
  }
  .success-title {
    color: #191919;
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 20px;
  }
  .success-key,
  .success-tips {
    color: #595959;
    line-height: 18px;
  }
  .success-key {
    display: flex;
    flex-direction: column;
    word-break: break-word;
    .login-copy {
      width: 16px;
      height: 16px;
      margin-left: 4px;
      cursor: pointer;
    }
  }
  .success-text {
    margin-bottom: 20px;
  }
}
</style>
