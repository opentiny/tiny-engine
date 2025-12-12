<template>
  <div class="login-main">
    <div class="login-title">欢迎登录</div>
    <tiny-form ref="ruleFormRef" :model="state.loginData">
      <tiny-form-item prop="username">
        <tiny-input v-model="state.loginData.username" placeholder="请输入用户名"></tiny-input>
      </tiny-form-item>
      <tiny-form-item prop="password">
        <tiny-input
          v-model="state.loginData.password"
          type="password"
          show-password
          placeholder="请输入密码"
        ></tiny-input>
      </tiny-form-item>
      <tiny-form-item>
        <tiny-button type="primary" @click="handleLogin"> 登录 </tiny-button>
      </tiny-form-item>
    </tiny-form>
    <div class="login-bottom">
      <div @click="toRegister">注册账号</div>
      <div @click="toForgot">忘记密码</div>
    </div>
    <div class="login-other">其他方式登录</div>
    <div class="github-link">
      <svg-icon class="github" name="github"></svg-icon>
    </div>
  </div>
</template>

<script lang="ts">
import { reactive } from 'vue'
import { TinyForm, TinyFormItem, TinyInput, TinyButton } from '@opentiny/vue'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import useLogin from './js/useLogin'

export default {
  components: {
    TinyForm,
    TinyFormItem,
    TinyInput,
    TinyButton
  },
  emits: ['changeStatus'],
  setup(props, { emit }) {
    const state = reactive({
      loginData: {
        username: '',
        password: ''
      }
    })

    const handleLogin = () => {
      getMetaApi(META_SERVICE.Http)
        .post('/platform-center/api/user/login', {
          username: state.loginData.username,
          password: state.loginData.password
        })
        .then((data) => {})
    }

    const toRegister = () => {
      emit('changeStatus', useLogin().REGISTER)
    }

    const toForgot = () => {
      emit('changeStatus', useLogin().FORGOT)
    }
    return {
      state,
      handleLogin,
      toRegister,
      toForgot
    }
  }
}
</script>

<style lang="less" scoped>
.login-title {
  color: #191919;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 28px;
}

.login-bottom {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  color: #1476ff;
  margin-bottom: 32px;
  div {
    cursor: pointer;
  }
}
.login-other {
  color: #808080;
  position: relative;
  padding-left: 40%;
  margin-bottom: 24px;
}

.login-other::before,
.login-other::after {
  content: '';
  position: absolute;
  top: 50%; /* 或者你想要的具体位置 */
  width: 38%; /* 横线的长度 */
  height: 1px; /* 横线的厚度 */
  background-color: #dbdbdb; /* 横线的颜色 */
}

.login-other::before {
  left: 0; /* 让横线贴合文本左侧 */
}

.login-other::after {
  right: 0; /* 让横线贴合文本右侧 */
}
.github-link {
  width: 100%;
  display: flex;
  justify-content: center;
  .github {
    width: 26px;
    height: 26px;
    cursor: pointer;
  }
}
:deep(.tiny-form-item__content) {
  margin-left: 0 !important;
}
:deep(.tiny-button.tiny-button.tiny-button.tiny-button) {
  width: 100%;
  background: #595959;
}
</style>
