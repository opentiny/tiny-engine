<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { I18nInjectionKey } from 'vue-i18n'
import { provide } from 'vue'
import i18n from './i18n'

provide(I18nInjectionKey, i18n)


onLaunch(() => {
  console.log("App Launch");
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>

<style>
/* 全局样式 */
/*每个页面公共css */
page {
  min-height: 100%;
  display: flex;
}

/* #ifdef MP */
page {
  background-color: #f8f8f8;
}
/* #endif */

/* 适配iPhone X底部安全区域 */
.safe-area-inset-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>