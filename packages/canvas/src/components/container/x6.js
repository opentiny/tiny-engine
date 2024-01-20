import { Graph, Path } from '@antv/x6'
/**
 *
 * @param {`in-${string}` | `out-${string}`} a
 * @param {`in-${string}` | `out-${string}`} b
 */
/** @type {Graph | undefined} */
let g
/** @type {import('@antv/x6').Graph.Options} */
const DEFAULT_OPTION = {
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
  autoResize: true,
  connecting: {
    snap: true,
    allowBlank: false,
    allowLoop: false,
    highlight: true,
    allowNode: false,
    connector: 'algo-connector',
    connectionPoint: 'anchor',
    anchor: 'center',
    validateMagnet(args) {
      const { magnet } = args
      return magnet.getAttribute('port-group') !== 'top'
    },
    createEdge() {
      return g.createEdge({
        shape: 'dag-edge',
        attrs: {
          line: {
            strokeDasharray: '5 5'
          }
        },
        zIndex: -1
      })
    },
    validateEdge(args) {
      const {
        edge: { source, target }
      } = args
      return (
        (source.port.includes('in') && target.port.includes('out')) ||
        (source.port.includes('out') && target.port.includes('in'))
      )
    }
  }
}

const graphPreapre = () => {
  Graph.registerEdge(
    'dag-edge',
    {
      inherit: 'edge',
      attrs: {
        line: {
          stroke: '#C2C8D5',
          strokeWidth: 1,
          targetMarker: null
        }
      }
    },
    true
  )
  Graph.registerConnector(
    'algo-connector',
    (s, e) => {
      const offset = 4
      const deltaY = Math.abs(e.y - s.y)
      const control = Math.floor((deltaY / 3) * 2)

      const v1 = { x: s.x, y: s.y + offset + control }
      const v2 = { x: e.x, y: e.y - offset - control }

      return Path.normalize(
        `M ${s.x} ${s.y}
           L ${s.x} ${s.y + offset}
           C ${v1.x} ${v1.y} ${v2.x} ${v2.y} ${e.x} ${e.y - offset}
           L ${e.x} ${e.y}
          `
      )
    },
    true
  )
  // TODO: 从后端获取node
  return true
}

/**
 *
 * @param {string} id
 * @param {Partial<import('@antv/x6').Graph.Options>} option
 * @returns {Graph}
 */
export const useX6 = (id, option) => {
  if (g) {
    return g
  }

  if (!graphPreapre()) {
    throw new Error('出现未知错误')
  }
  g = new Graph({
    container: document.getElementById(id),
    ...{
      ...option,
      ...DEFAULT_OPTION
    }
  })
  return g
}

/**
 *
 * @returns {Graph | null}
 */
export const getX6 = () => g

/**
 * @param {string} name
 * @returns {import('@antv/x6').Node | undefined}
 */
export const addNode = (name) => {
  const x6 = getX6()
  if (!x6) {
    return
  }
  const node = x6.addNode(name)
  return node
}
