<template>
  <div class="forgot-main">
    <div class="forgot-title">忘记密码</div>
    <tiny-form ref="ruleFormRef" :model="state.forgotData">
      <tiny-form-item prop="username">
        <tiny-input v-model="state.forgotData.username" placeholder="请输入用户名"></tiny-input>
      </tiny-form-item>
      <tiny-form-item prop="key">
        <tiny-input v-model="state.forgotData.key" placeholder="请输入账户恢复代码"></tiny-input>
      </tiny-form-item>
      <tiny-form-item prop="password">
        <tiny-tooltip v-model="state.pwManualShow" placement="bottom" effect="light" manual>
          <template #content>
            <div>
              <div class="pw-tips" v-for="(item, idx) in state.rules" :key="idx">
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
            v-model="state.forgotData.password"
            type="password"
            show-password
            placeholder="请输入新密码"
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
            v-model="state.forgotData.confirmPassword"
            type="password"
            show-password
            placeholder="请确认新密码"
          ></tiny-input>
        </tiny-tooltip>
      </tiny-form-item>
      <tiny-form-item>
        <tiny-button :disabled="!isReady" type="primary" @click="handleForgot"> 提交</tiny-button>
      </tiny-form-item>
    </tiny-form>
    <div class="forgot-bottom">
      <div class="to-login" @click="toLogin">去登录</div>
    </div>
  </div>
</template>

<script lang="ts">
import { reactive, watch, computed } from 'vue'
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
      forgotData: {
        username: '',
        key: '',
        password: '',
        confirmPassword: ''
      },
      usernameManualShow: false,
      pwManualShow: false,
      confirmManualShow: false,
      rules: [...useLogin().passwordRules]
    })

    const isReady = computed(() => {
      return (
        state.forgotData.username &&
        state.forgotData.password &&
        state.forgotData.key &&
        state.forgotData.confirmPassword &&
        !state.pwManualShow &&
        state.forgotData.confirmPassword === state.forgotData.password
      )
    })

    const handleConfirmPwChange = () => {
      if (state.forgotData.confirmPassword !== state.forgotData.password) {
        state.confirmManualShow = true
      } else {
        state.confirmManualShow = false
      }
    }

    const handleForgot = () => {
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
        .post('/platform-center/api/user/forgot-password', {
          username: state.forgotData.username,
          password: state.forgotData.password,
          publicKey: state.forgotData.key
        })
        .then(() => {
          emit('changeStatus', useLogin().LOGIN)
        })
    }

    const handlePwChange = () => {
      state.rules.forEach((item) => {
        item.pass = item.rule.test(state.forgotData.password)
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
      () => state.forgotData.password,
      () => {
        handlePwChange()
      }
    )
    return {
      state,
      isReady,
      handleForgot,
      toLogin
    }
  }
}
</script>

<style lang="less" scoped>
.forgot-title {
  color: #191919;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 36px;
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

.forgot-bottom {
  display: flex;
  justify-content: center;
  font-size: 14px;
  .to-login {
    cursor: pointer;
    color: #1476ff;
  }
}

:deep(.tiny-form-item__content) {
  margin-left: 0 !important;
}
:deep(.tiny-button.tiny-button.tiny-button.tiny-button) {
  margin-top: 10px;
  width: 100%;
  background: #595959;
}
</style>
