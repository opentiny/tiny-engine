<template>
  <div class="login">
    <div class="login-left">
      <div class="login-img"></div>
    </div>
    <div class="login-right">
      <div class="login-form">
        <login v-if="state.loginStatus === LOGIN" @toForgot="toForgot" @toRegister="toRegister"></login>
        <register v-if="state.loginStatus === REGISTER" @toLogin="toLogin" @toSuccess="toSuccess"></register>
        <forgot-password v-if="state.loginStatus === FORGOT" @toLogin="toLogin"></forgot-password>
        <register-success v-if="state.loginStatus === SUCCESS" @toLogin="toLogin"></register-success>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { reactive } from 'vue'
import { TinyForm, TinyFormItem, TinyInput, TinyButton } from '@opentiny/vue'
import Login from './Login.vue'
import Register from './Register.vue'
import ForgotPassword from './ForgotPassword.vue'
import RegisterSuccess from './RegisterSuccess.vue'

export default {
  components: {
    TinyForm,
    TinyFormItem,
    TinyInput,
    TinyButton,
    Login,
    Register,
    ForgotPassword,
    RegisterSuccess
  },
  setup() {
    const LOGIN = 'login'
    const REGISTER = 'register'
    const FORGOT = 'forgot'
    const SUCCESS = 'success'

    const state = reactive({
      loginStatus: FORGOT
    })

    const toLogin = () => {
      state.loginStatus = LOGIN
    }

    const toRegister = () => {
      state.loginStatus = REGISTER
    }

    const toForgot = () => {
      state.loginStatus = FORGOT
    }

    const toSuccess = () => {
      state.loginStatus = SUCCESS
    }

    return {
      state,
      LOGIN,
      REGISTER,
      FORGOT,
      SUCCESS,
      toLogin,
      toRegister,
      toForgot
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
  padding: 10%;
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
    flex: 1;
    margin-left: 80px;
    .login-form {
      box-sizing: border-box;
      max-width: 440px;
      min-width: 340px;
      max-height: 500px;
      width: 100%;
      height: 100%;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 40px 0 #dce6f6;
      padding: 48px 60px;
    }
  }
}
</style>
