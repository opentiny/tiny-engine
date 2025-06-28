<template>
  <view class="content">
    <image class="logo" src="/static/logo.png"></image>
    <view class="text-area">
      <text class="title">{{ title }}</text>
    </view>
    <view class="description">
      <text>{{ description }}</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      title: '$$TinyEngine{projectName}END$',
      description: '$$TinyEngine{description}END$'
    }
  },
  onLoad() {
    console.log('页面加载完成')
  },
  methods: {
    // 页面方法
  }
}
</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin-top: 200rpx;
  margin-bottom: 50rpx;
}

.text-area {
  display: flex;
  justify-content: center;
  margin-top: 30rpx;
}

.title {
  font-size: 36rpx;
  color: #333;
  font-weight: bold;
}

.description {
  margin-top: 30rpx;
  font-size: 28rpx;
  color: #666;
  text-align: center;
}
</style>