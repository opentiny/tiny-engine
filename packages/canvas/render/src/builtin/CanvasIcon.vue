<script>
import * as SvgIcons from '@opentiny/vue-icon'
import { Icon, addCollection } from '@iconify/vue'
import { h } from 'vue'

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
    const iconsStr = window.localStorage.getItem('icons')

    try {
      const icons = JSON.parse(iconsStr)

      icons.forEach((item) => {
        addCollection(item)
      })
    } catch (error) {
      const logger = console
      logger.error(error)
    }
  },
  setup(props) {
    return () => {
      return h('span', { class: 'iconwarp' }, [
        SvgIcons[props.name]
          ? h(SvgIcons[props.name]?.(), { style: { width: '100%', height: '100%' } }) || 'error.'
          : h(Icon, { icon: props.icon, style: { width: '100%', height: '100%' } })
      ])
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
