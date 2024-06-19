import { commonEvents } from './src/commonjs/events.js'
import BindEventsDialogContent from './src/components/BindEventsDialogContent.vue'
import BindEventsDialogSidebar from './src/components/BindEventsDialogSidebar.vue'

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
    BindEventsDialogSidebar,
    BindEventsDialogContent
  }
}
