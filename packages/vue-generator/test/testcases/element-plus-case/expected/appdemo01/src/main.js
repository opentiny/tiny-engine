import { createApp } from 'vue'
import router from '@/router/index.js'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import 'element-plus/dist/index.css'
const pinia = createPinia()
createApp(App).use(pinia).use(router).mount('#app')
