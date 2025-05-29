<template>
  <div v-if="visible" class="tiny-popup__wrapper">
    <div class="tiny-sso__box">
      <div class="tiny-sso__body">
        <iframe :src="url" class="tiny-sso__body-iframe" frameBorder="0" scrolling="no"></iframe>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  setup() {
    const visible = ref(false)
    const url = ref('')

    const openLogin = (procession, newUrl) => {
      visible.value = true
      url.value = newUrl

      return new Promise((resolve, reject) => {
        procession.mePromise.resolve = resolve
        procession.mePromise.reject = reject
      })
    }

    const closeLogin = () => {
      visible.value = false
    }

    return {
      openLogin,
      closeLogin,
      visible,
      url
    }
  }
}
</script>

<style scoped lang="less">
.tiny-popup__wrapper {
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  overflow: auto;
  margin: 0;

  .tiny-sso__box {
    position: absolute;
    background: #fff;
    border: 1px solid transparent;
    box-shadow: 2px 2px 2px 0 rgba(0, 0, 0, 0.2);
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);

    .tiny-sso__body {
      text-align: initial;
      padding: 20px;
      color: #5a5e66;
      line-height: 32px;
      font-size: 14px;

      .tiny-sso__body-iframe {
        width: 450px;
        height: 450px;
        overflow: hidden;
        //兼容edge
        @supports (-ms-ime-align: auto) {
          height: 460px;
        }
      }
    }
  }
}
</style>
