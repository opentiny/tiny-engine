<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h2 class="login-title">欢迎登录</h2>
      </div>
      <tiny-form label-width="80px" label-position="left" :inline="false">
        <tiny-form-item label="用户名">
          <tiny-input v-model="state.form.username" placeholder="请输入用户名"></tiny-input>
        </tiny-form-item>
        <tiny-form-item label="密码">
          <tiny-input v-model="state.form.password" type="password" placeholder="请输入密码"></tiny-input>
        </tiny-form-item>
        <tiny-form-item>
          <tiny-row :gutter="8">
            <tiny-col :span="12">
              <tiny-button type="primary" style="width: 100%" @click="onSubmit">登录</tiny-button>
            </tiny-col>
            <tiny-col :span="12">
              <tiny-button type="default" style="width: 100%" @click="onReset">重置</tiny-button>
            </tiny-col>
          </tiny-row>
        </tiny-form-item>
        <tiny-form-item>
          <div class="login-extra">
            <a href="#" class="link">忘记密码?</a>
            <a href="#" class="link">注册账号</a>
          </div>
        </tiny-form-item>
      </tiny-form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';

const state = reactive({
  form: {
    username: '',
    password: ''
  }
});

function onSubmit() {
  if (!state.form.username || !state.form.password) return;
  console.log('login', state.form);
}

function onReset() {
  state.form.username = '';
  state.form.password = '';
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9eff7 100%);
}

.login-card {
  width: 420px;
  background: #fff;
  border: 1px solid #eef0f5;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  padding: 24px 24px 16px;
}

.login-header {
  text-align: center;
  margin-bottom: 12px;
}

.login-title {
  margin: 0;
  font-size: 22px;
  color: #1f2329;
}

.login-subtitle {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.login-extra {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.link {
  color: #344899;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
