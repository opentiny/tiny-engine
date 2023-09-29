<script>
import { h } from 'vue'

export default {
  name: 'Splitpanes',

  provide() {
    return {
      onPaneClick: this.onPaneClick,
      onPaneAdd: this.onPaneAdd,
      requestUpdate: this.requestUpdate,
      onPaneRemove: this.onPaneRemove
    }
  },

  props: {
    horizontal: { type: Boolean },
    pushOtherPanes: { type: Boolean, default: true },
    dblClickSplitter: { type: Boolean, default: true },
    rtl: { type: Boolean, default: false },
    firstSplitter: { type: Boolean }
  },
  emits: ['ready', 'resize', 'resized', 'pane-click', 'pane-maximize', 'pane-add', 'pane-remove', 'splitter-click'],

  data: () => ({
    ready: false,
    container: null,
    touch: {
      dragging: false,
      activeSplitter: null,
      mouseDown: false
    },
    panes: [],
    lowcodeSplitterTaps: {
      timeoutId: null,
      splitter: null
    }
  }),

  computed: {
    indexedPanes() {
      return this.panes.reduce((obj, pane) => {
        obj[pane.id] = pane
        return obj
      }, {})
    },
    panesCount() {
      return this.panes.length
    }
  },

  watch: {
    horizontal() {
      this.updateLowCodePaneComponents()
    },
    panes: {
      deep: true,
      immediate: false,
      handler() {
        this.updateLowCodePaneComponents()
      }
    },
    firstSplitter() {
      this.redoLowCodeSplitters()
    },
    dblClickSplitter(enable) {
      const splitters = [...this.container.querySelectorAll('.splitpanes-lowcode__splitter')]
      splitters.forEach((item, i) => {
        item.ondblclick = enable ? (event) => this.onSplitterDblClick(event, i) : undefined
      })
    }
  },
  mounted() {
    this.container = this.$refs.container
    this.checkLowCodeSplitpanesNodes()
    this.redoLowCodeSplitters()
    this.resetLowCodePaneSizes()
    this.$emit('ready')
    this.ready = true
  },
  beforeUnmount() {
    this.ready = false
  },
  methods: {
    updateLowCodePaneComponents() {
      this.panes.forEach((item) => {
        item.update &&
          item.update({
            [this.horizontal ? 'height' : 'width']: `${this.indexedPanes[item.id].size}%`
          })
      })
    },
    bindEvents() {
      document.addEventListener('mousemove', this.onLowCodeMouseMove, { passive: false })
      document.addEventListener('mouseup', this.onLowCodeMouseUp)
    },
    unbindEvents() {
      document.removeEventListener('mousemove', this.onLowCodeMouseMove, { passive: false })
      document.removeEventListener('mouseup', this.onLowCodeMouseUp)
    },
    onMouseDown(event, splitterLowCodeIndex) {
      this.bindEvents()
      this.touch.mouseDown = true
      this.touch.activeSplitter = splitterLowCodeIndex
    },

    onLowCodeMouseMove(event) {
      if (this.touch.mouseDown) {
        event.preventDefault()
        this.touch.dragging = true
        this.calculatePanesSize(this.getCurrentMouseDrag(event))
        this.$emit(
          'resize',
          this.panes.map((pane) => ({ min: pane.min, max: pane.max, size: pane.size }))
        )
      }
    },

    onLowCodeMouseUp() {
      if (this.touch.dragging) {
        this.$emit(
          'resized',
          this.panes.map((pane) => ({ min: pane.min, max: pane.max, size: pane.size }))
        )
      }
      this.touch.mouseDown = false
      setTimeout(() => {
        this.touch.dragging = false
        this.unbindEvents()
      }, 100)
    },
    onSplitterClick(event, splitterLowCodeIndex) {
      if ('ontouchstart' in window) {
        event.preventDefault()
        if (this.dblClickSplitter) {
          if (this.lowcodeSplitterTaps.splitter === splitterLowCodeIndex) {
            clearTimeout(this.lowcodeSplitterTaps.timeoutId)
            this.lowcodeSplitterTaps.timeoutId = null
            this.onSplitterDblClick(event, splitterLowCodeIndex)
            this.lowcodeSplitterTaps.splitter = null
          } else {
            this.lowcodeSplitterTaps.splitter = splitterLowCodeIndex
            this.lowcodeSplitterTaps.timeoutId = setTimeout(() => {
              this.lowcodeSplitterTaps.splitter = null
            }, 500)
          }
        }
      }

      if (!this.touch.dragging) this.$emit('splitter-click', this.panes[splitterLowCodeIndex])
    },
    onSplitterDblClick(event, splitterLowCodeIndex) {
      let totalMinSizes = 0
      this.panes = this.panes.map((pane, i) => {
        pane.size = i === splitterLowCodeIndex ? pane.max : pane.min
        if (i !== splitterLowCodeIndex) totalMinSizes += pane.min

        return pane
      })
      this.panes[splitterLowCodeIndex].size -= totalMinSizes
      this.$emit('pane-maximize', this.panes[splitterLowCodeIndex])
    },

    onPaneClick(event, paneId) {
      this.$emit('pane-click', this.indexedPanes[paneId])
    },
    getCurrentMouseDrag(event) {
      const rect = this.container.getBoundingClientRect()
      const { clientX, clientY } = 'ontouchstart' in window && event.touches ? event.touches[0] : event

      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      }
    },
    getCurrentDragPercentage(drag) {
      drag = drag[this.horizontal ? 'y' : 'x']
      const containerSize = this.container?.[this.horizontal ? 'clientHeight' : 'clientWidth'] || 0
      if (this.rtl && !this.horizontal) drag = containerSize - drag

      return (drag * 100) / containerSize
    },

    calculatePanesSize(drag) {
      const splitterLowCodeIndex = this.touch.activeSplitter
      let sums = {
        prevPanesSize: this.sumLowCodePrevPanesSize(splitterLowCodeIndex),
        nextPanesSize: this.sumLowCodeNextPanesSize(splitterLowCodeIndex),
        prevLowcodeReachedMinPanes: 0,
        nextLowCodeReachedMinPanes: 0
      }

      const minLowCodeDrag = 0 + (this.pushOtherPanes ? 0 : sums.prevPanesSize)
      const maxLowCodeDrag = 100 - (this.pushOtherPanes ? 0 : sums.nextPanesSize)
      const dragLowCodePercentage = Math.max(
        Math.min(this.getCurrentDragPercentage(drag), maxLowCodeDrag),
        minLowCodeDrag
      )
      let panesLowCodeToResize = [splitterLowCodeIndex, splitterLowCodeIndex + 1]
      let paneLowCodeBefore = this.panes[panesLowCodeToResize[0]] || null
      let paneLowCodeAfter = this.panes[panesLowCodeToResize[1]] || null

      const paneLowCodeBeforeMaxReached =
        paneLowCodeBefore.max < 100 && dragLowCodePercentage >= paneLowCodeBefore.max + sums.prevPanesSize
      const paneLowCodeAfterMaxReached =
        paneLowCodeAfter.max < 100 &&
        dragLowCodePercentage <= 100 - (paneLowCodeAfter.max + this.sumLowCodeNextPanesSize(splitterLowCodeIndex + 1))
      if (paneLowCodeBeforeMaxReached || paneLowCodeAfterMaxReached) {
        if (paneLowCodeBeforeMaxReached) {
          paneLowCodeBefore.size = paneLowCodeBefore.max
          paneLowCodeAfter.size = Math.max(100 - paneLowCodeBefore.max - sums.prevPanesSize - sums.nextPanesSize, 0)
        } else {
          paneLowCodeBefore.size = Math.max(
            100 - paneLowCodeAfter.max - sums.prevPanesSize - this.sumLowCodeNextPanesSize(splitterLowCodeIndex + 1),
            0
          )
          paneLowCodeAfter.size = paneLowCodeAfter.max
        }
        return
      }
      if (this.pushOtherPanes) {
        const vars = this.doPushOtherPanes(sums, dragLowCodePercentage)
        if (!vars) return
        ;({ sums, panesLowCodeToResize } = vars)
        paneLowCodeBefore = this.panes[panesLowCodeToResize[0]] || null
        paneLowCodeAfter = this.panes[panesLowCodeToResize[1]] || null
      }

      if (paneLowCodeBefore !== null) {
        paneLowCodeBefore.size = Math.min(
          Math.max(dragLowCodePercentage - sums.prevPanesSize - sums.prevLowcodeReachedMinPanes, paneLowCodeBefore.min),
          paneLowCodeBefore.max
        )
      }
      if (paneLowCodeAfter !== null) {
        paneLowCodeAfter.size = Math.min(
          Math.max(
            100 - dragLowCodePercentage - sums.nextPanesSize - sums.nextLowCodeReachedMinPanes,
            paneLowCodeAfter.min
          ),
          paneLowCodeAfter.max
        )
      }
    },

    doPushOtherPanes(sums, dragLowCodePercentage) {
      const splitterLowCodeIndex = this.touch.activeSplitter
      const panesLowCodeToResize = [splitterLowCodeIndex, splitterLowCodeIndex + 1]
      if (dragLowCodePercentage < sums.prevPanesSize + this.panes[panesLowCodeToResize[0]].min) {
        panesLowCodeToResize[0] = this.findPrevExpandedPane(splitterLowCodeIndex).index

        sums.prevLowcodeReachedMinPanes = 0
        if (panesLowCodeToResize[0] < splitterLowCodeIndex) {
          this.panes.forEach((pane, i) => {
            if (i > panesLowCodeToResize[0] && i <= splitterLowCodeIndex) {
              pane.size = pane.min
              sums.prevLowcodeReachedMinPanes += pane.min
            }
          })
        }
        sums.prevPanesSize = this.sumLowCodePrevPanesSize(panesLowCodeToResize[0])
        if (panesLowCodeToResize[0] === undefined) {
          sums.prevLowcodeReachedMinPanes = 0
          this.panes[0].size = this.panes[0].min
          this.panes.forEach((pane, i) => {
            if (i > 0 && i <= splitterLowCodeIndex) {
              pane.size = pane.min
              sums.prevLowcodeReachedMinPanes += pane.min
            }
          })
          this.panes[panesLowCodeToResize[1]].size =
            100 - sums.prevLowcodeReachedMinPanes - this.panes[0].min - sums.prevPanesSize - sums.nextPanesSize
          return null
        }
      }
      if (dragLowCodePercentage > 100 - sums.nextPanesSize - this.panes[panesLowCodeToResize[1]].min) {
        panesLowCodeToResize[1] = this.findNextExpandedPane(splitterLowCodeIndex).index
        sums.nextLowCodeReachedMinPanes = 0
        if (panesLowCodeToResize[1] > splitterLowCodeIndex + 1) {
          this.panes.forEach((pane, i) => {
            if (i > splitterLowCodeIndex && i < panesLowCodeToResize[1]) {
              pane.size = pane.min
              sums.nextLowCodeReachedMinPanes += pane.min
            }
          })
        }
        sums.nextPanesSize = this.sumLowCodeNextPanesSize(panesLowCodeToResize[1] - 1)
        if (panesLowCodeToResize[1] === undefined) {
          sums.nextLowCodeReachedMinPanes = 0
          this.panes[this.panesCount - 1].size = this.panes[this.panesCount - 1].min
          this.panes.forEach((pane, i) => {
            if (i < this.panesCount - 1 && i >= splitterLowCodeIndex + 1) {
              pane.size = pane.min
              sums.nextLowCodeReachedMinPanes += pane.min
            }
          })
          this.panes[panesLowCodeToResize[0]].size =
            100 -
            sums.prevPanesSize -
            sums.nextLowCodeReachedMinPanes -
            this.panes[this.panesCount - 1].min -
            sums.nextPanesSize
          return null
        }
      }
      return { sums, panesLowCodeToResize }
    },
    sumLowCodePrevPanesSize(splitterLowCodeIndex) {
      return this.panes.reduce((total, pane, i) => total + (i < splitterLowCodeIndex ? pane.size : 0), 0)
    },
    sumLowCodeNextPanesSize(splitterLowCodeIndex) {
      return this.panes.reduce((total, pane, i) => total + (i > splitterLowCodeIndex + 1 ? pane.size : 0), 0)
    },
    findPrevExpandedPane(splitterLowCodeIndex) {
      const pane = [...this.panes].reverse().find((p) => p.index < splitterLowCodeIndex && p.size > p.min)
      return pane || {}
    },
    findNextExpandedPane(splitterLowCodeIndex) {
      const pane = this.panes.find((p) => p.index > splitterLowCodeIndex + 1 && p.size > p.min)
      return pane || {}
    },
    checkLowCodeSplitpanesNodes() {
      const children = Array.from(this.container.children)
      children.forEach((child) => {
        const isPane = child.classList.contains('splitpanes__pane')
        const isSplitter = child.classList.contains('splitpanes-lowcode__splitter')
        if (!isPane && !isSplitter) {
          child.parentNode.removeChild(child)
          return
        }
      })
    },

    addSplitter(paneIndex, nextPaneNode, isVeryFirst = false) {
      const splitterLowCodeIndex = paneIndex - 1
      const elm = document.createElement('div')
      elm.classList.add('splitpanes-lowcode__splitter')

      if (!isVeryFirst) {
        elm.onmousedown = (event) => this.onMouseDown(event, splitterLowCodeIndex)

        if (typeof window !== 'undefined' && 'ontouchstart' in window) {
          elm.ontouchstart = (event) => this.onMouseDown(event, splitterLowCodeIndex)
        }
        elm.onclick = (event) => this.onSplitterClick(event, splitterLowCodeIndex + 1)
      }

      if (this.dblClickSplitter) {
        elm.ondblclick = (event) => this.onSplitterDblClick(event, splitterLowCodeIndex + 1)
      }

      nextPaneNode.parentNode.insertBefore(elm, nextPaneNode)
    },

    removeSplitter(node) {
      node.onmousedown = undefined
      node.onclick = undefined
      node.ondblclick = undefined
      node.parentNode.removeChild(node)
    },

    redoLowCodeSplitters() {
      const children = Array.from(this.container.children)
      children.forEach((el) => {
        if (el.className.includes('splitpanes-lowcode__splitter')) this.removeSplitter(el)
      })
      let paneIndex = 0
      children.forEach((el) => {
        if (el.className.includes('splitpanes__pane')) {
          if (!paneIndex && this.firstSplitter) this.addSplitter(paneIndex, el, true)
          else if (paneIndex) this.addSplitter(paneIndex, el)
          paneIndex++
        }
      })
    },
    requestUpdate({ target, ...args }) {
      const pane = this.indexedPanes[target._.uid]
      Object.entries(args).forEach(([key, value]) => {
        pane[key] = value
      })
    },

    onPaneAdd(pane) {
      let index = -1
      Array.from(pane.$el.parentNode.children).some((el) => {
        if (el.className.includes('splitpanes__pane')) index++
        return el === pane.$el
      })

      const min = parseFloat(pane.minSize)
      const max = parseFloat(pane.maxSize)
      this.panes.splice(index, 0, {
        index,
        id: pane._.uid,
        max: isNaN(max) ? 100 : max,
        min: isNaN(min) ? 0 : min,
        givenSize: pane.size,
        size: pane.size === null ? null : parseFloat(pane.size),
        update: pane.update
      })

      this.panes.forEach((p, i) => {
        p.index = i
      })

      if (this.ready) {
        this.$nextTick(() => {
          this.redoLowCodeSplitters()
          this.resetLowCodePaneSizes({ addedPane: this.panes[index] })
          this.$emit('pane-add', {
            index,
            panes: this.panes.map((pane) => ({ min: pane.min, max: pane.max, size: pane.size }))
          })
        })
      }
    },

    onPaneRemove(pane) {
      const index = this.panes.findIndex((p) => p.id === pane._.uid)
      const removed = this.panes.splice(index, 1)[0]
      this.panes.forEach((p, i) => {
        p.index = i
      })

      this.$nextTick(() => {
        this.redoLowCodeSplitters()

        this.resetLowCodePaneSizes({ removedPane: { ...removed, index } })

        this.$emit('pane-remove', {
          removed,
          panes: this.panes.map((pane) => ({ min: pane.min, max: pane.max, size: pane.size }))
        })
      })
    },

    resetLowCodePaneSizes(changedPanes = {}) {
      if (!changedPanes.addedPane && !changedPanes.removedPane) this.initialPanesSizing()
      else if (this.panes.some((pane) => pane.givenSize !== null || pane.min || pane.max < 100))
        this.equalizeAfterAddOrRemove(changedPanes)
      else this.equalize()

      if (this.ready)
        this.$emit(
          'resized',
          this.panes.map((pane) => ({ min: pane.min, max: pane.max, size: pane.size }))
        )
    },

    equalize() {
      const equalSpace = 100 / this.panesCount
      let leftLowCodeToAllocate = 0
      let ungrowableLowCode = []
      let unshrinkableLowCode = []

      this.panes.forEach((pane) => {
        pane.size = Math.max(Math.min(equalSpace, pane.max), pane.min)

        leftLowCodeToAllocate -= pane.size
        if (pane.size >= pane.max) ungrowableLowCode.push(pane.id)
        if (pane.size <= pane.min) unshrinkableLowCode.push(pane.id)
      })

      if (leftLowCodeToAllocate > 0.1) this.readjustSizes(leftLowCodeToAllocate, ungrowableLowCode, unshrinkableLowCode)
    },

    initialPanesSizing() {
      let leftLowCodeToAllocate = 100
      let ungrowableLowCode = []
      let unshrinkableLowCode = []
      let definedSizes = 0
      this.panes.forEach((pane) => {
        leftLowCodeToAllocate -= pane.size
        if (pane.size !== null) definedSizes++
        if (pane.size >= pane.max) ungrowableLowCode.push(pane.id)
        if (pane.size <= pane.min) unshrinkableLowCode.push(pane.id)
      })

      let leftLowCodeToAllocate2 = 100
      if (leftLowCodeToAllocate > 0.1) {
        this.panes.forEach((pane) => {
          if (pane.size === null) {
            pane.size = Math.max(Math.min(leftLowCodeToAllocate / (this.panesCount - definedSizes), pane.max), pane.min)
          }
          leftLowCodeToAllocate2 -= pane.size
        })

        if (leftLowCodeToAllocate2 > 0.1)
          this.readjustSizes(leftLowCodeToAllocate, ungrowableLowCode, unshrinkableLowCode)
      }
    },

    equalizeAfterAddOrRemove({ addedPane } = {}) {
      let equalSpace = 100 / this.panesCount
      let leftLowCodeToAllocate = 0
      let ungrowableLowCode = []
      let unshrinkableLowCode = []

      if (addedPane && addedPane.givenSize !== null) {
        equalSpace = (100 - addedPane.givenSize) / (this.panesCount - 1)
      }
      this.panes.forEach((pane) => {
        leftLowCodeToAllocate -= pane.size
        if (pane.size >= pane.max) ungrowableLowCode.push(pane.id)
        if (pane.size <= pane.min) unshrinkableLowCode.push(pane.id)
      })

      if (Math.abs(leftLowCodeToAllocate) < 0.1) return // Ok.

      this.panes.forEach((pane) => {
        if (!(addedPane && addedPane.givenSize !== null && addedPane.id === pane.id)) {
          pane.size = Math.max(Math.min(equalSpace, pane.max), pane.min)
        }

        leftLowCodeToAllocate -= pane.size
        if (pane.size >= pane.max) ungrowableLowCode.push(pane.id)
        if (pane.size <= pane.min) unshrinkableLowCode.push(pane.id)
      })

      if (leftLowCodeToAllocate > 0.1) this.readjustSizes(leftLowCodeToAllocate, ungrowableLowCode, unshrinkableLowCode)
    },
    readjustSizes(leftLowCodeToAllocate, ungrowableLowCode, unshrinkableLowCode) {
      let equalLowCodeSpaceToAllocate
      if (leftLowCodeToAllocate > 0)
        equalLowCodeSpaceToAllocate = leftLowCodeToAllocate / (this.panesCount - ungrowableLowCode.length)
      else equalLowCodeSpaceToAllocate = leftLowCodeToAllocate / (this.panesCount - unshrinkableLowCode.length)

      this.panes.forEach((pane) => {
        if (leftLowCodeToAllocate > 0 && !ungrowableLowCode.includes(pane.id)) {
          const newLowCodePaneSize = Math.max(Math.min(pane.size + equalLowCodeSpaceToAllocate, pane.max), pane.min)
          const allocated = newLowCodePaneSize - pane.size
          leftLowCodeToAllocate -= allocated
          pane.size = newLowCodePaneSize
        } else if (!unshrinkableLowCode.includes(pane.id)) {
          const newLowCodePaneSize = Math.max(Math.min(pane.size + equalLowCodeSpaceToAllocate, pane.max), pane.min)
          const allocated = newLowCodePaneSize - pane.size
          leftLowCodeToAllocate -= allocated
          pane.size = newLowCodePaneSize
        }
        pane.update({
          [this.horizontal ? 'height' : 'width']: `${this.indexedPanes[pane.id].size}%`
        })
      })

      if (Math.abs(leftLowCodeToAllocate) > 0.1) {
        this.$nextTick(() => {
          if (this.ready) {
            // eslint-disable-next-line no-console
            console.warn('Splitpanes: Could not resize panes correctly due to their constraints.')
          }
        })
      }
    }
  },

  render() {
    return h(
      'div',
      {
        class: [
          `splitpanes--${this.horizontal ? 'horizontal' : 'vertical'}`,
          'splitpanes',
          {
            'splitpanes--dragging': this.touch.dragging
          }
        ],
        ref: 'container'
      },
      this.$slots.default()
    )
  }
}
</script>

