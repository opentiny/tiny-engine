<template>
  <div class="register-main">
    <div class="register-title">注册账号</div>
    <tiny-form :model="state.registerData">
      <tiny-form-item prop="username">
        <tiny-input v-model="state.registerData.username" placeholder="请输入用户名"></tiny-input>
      </tiny-form-item>
      <tiny-form-item prop="password">
        <tiny-tooltip v-model="state.pwManualShow" placement="bottom" effect="light" manual>
          <template #content>
            <div>
              <div class="pw-tips" v-for="item in state.rules" :key="item.rule">
                <div class="pw-icon">
                  <svg-icon v-if="item.pass" class="pw-success" name="pw-success"></svg-icon>
                  <svg-icon v-else class="pw-error" name="pw-error"></svg-icon>
                </div>
                <div class="pw-content">
                  <div class="pw-content-item" v-for="content in item.content" :key="content">{{ content }}</div>
                </div>
              </div>
            </div>
          </template>
          <tiny-input
            v-model="state.registerData.password"
            type="password"
            show-password
            placeholder="请输入密码"
          ></tiny-input>
        </tiny-tooltip>
      </tiny-form-item>
      <tiny-form-item prop="confirmPassword">
        <tiny-tooltip v-model="state.confirmManualShow" placement="bottom" effect="light" manual>
          <template #content>
            <div>
              <div class="pw-tips">
                <div class="pw-icon">
                  <svg-icon class="pw-error" name="pw-error"></svg-icon>
                </div>
                <div class="pw-content">两次输入密码不一致。</div>
              </div>
            </div>
          </template>
          <tiny-input
            v-model="state.registerData.confirmPassword"
            type="password"
            show-password
            placeholder="请确认密码"
          ></tiny-input>
        </tiny-tooltip>
      </tiny-form-item>
      <tiny-form-item>
        <tiny-button type="primary" @click="handleRegister"> 注册</tiny-button>
      </tiny-form-item>
    </tiny-form>
    <div class="register-bottom">
      <span>已有账号，</span>
      <span class="to-login" @click="toLogin">去登录</span>
    </div>
  </div>
</template>

<script lang="ts">
import { reactive, watch } from 'vue'
import { TinyForm, TinyFormItem, TinyInput, TinyButton, TinyTooltip } from '@opentiny/vue'
import useLogin from './js/useLogin'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinyForm,
    TinyFormItem,
    TinyInput,
    TinyButton,
    TinyTooltip
  },
  emits: ['changeStatus'],
  setup(props, { emit }) {
    const state = reactive({
      registerData: {
        username: '',
        password: '',
        confirmPassword: ''
      },
      pwManualShow: false,
      confirmManualShow: false,
      rules: [...useLogin().passwordRules]
    })

    const handleConfirmPwChange = () => {
      if (state.registerData.confirmPassword !== state.registerData.password) {
        state.confirmManualShow = true
      } else {
        state.confirmManualShow = false
      }
    }

    const handleRegister = () => {
      if (state.pwManualShow) {
        return
      }

      handleConfirmPwChange()
      if (state.confirmManualShow) {
        setTimeout(() => {
          state.confirmManualShow = false
        }, 1000)

        return
      }

      getMetaApi(META_SERVICE.Http)
        .post('/platform-center/api/user/register', {
          username: state.registerData.username,
          password: state.registerData.password
        })
        .then((data) => {
          useLogin().userState.publicKey = data?.publicKey

          emit('changeStatus', useLogin().SUCCESS)
        })
    }

    const handlePwChange = () => {
      state.rules.forEach((item) => {
        item.pass = item.rule.test(state.registerData.password)
      })
      if (state.rules.every((item) => item.pass)) {
        state.pwManualShow = false
      } else {
        state.pwManualShow = true
      }
    }

    const toLogin = () => {
      emit('changeStatus', useLogin().LOGIN)
    }

    watch(
      () => state.registerData.password,
      () => {
        handlePwChange()
      }
    )

    return {
      state,
      handleRegister,
      handlePwChange,
      toLogin
    }
  }
}
</script>

<style lang="less" scoped>
.register-title {
  color: #191919;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 28px;
}

.pw-tips {
  display: flex;
  .pw-icon {
    margin-right: 8px;
    width: 16px;
    height: 16px;
    color: #fff;
  }
  .pw-content {
    display: flex;
    flex-direction: column;
    .pw-content-item {
      line-height: 22px;
    }
  }
}

.register-bottom {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  color: #808080;
  margin-bottom: 32px;
  .to-login {
    cursor: pointer;
    color: #1476ff;
  }
}

:deep(.tiny-form-item__content) {
  margin-left: 0 !important;
}
:deep(.tiny-button.tiny-button.tiny-button.tiny-button) {
  width: 100%;
  background: #595959;
}
:deep(.tiny-tooltip.tiny-tooltip.tiny-tooltip__popper[class*='is-light']) {
  margin-left: 48px !important;
  margin-right: 48px;
}
</style>
