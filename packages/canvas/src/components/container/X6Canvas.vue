<template>
  <div style="width: 100%; height: 100%">
    <div id="container" style="width: 100%; height: 100%"></div>
    <teleport-content />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useX6 } from './x6.js'
import { register, getTeleport } from '@antv/x6-vue-shape'
import AlgoNode from './AlgoNode.vue'

const teleportContent = getTeleport()

onMounted(() => {
  const g = useX6('container')
  // register()
  register({
    shape: 'dag-node',
    width: 180,
    height: 36,
    component: AlgoNode,
    ports: {
      groups: {
        top: {
          position: 'top',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#C2C8D5',
              strokeWidth: 1,
              fill: '#fff'
            }
          }
        },
        bottom: {
          position: 'bottom',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#C2C8D5',
              strokeWidth: 1,
              fill: '#fff'
            }
          }
        }
      }
    }
  })
  g.addNode({
    shape: 'dag-node',
    // x: 100,
    // y: 60,
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
  // g.addNode({
  //   shape: 'rect',
  //   x: 100,
  //   y: 40,
  //   width: 100,
  //   height: 40,
  //   ports: {
  //     groups: {
  //       top: {
  //         position: 'top',
  //         attrs: {
  //           circle: {
  //             magnet: true,
  //             stroke: '#8f8f8f',
  //             r: 5,
  //           },
  //         },
  //       },
  //       bottom: {
  //         position: 'bottom',
  //         attrs: {
  //           circle: {
  //             magnet: true,
  //             stroke: '#8f8f8f',
  //             r: 5,
  //           },
  //         },
  //       },
  //     },
  //     items: [
  //       {
  //         id: 'in',
  //         group: 'top',
  //       },
  //       {
  //         id: 'out',
  //         group: 'bottom',
  //       },
  //     ]
  //   },
  // })
  // g.addNode({
  //   shape: 'rect',
  //   x: 100,
  //   y: 40,
  //   width: 100,
  //   height: 40,
  //   ports: {
  //     groups: {
  //       top: {
  //         position: 'top',
  //         attrs: {
  //           circle: {
  //             magnet: true,
  //             stroke: '#8f8f8f',
  //             r: 5,
  //           },
  //         },
  //       },
  //       bottom: {
  //         position: 'bottom',
  //         attrs: {
  //           circle: {
  //             magnet: true,
  //             stroke: '#8f8f8f',
  //             r: 5,
  //           },
  //         },
  //       },
  //     },
  //     items: [
  //       {
  //         id: 'in',
  //         group: 'top',
  //       },
  //       {
  //         id: 'out',
  //         group: 'bottom',
  //       },
  //     ]
  //   },
  // })
  // g.addNode({
  //   shape: 'rect',
  //   x: 100,
  //   y: 40,
  //   width: 100,
  //   height: 40,
  //   ports: {
  //     groups: {
  //       top: {
  //         position: 'top',
  //         attrs: {
  //           circle: {
  //             magnet: true,
  //             stroke: '#8f8f8f',
  //             r: 5,
  //           },
  //         },
  //       },
  //       bottom: {
  //         position: 'bottom',
  //         attrs: {
  //           circle: {
  //             magnet: true,
  //             stroke: '#8f8f8f',
  //             r: 5,
  //           },
  //         },
  //       },
  //     },
  //     items: [
  //       {
  //         id: 'in',
  //         group: 'top',
  //       },
  //       {
  //         id: 'out',
  //         group: 'bottom',
  //       },
  //     ]
  //   },
  // })
})
</script>