<style lang="less">
.splitpanes {
  height: 100%;
  width: 100%;
  display: flex;

  &--horizontal {
    flex-direction: column;
  }
  &--vertical {
    flex-direction: row;
  }
  &--dragging * {
    user-select: none;
  }

  &__splitter {
    touch-action: none;
  }
  &__pane {
    height: 100%;
    overflow: hidden;
    width: 100%;

    .splitpanes--horizontal & {
      transition: height 0.3s ease-out;
    }
    .splitpanes--vertical & {
      transition: width 0.3s ease-out;
    }
    .splitpanes--dragging & {
      transition: none;
    }
  }
  &--vertical > .splitpanes-lowcode__splitter {
    min-width: 1px;
    cursor: col-resize;
  }
  &--horizontal > .splitpanes-lowcode__splitter {
    min-height: 1px;
    cursor: row-resize;
  }
}
.splitpanes.default-theme {
  .splitpanes__pane {
    background-color: #f2f2f2;
  }
  .splitpanes-lowcode__splitter {
    background-color: #fff;
    box-sizing: border-box;
    position: relative;
    flex-shrink: 0;
    &:before,
    &:after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      background-color: rgba(0, 0, 0, 0.15);
      transition: background-color 0.3s;
    }
    &:hover:before,
    &:hover:after {
      background-color: rgba(0, 0, 0, 0.25);
    }
    &:first-child {
      cursor: auto;
    }
  }
}
.default-theme {
  &.splitpanes .splitpanes .splitpanes-lowcode__splitter {
    z-index: 1;
  }
  &.splitpanes--vertical > .splitpanes-lowcode__splitter,
  .splitpanes--vertical > .splitpanes-lowcode__splitter {
    width: 7px;
    border-left: 1px solid #eee;
    margin-left: -1px;
    &:after,
    &:before {
      width: 1px;
      transform: translateY(-50%);
      height: 30px;
    }
    &:after {
      margin-left: 1px;
    }
    &:before {
      margin-left: -2px;
    }
  }
  &.splitpanes--horizontal > .splitpanes-lowcode__splitter,
  .splitpanes--horizontal > .splitpanes-lowcode__splitter {
    border-top: 1px solid #eee;
    margin-top: -1px;
    height: 7px;
    &:after,
    &:before {
      height: 1px;
      transform: translateX(-50%);
      width: 30px;
    }
    &:before {
      margin-top: -2px;
    }
    &:after {
      margin-top: 1px;
    }
  }
}
</style>
