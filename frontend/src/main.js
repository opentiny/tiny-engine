import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
// import '@opentiny/vue/lib/index.css'; // 引入Tiny Vue样式

const app = createApp(App);
app.use(router);
app.mount('#app');