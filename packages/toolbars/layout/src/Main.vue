<template>
  <span
    v-for="(item, index) in state.media"
    :key="index"
    :class="['icon', { active: state.arrActive.includes(index) }]"
    @click="togglePanel(item, index)"
  >
    <component :is="item.icon"></component>
  </span>
</template>

<script>
import { reactive } from 'vue'

export default {
  emits: ['click'],
  setup(props, { emit }) {
    const state = reactive({
      arrActive: [],
      media: [
        {
          action: 'toggleLeftColumn',
          icon: 'IconHideLeft'
        },
        {
          action: 'toggleRightColumn',
          icon: 'IconHideRight'
        }
      ]
    })

    const togglePanel = (item, index) => {
      let curIndex = state.arrActive.indexOf(index)

      if (curIndex > -1) {
        state.arrActive.splice(curIndex, 1)
      } else {
        state.arrActive.push(index)
      }
      emit('click', item)
    }

    return {
      state,
      togglePanel
    }
  }
}
</script>
