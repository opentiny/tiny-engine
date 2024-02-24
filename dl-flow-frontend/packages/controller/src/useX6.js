import { Graph, Path } from '@antv/x6'
import { register } from '@antv/x6-vue-shape'
import { AlgoNode, GroupNode } from '@opentiny/tiny-engine-canvas'
import { Selection } from '@antv/x6-plugin-selection'
import { Keyboard } from '@antv/x6-plugin-keyboard'
/**
 * @typedef {Object}
 * @prop {'L1Decay' | 'L2Decay'} type
 * @prop {number} val
 */
/**
 * @typedef {Object} ParamAttr
 * @prop {string} id
 * @prop {string} [name]
 * @prop {null} [initializer]
 * @prop {number} [learning_rate]
 * @prop {Regularizer} [regularizer]
 * @prop {boolean} [trainable]
 * @prop {boolean} [do_model_average]
 * @prop {boolean} [need_clip]
 */
/**
 * @typedef {Object} Property
 * @property {number} order
 * @property {string} id
 * @property {{zh_CN:string,en_US:string}} label
 * @property {'number'|'string'|'boolean'|'enums'|'ParamAttr'|'list'} type
 * @property {{id:number,label:string,value:any,default?:boolean}[]} [enums]
 * @property {any} default
 * @property {'boolean'|'string'|'number'} [items]
 * @prop {number | string | boolean | ParamAttr} data - 用于存储Property数据
 */
/**
 * @typedef {Object} MaterialInfo - 物料信息
 * @prop {string} id 用于标识以及转码时候插入
 * @prop {{zh_CN: string, en_US: string}} label - 物料名称
 * @prop {string|undefined} nnName - 如果为网络，网络名称
 * @prop {string} desc - 简介
 * @prop {boolean} nn - 是否为网络
 * @prop {'nn'|'layer'|'backbone'|'utils'} mode
 * @prop {Property[]} properties - 配置信息
 */
/**
 * @typedef {{materials: MaterialInfo[]}} Materials
 */
/**
 *
 * @param {`in-${string}` | `out-${string}`} a
 * @param {`in-${string}` | `out-${string}`} b
 */
/**
 * @type {Graph|null}
 */
let g = null
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
    validateMagnet() {
      return true;
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
        edge: { source, target },
      } = args
      const [sourceCell, targetCell] = [g.getCellById(source.cell), g.getCellById(target.cell)];
      if (!sourceCell.isNode() || !targetCell.isNode()){
        return false;
      }
      let group = null;
      if (sourceCell.getChildCount() || targetCell.getChildren()){
        group = sourceCell.getChildCount() ? sourceCell : targetCell;
      }
      if (!group){
        return (
          (source.port.includes('in') && target.port.includes('out')) ||
          (source.port.includes('out') && target.port.includes('in'))
        )
      }
      return (source.port.includes('in') && target.port.includes('in') ||
              source.port.includes('out') && target.port.includes('out'))
    }
  }
}
let ready = false
const graphPreapre = () => {
  if (ready) {
    return ready
  }
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
  register({
    shape: 'group-node',
    component: GroupNode,
    zIndex: -1,
    ports: {
      groups: {
        top: {
          position: {
            name: 'top',
          },
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#C2C8D5',
              strokeWidth: 1,
              fill: '#fff',
            },
          },
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
        },
      }
    }
  })
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
  ready = true
  return ready
}
export const getCanvas = () => g

/**
 *
 * @param {Property} property
 * @param {{[x:string]:import('./useResource').Type}[]} externalType
 */
const processDefaultValue = (property, externalType) => {
  /**
   * @type {import('./useResource').Type[]}
   */
  const paramAttr = externalType.ParamAttr
  let data = {}
  switch (property.type) {
    case 'string':
      return property.default ?? ''
    case 'number':
      return property.default ?? 0
    case 'boolean':
      return property.default ?? false
    case 'enums':
      return property.enums.filter((v) => v.default)[0].value
    case 'ParamAttr':
      for (const attr of paramAttr) {
        data[attr.id] = processDefaultValue(attr, externalType)
      }
      return data
    default:
      return '';
  }
}
/**
 *
 * @param {MaterialInfo} info
 * @param {{[x:string]:import('./useResource').Type[]}} types
 */
const addNode = (info, types) => {
  const g = getCanvas()
  if (info.properties) {
    info.properties = info.properties.map((p) => {
      let data = null
      if (!data) {
        switch (p.type) {
          case 'string':
          case 'number':
          case 'boolean':
            data = p.default
            break
          case 'enums':
            data = p.enums.filter((v) => v.default)[0].value
            break
          case 'any':
            data = '';
            break;
          case 'ParamAttr':
            data = processDefaultValue(p, types)
            break
        }
      }
      return {
        ...p,
        data
      }
    })
  }
  const node = g.addNode({
    shape: 'dag-node',
    data: {
      ...info
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
  if (!g.getSelectedCellCount()) {
    g.centerCell(node)
    return
  }
  const selectNode = g.getSelectedCells().sort((a, b) => a.getBBox().bottom - b.getBBox().bottom)[0]
  const {
    bottom,
    center: { x }
  } = selectNode.getBBox()
  const { height } = node.getSize()
  node.setPosition({ x: x, y: bottom + height })
}
/**
 * @template T
 * @param {import('@antv/x6')['Cell']} cell
 * @returns {T extends any ? MaterialInfo : T}
 */
const getData = (cell) => {
  return cell.getData()
}

const GROUP_PADDING = 20;
/**
 * 
 * @param {import('@antv/x6').Graph} g 
 * @param {Object} [obj]
 */
const reRender = (g, obj) => {
  g.fromJSON(obj, {silent: false});
  const node = g.getCells()[0];
  if (!node.isNode()){
    return;
  }
  g.centerCell(node);
  return;
}

/**
 *
 * @param {string} [id]
 * @param {Partial<import('@antv/x6').Graph.Options>} [option]
 */
const useX6 = (id, option) => {
  if (!graphPreapre()) {
    throw new Error('出现未知错误')
  }
  if (!g) {
    g = new Graph({
      container: document.getElementById(id),
      ...{
        ...option,
        ...DEFAULT_OPTION,
        embedding: {
          enabled: true,
        },
        mousewheel: {
          enable: true,
          modifiers: ['alt']
        }
      }
    })
    g.use(
      new Selection({
        enabled: true,
        multiple: true,
        rubberband: true,
        movable: true,
        showNodeSelectionBox: true,
        modifiers: ['alt']
      })
    )
    g.use(new Keyboard())
    g.bindKey('delete', () => {
      const selectCells = g.getSelectedCells()
      g.removeCells(selectCells)
    })
  }
  return { g: g, addNode, getCanvas, getData, GROUP_PADDING, reRender}
}

export default useX6
