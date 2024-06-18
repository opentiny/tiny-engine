import { commonEvents } from './src/commonjs/events.js'
import BindEventsMethods from './src/components/BindEventsMethods.vue'

export default {
  id: 'engine.setting.event',
  title: '高级',
  type: 'setting',
  align: 'left',
  name: 'event',
  icon: '',
  options: {
    commonEvents
  },
  components: {
    // 事件绑定的函数列表组件
    BindEventsMethods
  }
}
