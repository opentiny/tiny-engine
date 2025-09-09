<template>
  <div class="collab-ui-manager">
    <div v-for="cursor in processedCursors" :key="cursor.clientId">
      <div
        class="cursor-positioner"
        :style="{ transform: `translate(${cursor.position.x}px, ${cursor.position.y}px)` }"
      >
        <div
          class="custom-cursor"
          :class="{
            active: !cursor.state.cursor.pressed,
            outside: cursor.position.isOutside
          }"
          :style="{ transform: `rotate(${cursor.position.rotation}deg)` }"
        >
          <svg
            t="1757318690357"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="2061"
            width="16"
            height="16"
          >
            <path
              :fill="cursor.state.user.color"
              d="M143.832313 5.834982H143.686438A108.676545 108.676545 0 0 0 5.834982 143.686438l34.499333-11.815839-34.499333 11.815839 0.072938 0.218812 0.145874 0.437624 0.583498 1.750494 2.333993 6.71023 8.752474 25.528047L49.232663 269.867929a2254749.467572 2254749.467572 0 0 1 223.917444 652.351017l9.335972 27.205605 2.552804 7.585476 0.729373 2.188119a72.572592 72.572592 0 0 0 126.181491 40.844876 72.134968 72.134968 0 0 0 14.076895-18.963693c3.282178-6.41848 5.689108-13.639271 8.023101-20.3495l0.072937-0.291749 72.572592-209.329989 47.409231-136.830334 15.53564-44.710551 0.145874-0.364687 0.510561-0.145874 45.002301-15.900327 137.486769-48.649165c99.340573-35.228705 202.984445-71.989094 209.913487-74.906584l3.355115-1.312871c8.023101-3.136303 22.391744-8.606599 33.915834-20.130689a72.499655 72.499655 0 0 0 0-102.549813L999.240712 304.877823c-1.823432-1.969307-7.293728-7.731351-13.274585-11.961714a89.056417 89.056417 0 0 0-27.205605-12.3264h-0.145874l-2.552805-0.875247L948.184617 277.161657l-27.86204-9.263034-94.672588-31.800653A405018.007245 405018.007245 0 0 1 268.919745 48.138604L178.039896 17.504947 152.657723 8.752473 145.874556 6.637292 144.196999 5.90792 143.832313 5.834982z"
              p-id="2062"
            ></path>
          </svg>
          <div
            v-if="!cursor.position.isOutside"
            class="cursor-label"
            :style="{ backgroundColor: cursor.state.user.color }"
          >
            {{ cursor.state.user.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useCollabCursor } from '@opentiny/tiny-engine-multi-person-collaboration'
import { computed, reactive } from 'vue'
import { useViewport } from './composables/useViewport'

export default {
  name: 'Cursor',
  setup() {
    const currentUser = {
      id: 'user-2',
      name: 'Bob',
      color: '#1296db'
    }

    const collabState = reactive(
      useCollabCursor({
        roomId: 'cursor-yjs',
        currentUser
      })
    )

    const { viewport } = useViewport()

    const processedCursors = computed(() => {
      return Object.entries(collabState.remoteCursors).map(([clientId, state]) => {
        if (!state.cursor) {
          return { clientId, state, position: {} }
        }

        const { x: pageX, y: pageY } = state.cursor

        const viewLeft = viewport.scrollX
        const viewRight = viewport.scrollX + viewport.width
        const viewTop = viewport.scrollY
        const viewBottom = viewport.scrollY + viewport.height

        const isInside = pageX >= viewLeft && pageX <= viewRight && pageY >= viewTop && pageY <= viewBottom

        let position = {}
        if (isInside) {
          position = {
            x: pageX - viewport.scrollX,
            y: pageY - viewport.scrollY,
            rotation: 0,
            isOutside: false
          }
        } else {
          const padding = 5
          const clampedX = Math.max(viewLeft + padding, Math.min(pageX, viewRight - padding))
          const clampedY = Math.max(viewTop + padding, Math.min(pageY, viewBottom - padding))

          const centerX = viewLeft + viewport.width / 2
          const centerY = viewTop + viewport.height / 2
          const angle = Math.atan2(pageY - centerY, pageX - centerX) * (180 / Math.PI)

          position = {
            x: clampedX - viewport.scrollX,
            y: clampedY - viewport.scrollY,
            rotation: angle,
            isOutside: true
          }
        }

        return {
          clientId,
          state,
          position
        }
      })
    })
    return {
      processedCursors
    }
  }
}
</script>

<style scoped>
.collab-ui-manager {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 99999;
  overflow: visible !important;
}

.cursor-positioner {
  position: absolute;
  top: 0;
  left: 0;
  transition: transform 0.05s linear;
}

.custom-cursor {
  width: 20px;
  height: 20px;
  transition: transform 0.12s ease-out, opacity 0.2s ease;
}

.custom-cursor .icon {
  width: 100%;
  height: 100%;
  filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.4));
  transition: transform 0.1s ease;
}

.custom-cursor:not(.active) .icon {
  transform: scale(0.9);
}

.custom-cursor.outside {
  width: 24px;
  height: 24px;
  opacity: 0.8;
}

.custom-cursor.outside .cursor-label {
  display: none;
}

.cursor-label {
  position: absolute;
  top: 90%; /* 在光标正下方 */
  left: 80%; /* 从光标中心开始 */
  margin-top: 8px;
  padding: 4px 12px;
  border-radius: 16px;
  color: white;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  opacity: 1;
  transition: opacity 0.3s ease, transform 0.3s ease;
}
</style>
