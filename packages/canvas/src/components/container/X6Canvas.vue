<template>
  <div id="container" style="width: 100%; height: 100%"></div>
</template>

<script setup>
import { onMounted } from 'vue'
import { Graph } from '@antv/x6'

onMounted(() => {
  new Graph({
    container: document.getElementById('container'),
    background: {
      color: '#F2F7FA'
    },
    grid: {
      visible: true,
      type: 'doubleMesh',
      args: [
        {
          color: '#eee',
          thickness: 1
        },
        {
          color: '#ddd',
          thickness: 1,
          factor: 4
        }
      ]
    },
    panning: true,
    mousewheel: {
      enabled: true,
      modifiers: 'Ctrl',
      maxScale: 4,
      minScale: 0.2
    },
    autoResize: true
  })
})
</script>
