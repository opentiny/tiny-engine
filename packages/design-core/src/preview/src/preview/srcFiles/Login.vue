<template>
  <div class="login-wrapper">
    <iframe :src="url" class="login-iframe" frameBorder="0" scrolling="no"></iframe>
  </div>
</template>

<script>
export default {
  setup() {
    const url = ''

    return {
      url
    }
  }
}
</script>

<style scoped>
.login-wrapper {
  position: fixed;
  z-index: 999;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: #fff;
}
.login-iframe {
  width: 100%;
  height: 100%;
}
</style>
