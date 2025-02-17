<script>
import { Icon, addCollection } from '@iconify/vue'
import { h } from 'vue'
import icons from './icons.json'

export default {
  props: {
    name: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    }
  },
  mounted() {
    // 注册离线图标集
    icons.forEach((iconSet) => {
      addCollection(iconSet)
    })
  },
  setup(props) {
    return () => {
      return h('span', { class: 'iconwarp' }, [h(Icon, { icon: props.icon, style: { width: '100%', height: '100%' } })])
    }
  }
}
</script>

<style scoped>
.iconwarp {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  fill: currentColor;
  width: 1.5em;
  height: 1.5em;
}
</style>
