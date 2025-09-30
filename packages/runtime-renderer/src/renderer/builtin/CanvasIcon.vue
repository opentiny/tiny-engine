<script>
import * as SvgIcons from '@opentiny/vue-icon'
import { h } from 'vue'

export default {
  props: {
    name: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    return () =>
      h('span', { class: 'iconwarp' }, [
        h(SvgIcons[props.name]?.(), { style: { width: '100%', height: '100%' } }) || 'error.'
      ])
  }
}
</script>

<style scoped>
.iconwarp {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  fill: currentColor;
  width: 1em;
  height: 1em;
}
</style>
