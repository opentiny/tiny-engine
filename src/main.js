import { createApp } from 'vue'
import App from './App.vue'
import i18n from './lib'

i18n.global.mergeLocaleMessage('en_US', { hello: 'Hello!' })
i18n.global.mergeLocaleMessage('zh_CN', { hello: '你好！' })

// use(i18n) 可以让 app 内的 vue 组件使用 useI18n
createApp(App).use(i18n).mount('#app')
