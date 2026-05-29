<template>
  <div class="login">
    <div class="login-left">
      <div class="login-img"></div>
    </div>
    <div class="login-right">
      <div class="login-form">
        <login v-if="state.loginStatus === LOGIN" @changeStatus="changeStatus"></login>
        <register v-if="state.loginStatus === REGISTER" @changeStatus="changeStatus"></register>
        <forgot-password v-if="state.loginStatus === FORGOT" @changeStatus="changeStatus"></forgot-password>
        <register-success v-if="state.loginStatus === SUCCESS" @changeStatus="changeStatus"></register-success>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { reactive } from 'vue'
import Login from './Login.vue'
import Register from './Register.vue'
import ForgotPassword from './ForgotPassword.vue'
import RegisterSuccess from './RegisterSuccess.vue'
import useLogin from './js/useLogin'

export default {
  components: {
    Login,
    Register,
    ForgotPassword,
    RegisterSuccess
  },
  setup() {
    const LOGIN = useLogin().LOGIN
    const REGISTER = useLogin().REGISTER
    const FORGOT = useLogin().FORGOT
    const SUCCESS = useLogin().SUCCESS
    const state = reactive({
      loginStatus: LOGIN
    })

    const changeStatus = (status) => {
      state.loginStatus = status
    }

    return {
      state,
      LOGIN,
      REGISTER,
      FORGOT,
      SUCCESS,
      changeStatus
    }
  }
}
</script>

<style lang="less" scoped>
.login {
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  background: linear-gradient(to top left, #e7f0ff, #fff);
  display: flex;
  padding: 10% 10% 0 10%;
  .login-left {
    flex: 2;
    .login-img {
      max-height: 500px;
      width: 100%;
      height: 100%;
      background-image: url(../../assets/login-bg.svg);
      background-repeat: no-repeat;
      background-size: contain;
      background-position: center center;
    }
  }

  .login-right {
    flex: 1.2;
    margin-top: 50px;
    margin-left: 80px;
    .login-form {
      box-sizing: border-box;
      max-width: 440px;
      min-width: 340px;
      width: 100%;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 40px 0 #dce6f6;
      padding: 52px 60px 80px 60px;
      max-height: 100%;
      overflow-y: auto;
    }
  }

  :deep(.tiny-form-item__content) {
    margin-left: 0 !important;
  }
  :deep(.tiny-button.tiny-button.tiny-button.tiny-button) {
    width: 100%;
    background: #191919;
    height: 32px;
    margin-top: 20px;
    font-size: 14px;
  }
  :deep(.tiny-button.tiny-button.tiny-button.tiny-button.tiny-button--primary) {
    border: none;
  }
  :deep(.tiny-input.tiny-input .tiny-input__inner.tiny-input__inner) {
    height: 32px;
    font-size: 14px;
  }
  :deep(.tiny-input.tiny-input .tiny-input__inner.tiny-input__inner)::placeholder {
    font-size: 14px;
  }

  :deep(.tiny-form.tiny-form.tiny-form .tiny-form-item) {
    margin-bottom: 20px;
  }
}
</style>
