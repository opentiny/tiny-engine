<template>
  <div style="width: 100%; height: 100%">
    <div id="container" style="width: 100%; height: 100%"></div>
    <teleport-content />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useX6 } from '@opentiny/tiny-engine-controller'
// import { useX6 } from './x6.js'
import { getTeleport } from '@antv/x6-vue-shape'

const teleportContent = getTeleport()

onMounted(() => {
  const g = useX6('container')
  g.addNode({
    shape: 'dag-node',

    data: {
      label: 'CNN'
    },
    ports: [
      {
        id: 'in',
        group: 'top'
      },
      {
        id: 'out',
        group: 'bottom'
      }
    ]
  })
})
</script>
