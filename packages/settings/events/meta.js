import { commonEvents } from './src/commonjs/events.js'
import BindEventsDialogBodyLeft from './src/components/BindEventsDialogBodyLeft.vue'
import BindEventsDialogBodyRight from './src/components/BindEventsDialogBodyRight.vue'

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
    BindEventsDialogBodyLeft,
    BindEventsDialogBodyRight
  }
}
